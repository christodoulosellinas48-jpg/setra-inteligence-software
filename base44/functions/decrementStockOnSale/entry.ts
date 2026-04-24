import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Accept both direct invocation (with sale data) and entity automation payload
    const sale = body?.data || body?.sale;

    if (!sale?.item_id || !sale?.units_sold || !sale?.business_id) {
      return Response.json({ error: 'Missing required sale fields: business_id, item_id, units_sold' }, { status: 400 });
    }

    // 1. Get all recipe lines for this menu item
    const recipes = await base44.asServiceRole.entities.Recipe.filter({
      business_id: sale.business_id,
      item_id: sale.item_id,
    });

    if (recipes.length === 0) {
      return Response.json({ message: 'No recipe found for item, no stock decremented', item_id: sale.item_id });
    }

    // 2. Get all inventory items for this business (single query, then match in memory)
    const inventoryItems = await base44.asServiceRole.entities.InventoryItem.filter({
      business_id: sale.business_id,
    });

    const inventoryByName = {};
    for (const item of inventoryItems) {
      inventoryByName[item.ingredient_name.toLowerCase().trim()] = item;
    }

    const results = [];

    for (const recipe of recipes) {
      const key = recipe.ingredient_name.toLowerCase().trim();
      const inventoryItem = inventoryByName[key];

      if (!inventoryItem) {
        results.push({ ingredient: recipe.ingredient_name, status: 'not_found' });
        continue;
      }

      // qty per unit sold, adjusted for yield (e.g. 80% yield means we actually use qty / 0.8)
      const yieldFactor = (recipe.yield_pct || 100) / 100;
      const qtyPerUnit = yieldFactor > 0 ? recipe.qty / yieldFactor : recipe.qty;
      const totalDeduction = qtyPerUnit * sale.units_sold;

      const newStock = Math.max(0, (inventoryItem.current_stock || 0) - totalDeduction);

      await base44.asServiceRole.entities.InventoryItem.update(inventoryItem.id, {
        current_stock: newStock,
        last_restocked_date: inventoryItem.last_restocked_date, // preserve existing
      });

      results.push({
        ingredient: recipe.ingredient_name,
        status: 'decremented',
        deducted: totalDeduction,
        new_stock: newStock,
        unit: recipe.unit,
      });
    }

    return Response.json({
      sale_id: sale.id,
      item_id: sale.item_id,
      units_sold: sale.units_sold,
      stock_updates: results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});