import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const CATEGORY_CODE_MAP = {
  food_beverage: 'FOOD_BEV',
  staff_costs: 'STAFF',
  fixed_costs: 'FIXED',
  utilities: 'UTIL',
  operating_expenses: 'OPEX',
  one_off_expenses: 'ONE_OFF',
  other: 'OPEX'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { business_id, supplier_name, invoice_date, expense_category, line_items, invoice_total, vat_included } = await req.json();

    if (!business_id || !supplier_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const results = { supplier: null, ledger_entry: null, vat_line: null, inventory_updates: [], inventory_created: [] };

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

    // 2. Create LedgerEntry (unposted, for manual review)
    const grossAmount = invoice_total || 0;
    const business = await base44.entities.Business.filter({ id: business_id });
    const vatRate = business[0]?.vat_rate || 19;

    let netAmount = grossAmount;
    let vatAmount = 0;

    if (vat_included && grossAmount > 0) {
      // Back-calculate net and VAT from gross
      netAmount = parseFloat((grossAmount / (1 + vatRate / 100)).toFixed(2));
      vatAmount = parseFloat((grossAmount - netAmount).toFixed(2));
    }

    const ledgerEntry = await base44.entities.LedgerEntry.create({
      business_id,
      date: invoice_date || new Date().toISOString().split('T')[0],
      entry_type: 'expense',
      category_code: CATEGORY_CODE_MAP[expense_category] || 'OPEX',
      net_amount: netAmount,
      vat_amount: vatAmount,
      gross_amount: grossAmount,
      source: 'document',
      posted: false,
      vat_direction: 'input',
      description: `${supplier_name} — ${expense_category?.replace(/_/g, ' ') || 'expense'}`
    });
    results.ledger_entry = ledgerEntry;

    // 3. Create VATSummaryLine if VAT is present
    if (vatAmount > 0) {
      // Find open VAT period for this business
      const vatPeriods = await base44.entities.VATPeriod.filter({ business_id, status: 'open' });
      if (vatPeriods.length > 0) {
        const vatPeriod = vatPeriods[0];
        const vatLine = await base44.entities.VATSummaryLine.create({
          vat_period_id: vatPeriod.id,
          vat_rate_code: String(vatRate),
          taxable_base: netAmount,
          vat_amount: vatAmount,
          direction: 'input'
        });
        results.vat_line = vatLine;

        // Update VAT period totals
        await base44.entities.VATPeriod.update(vatPeriod.id, {
          input_vat: (vatPeriod.input_vat || 0) + vatAmount,
          net_vat_payable: ((vatPeriod.output_vat || 0) - ((vatPeriod.input_vat || 0) + vatAmount))
        });
      }
    }

    // 4. Update inventory for all line items
    const CATEGORY_TO_INVENTORY = {
      food_beverage: 'other',
      staff_costs: 'other',
      fixed_costs: 'other',
      utilities: 'other',
      operating_expenses: 'other',
      other: 'other'
    };

    // Infer inventory category from supplier category
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
      if (expCat === 'operating_expenses') return 'packaging';
      return 'other';
    };

    if (line_items && line_items.length > 0) {
      const allInventory = await base44.entities.InventoryItem.filter({ business_id });

      for (const item of line_items) {
        if (!item.description) continue;

        const descLower = item.description.toLowerCase().trim();
        const match = allInventory.find(inv =>
          inv.ingredient_name && inv.ingredient_name.toLowerCase().trim() === descLower
        );

        const qty = item.quantity || 1;
        const unitCost = item.unit_price || (item.total ? item.total / qty : 0);

        if (match) {
          await base44.entities.InventoryItem.update(match.id, {
            current_stock: (match.current_stock || 0) + qty,
            unit_cost: unitCost || match.unit_cost,
            supplier_name: supplier_name,
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
            supplier_name: supplier_name,
            last_restocked_date: invoice_date || new Date().toISOString().split('T')[0],
            category: inferInventoryCategory(expense_category, item.description)
          });
          results.inventory_created.push(newItem.ingredient_name);
        }
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});