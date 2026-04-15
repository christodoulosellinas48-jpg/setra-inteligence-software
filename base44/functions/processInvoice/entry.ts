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
      document_id,
      supplier_name,
      supplier_vat_number,
      invoice_date,
      due_date,
      invoice_number,
      expense_category,
      line_items,
      invoice_total,
      vat_included,
      vat_amount,
      net_amount
    } = await req.json();

    if (!business_id || !supplier_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const results = {
      supplier: null,
      ledger_entry: null,
      vat_line: null,
      inventory_updates: [],
      inventory_created: [],
      purchase_records: [],
      document_lines: []
    };

    // 1. Create or update Supplier record
    const existingSuppliers = await base44.entities.Supplier.filter({ business_id, name: supplier_name });

    if (existingSuppliers.length > 0) {
      const existing = existingSuppliers[0];
      const updated = await base44.entities.Supplier.update(existing.id, {
        total_spend: (existing.total_spend || 0) + (invoice_total || 0),
        invoice_count: (existing.invoice_count || 0) + 1,
        last_order_date: invoice_date || new Date().toISOString().split('T')[0],
        category: expense_category || existing.category
      });
      results.supplier = updated;
    } else {
      const newSupplier = await base44.entities.Supplier.create({
        business_id,
        name: supplier_name,
        category: expense_category || 'other',
        total_spend: invoice_total || 0,
        invoice_count: 1,
        last_order_date: invoice_date || new Date().toISOString().split('T')[0]
      });
      results.supplier = newSupplier;
    }

    // 2. Create LedgerEntry
    const grossAmount = invoice_total || 0;
    const businesses = await base44.entities.Business.filter({ id: business_id });
    const vatRate = businesses[0]?.vat_rate || 19;

    let finalNetAmount = net_amount || grossAmount;
    let finalVatAmount = vat_amount || 0;

    if (!vat_amount && vat_included && grossAmount > 0) {
      finalNetAmount = parseFloat((grossAmount / (1 + vatRate / 100)).toFixed(2));
      finalVatAmount = parseFloat((grossAmount - finalNetAmount).toFixed(2));
    }

    const ledgerEntry = await base44.entities.LedgerEntry.create({
      business_id,
      date: invoice_date || new Date().toISOString().split('T')[0],
      entry_type: 'expense',
      category_code: CATEGORY_CODE_MAP[expense_category] || 'OPEX',
      net_amount: finalNetAmount,
      vat_amount: finalVatAmount,
      gross_amount: grossAmount,
      source: 'document',
      source_id: document_id || null,
      posted: false,
      vat_direction: 'input',
      description: `${supplier_name} — ${expense_category?.replace(/_/g, ' ') || 'expense'}`
    });
    results.ledger_entry = ledgerEntry;

    // 3. VATSummaryLine + update VAT period
    if (finalVatAmount > 0) {
      const vatPeriods = await base44.entities.VATPeriod.filter({ business_id, status: 'open' });
      if (vatPeriods.length > 0) {
        const vatPeriod = vatPeriods[0];
        const vatLine = await base44.entities.VATSummaryLine.create({
          vat_period_id: vatPeriod.id,
          vat_rate_code: String(vatRate),
          taxable_base: finalNetAmount,
          vat_amount: finalVatAmount,
          direction: 'input'
        });
        results.vat_line = vatLine;

        await base44.entities.VATPeriod.update(vatPeriod.id, {
          input_vat: (vatPeriod.input_vat || 0) + finalVatAmount,
          net_vat_payable: ((vatPeriod.output_vat || 0) - ((vatPeriod.input_vat || 0) + finalVatAmount))
        });
      }
    }

    // 4. Create DocumentLines + update/create inventory + Purchase records
    if (line_items && line_items.length > 0) {
      const allInventory = await base44.entities.InventoryItem.filter({ business_id });

      for (const item of line_items) {
        if (!item.description) continue;
        const qty = item.quantity || 1;
        const unitCost = item.unit_price || (item.total ? item.total / qty : 0);
        const lineNet = item.line_net || (unitCost * qty);
        const lineVat = item.vat_amount || 0;
        const lineGross = item.line_gross || (lineNet + lineVat);

        // Create DocumentLine if we have a document_id
        if (document_id) {
          const docLine = await base44.entities.DocumentLine.create({
            document_id,
            description: item.description,
            qty,
            unit_price_net: unitCost,
            line_net: lineNet,
            vat_rate_code: item.vat_rate_code || String(vatRate),
            vat_amount: lineVat,
            line_gross: lineGross,
            category_code: CATEGORY_CODE_MAP[expense_category] || 'OPEX',
            confidence_score: item.confidence || 0.9,
            categorization_reason: 'ai'
          });
          results.document_lines.push(docLine);
        }

        // Inventory update/create for food_beverage and packaging
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

          // Create Purchase record for food/bev items
          if (expense_category === 'food_beverage') {
            const purchaseRecord = await base44.entities.Purchase.create({
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

    // 5. Mark document as approved/posted if it was passed
    if (document_id) {
      await base44.entities.Document.update(document_id, {
        status: 'posted',
        net_total: finalNetAmount,
        vat_total: finalVatAmount,
        gross_total: grossAmount,
        supplier_vat_number: supplier_vat_number || null,
        invoice_number: invoice_number || null,
        due_date: due_date || null
      });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});