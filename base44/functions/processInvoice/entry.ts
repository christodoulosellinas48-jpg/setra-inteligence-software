import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CATEGORY_CODE_MAP = {
  food_beverage: 'FOOD_BEV',
  staff_costs: 'STAFF',
  fixed_costs: 'FIXED',
  utilities: 'UTIL',
  operating_expenses: 'OPEX',
  one_off_expenses: 'ONE_OFF',
  packaging: 'OPEX',
  other: 'OPEX'
};

const inferInventoryCategory = (expCat, description) => {
  const desc = (description || '').toLowerCase();
  if (expCat === 'food_beverage') {
    if (desc.match(/beef|pork|lamb|chicken|veal|meat|steak|mince|sausage|bacon|ribs/)) return 'meat_fish';
    if (desc.match(/fish|salmon|cod|tuna|sea|prawn|shrimp|squid|octopus/)) return 'meat_fish';
    if (desc.match(/milk|cheese|cream|butter|yogurt|dairy/)) return 'dairy';
    if (desc.match(/tomato|lettuce|pepper|onion|garlic|potato|vegetable|fruit|herb|salad/)) return 'produce';
    if (desc.match(/beer|wine|spirit|vodka|whisky|gin|liquor|drink|juice|water|soda/)) return 'beverages';
    if (desc.match(/flour|sugar|rice|pasta|oil|sauce|tin|can|dried|spice/)) return 'dry_goods';
    return 'dry_goods';
  }
  if (expCat === 'operating_expenses' || expCat === 'packaging') return 'packaging';
  return 'other';
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      business_id,
      expense_document_id,
      document_id, // from Bookkeeping Inbox approval
      supplier_name,
      supplier_vat_number,
      invoice_date,
      due_date,
      invoice_number,
      expense_category: rawCategory,
      line_items,
      invoice_total,
      vat_included,
      vat_amount,
      net_amount,
      vat_rate: invoiceVatRate
    } = await req.json();

    if (!business_id || !supplier_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mark documents as processing
    if (expense_document_id) {
      await base44.entities.ExpenseDocument.update(expense_document_id, { status: 'processing' });
    }
    if (document_id) {
      await base44.entities.Document.update(document_id, { status: 'approved' });
    }

    // Re-validate / improve the category via the dedicated AI categorizer
    let expense_category = rawCategory;
    try {
      const catResponse = await base44.asServiceRole.functions.invoke('categorizeInvoice', {
        business_id,
        supplier_name,
        line_items: line_items || [],
        gross_total: invoice_total
      });
      if (catResponse?.category) {
        expense_category = catResponse.category;
        // Update the expense document with the AI-validated category
        if (expense_document_id) {
          await base44.entities.ExpenseDocument.update(expense_document_id, {
            expense_category,
            notes: catResponse.reason ? `AI category: ${catResponse.reason}` : undefined
          });
        }
      }
    } catch (_) {
      // Use rawCategory as-is if categorizer fails
    }

    const results = {
      supplier: null,
      supplier_action: null,
      ledger_entry: null,
      vat_line: null,
      vat_period_updated: false,
      inventory_updates: [],
      inventory_created: [],
      purchase_records: [],
      document_lines: [],
      snapshot_updated: false
    };

    // 1. Create or update Supplier record
    const existingSuppliers = await base44.entities.Supplier.filter({ business_id, name: supplier_name });
    if (existingSuppliers.length > 0) {
      const existing = existingSuppliers[0];
      await base44.entities.Supplier.update(existing.id, {
        total_spend: (existing.total_spend || 0) + (invoice_total || 0),
        invoice_count: (existing.invoice_count || 0) + 1,
        last_order_date: invoice_date || new Date().toISOString().split('T')[0],
        category: expense_category || existing.category
      });
      results.supplier = supplier_name;
      results.supplier_action = 'updated';
    } else {
      await base44.entities.Supplier.create({
        business_id,
        name: supplier_name,
        category: expense_category || 'other',
        total_spend: invoice_total || 0,
        invoice_count: 1,
        last_order_date: invoice_date || new Date().toISOString().split('T')[0]
      });
      results.supplier = supplier_name;
      results.supplier_action = 'created';
    }

    // 2. Calculate VAT amounts
    const businesses = await base44.entities.Business.filter({ id: business_id });
    const vatRate = invoiceVatRate || businesses[0]?.vat_rate || 19;
    const grossAmount = invoice_total || 0;

    let finalNetAmount = net_amount || grossAmount;
    let finalVatAmount = vat_amount || 0;

    if (!vat_amount && vat_included && grossAmount > 0) {
      finalNetAmount = parseFloat((grossAmount / (1 + vatRate / 100)).toFixed(2));
      finalVatAmount = parseFloat((grossAmount - finalNetAmount).toFixed(2));
    } else if (!net_amount && !vat_amount) {
      finalNetAmount = grossAmount;
      finalVatAmount = 0;
    }

    // 3. Create LedgerEntry
    const ledgerEntry = await base44.entities.LedgerEntry.create({
      business_id,
      date: invoice_date || new Date().toISOString().split('T')[0],
      entry_type: 'expense',
      category_code: CATEGORY_CODE_MAP[expense_category] || 'OPEX',
      net_amount: finalNetAmount,
      vat_amount: finalVatAmount,
      gross_amount: grossAmount,
      source: 'document',
      source_id: expense_document_id || null,
      posted: true,
      vat_direction: 'input',
      description: `${supplier_name} — ${expense_category?.replace(/_/g, ' ') || 'expense'}`
    });
    results.ledger_entry = ledgerEntry.id;

    // 4. VAT period update
    if (finalVatAmount > 0) {
      const vatPeriods = await base44.entities.VATPeriod.filter({ business_id, status: 'open' });
      if (vatPeriods.length > 0) {
        const vatPeriod = vatPeriods[0];
        await base44.entities.VATSummaryLine.create({
          vat_period_id: vatPeriod.id,
          vat_rate_code: String(Math.round(vatRate)),
          taxable_base: finalNetAmount,
          vat_amount: finalVatAmount,
          direction: 'input'
        });
        await base44.entities.VATPeriod.update(vatPeriod.id, {
          input_vat: (vatPeriod.input_vat || 0) + finalVatAmount,
          net_vat_payable: ((vatPeriod.output_vat || 0) - ((vatPeriod.input_vat || 0) + finalVatAmount))
        });
        results.vat_period_updated = true;
      }
    }

    // 5. Line items: DocumentLines + Inventory + Purchases
    if (line_items && line_items.length > 0) {
      const allInventory = await base44.entities.InventoryItem.filter({ business_id });

      for (const item of line_items) {
        if (!item.description) continue;
        const qty = item.quantity || 1;
        const unitCost = item.unit_price || (item.total ? item.total / qty : 0);
        const lineNet = item.line_net || (unitCost * qty);
        const lineVat = item.vat_amount || 0;
        const lineGross = item.line_gross || (lineNet + lineVat);

        // Create DocumentLine
        if (expense_document_id) {
          await base44.entities.DocumentLine.create({
            document_id: expense_document_id,
            description: item.description,
            qty,
            unit_price_net: unitCost,
            line_net: lineNet,
            vat_rate_code: item.vat_rate ? String(Math.round(item.vat_rate)) : String(Math.round(vatRate)),
            vat_amount: lineVat,
            line_gross: lineGross,
            category_code: CATEGORY_CODE_MAP[expense_category] || 'OPEX',
            confidence_score: item.confidence || 0.9,
            categorization_reason: 'ai'
          });
          results.document_lines.push(item.description);
        }

        // Inventory tracking
        const shouldTrackInventory = ['food_beverage', 'operating_expenses', 'packaging'].includes(expense_category);
        if (shouldTrackInventory) {
          const descLower = item.description.toLowerCase().trim();
          const match = allInventory.find(inv =>
            inv.ingredient_name && inv.ingredient_name.toLowerCase().trim() === descLower
          );

          if (match) {
            await base44.entities.InventoryItem.update(match.id, {
              current_stock: (match.current_stock || 0) + qty,
              unit_cost: unitCost || match.unit_cost,
              supplier_name,
              last_restocked_date: invoice_date || new Date().toISOString().split('T')[0]
            });
            results.inventory_updates.push(match.ingredient_name);
          } else {
            const newItem = await base44.entities.InventoryItem.create({
              business_id,
              ingredient_name: item.description,
              unit: item.unit || 'kg',
              current_stock: qty,
              unit_cost: unitCost,
              supplier_name,
              last_restocked_date: invoice_date || new Date().toISOString().split('T')[0],
              category: inferInventoryCategory(expense_category, item.description)
            });
            results.inventory_created.push(newItem.ingredient_name);
          }

          if (expense_category === 'food_beverage') {
            await base44.entities.Purchase.create({
              business_id,
              supplier_name,
              date: invoice_date || new Date().toISOString().split('T')[0],
              ingredient_name: item.description,
              qty,
              unit: item.unit || 'kg',
              total_cost: lineNet || (unitCost * qty)
            });
            results.purchase_records.push(item.description);
          }
        }
      }
    }

    // 6. Update FinancialSnapshot for current month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const existingSnapshots = await base44.entities.FinancialSnapshot.filter({
      business_id,
      period_start: monthStart
    });

    const CATEGORY_TO_SNAPSHOT_FIELD = {
      food_beverage: 'purchases_food_bev',
      staff_costs: 'staff_costs',
      fixed_costs: 'rent_fixed_costs',
      utilities: 'utilities',
      operating_expenses: 'other_operating',
      one_off_expenses: 'other_operating'
    };

    const snapshotField = CATEGORY_TO_SNAPSHOT_FIELD[expense_category];

    if (snapshotField) {
      if (existingSnapshots.length > 0) {
        const snap = existingSnapshots[0];
        await base44.entities.FinancialSnapshot.update(snap.id, {
          [snapshotField]: (snap[snapshotField] || 0) + grossAmount,
          total_expenses: (snap.total_expenses || 0) + grossAmount,
          updated_at: new Date().toISOString()
        });
      } else {
        await base44.entities.FinancialSnapshot.create({
          business_id,
          period_start: monthStart,
          period_end: monthEnd,
          period_type: 'monthly',
          [snapshotField]: grossAmount,
          total_expenses: grossAmount
        });
      }
      results.snapshot_updated = true;
    }

    // 7. Mark ExpenseDocument as posted with automation result summary
    if (expense_document_id) {
      await base44.entities.ExpenseDocument.update(expense_document_id, {
        status: 'posted',
        automation_result: JSON.stringify({
          supplier: results.supplier_action,
          ledger: 'created',
          vat_updated: results.vat_period_updated,
          inventory_updated: results.inventory_updates.length,
          inventory_created: results.inventory_created.length,
          purchases: results.purchase_records.length,
          snapshot: results.snapshot_updated
        })
      });
    }
    // Mark bookkeeping Document as posted
    if (document_id) {
      await base44.entities.Document.update(document_id, { status: 'posted' });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    // Mark as failed if we have a document id
    try {
      const base44 = createClientFromRequest(req);
      const body = await req.json().catch(() => ({}));
      if (body.expense_document_id) {
        await base44.entities.ExpenseDocument.update(body.expense_document_id, { status: 'failed' });
      }
    } catch (_) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});