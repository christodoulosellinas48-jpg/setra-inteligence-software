import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { business_id, supplier_name, invoice_date, expense_category, line_items, invoice_total } = await req.json();

    if (!business_id || !supplier_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const results = { supplier: null, inventory_updates: [], inventory_created: [] };

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

    // 2. If food_beverage and line items exist, update inventory
    if (expense_category === 'food_beverage' && line_items && line_items.length > 0) {
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
          // Update existing inventory item
          await base44.entities.InventoryItem.update(match.id, {
            current_stock: (match.current_stock || 0) + qty,
            unit_cost: unitCost || match.unit_cost,
            supplier_name: supplier_name,
            last_restocked_date: invoice_date || new Date().toISOString().split('T')[0]
          });
          results.inventory_updates.push(match.ingredient_name);
        } else {
          // Create new inventory item
          const newItem = await base44.entities.InventoryItem.create({
            business_id,
            ingredient_name: item.description,
            unit: 'kg',
            current_stock: qty,
            unit_cost: unitCost,
            supplier_name: supplier_name,
            last_restocked_date: invoice_date || new Date().toISOString().split('T')[0],
            category: 'other'
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