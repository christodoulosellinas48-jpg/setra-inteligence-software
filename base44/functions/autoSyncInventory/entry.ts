import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const inferInventoryCategory = (description) => {
  const desc = (description || '').toLowerCase();
  if (desc.match(/beef|pork|lamb|chicken|veal|meat|steak|mince|sausage|bacon|ribs|fish|salmon|cod|tuna|prawn|shrimp/)) return 'meat_fish';
  if (desc.match(/milk|cheese|cream|butter|yogurt|dairy/)) return 'dairy';
  if (desc.match(/tomato|lettuce|pepper|onion|garlic|potato|vegetable|fruit|herb|salad/)) return 'produce';
  if (desc.match(/beer|wine|spirit|vodka|whisky|gin|liquor|drink|juice|water|soda/)) return 'beverages';
  if (desc.match(/flour|sugar|rice|pasta|oil|sauce|tin|can|dried|spice/)) return 'dry_goods';
  if (desc.match(/bag|box|wrap|container|packaging|foil|napkin/)) return 'packaging';
  return 'dry_goods';
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Support both direct call and entity automation payload
    const eventType = payload?.event?.type;
    const documentId = payload?.event?.entity_id || payload?.document_id;

    if (!documentId) {
      return Response.json({ error: 'Missing document_id' }, { status: 400 });
    }

    // Only process on create or update
    if (eventType && !['create', 'update'].includes(eventType)) {
      return Response.json({ skipped: true });
    }

    // Fetch document
    const docs = await base44.asServiceRole.entities.Document.filter({ id: documentId });
    const doc = docs[0];

    if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 });

    // Only process approved or parsed documents
    if (!['approved', 'parsed'].includes(doc.status)) {
      return Response.json({ skipped: true, reason: `status is ${doc.status}` });
    }

    // Fetch document lines
    const lines = await base44.asServiceRole.entities.DocumentLine.filter({ document_id: documentId });
    if (!lines || lines.length === 0) {
      return Response.json({ skipped: true, reason: 'no document lines' });
    }

    const business_id = doc.business_id;
    const supplier_name = doc.supplier_name;
    const invoice_date = doc.invoice_date || new Date().toISOString().split('T')[0];

    // Fetch existing inventory
    const allInventory = await base44.asServiceRole.entities.InventoryItem.filter({ business_id });

    const updates = [];
    const created = [];

    for (const line of lines) {
      if (!line.description) continue;

      const descLower = line.description.toLowerCase().trim();
      const match = allInventory.find(inv =>
        inv.ingredient_name && inv.ingredient_name.toLowerCase().trim() === descLower
      );

      const qty = line.qty || 1;
      const unitCost = line.unit_price_net ? line.unit_price_net / qty : 0;

      if (match) {
        await base44.asServiceRole.entities.InventoryItem.update(match.id, {
          current_stock: (match.current_stock || 0) + qty,
          unit_cost: unitCost > 0 ? unitCost : match.unit_cost,
          supplier_name,
          last_restocked_date: invoice_date
        });
        updates.push(match.ingredient_name);
      } else {
        const newItem = await base44.asServiceRole.entities.InventoryItem.create({
          business_id,
          ingredient_name: line.description,
          unit: 'kg',
          current_stock: qty,
          unit_cost: unitCost,
          supplier_name,
          last_restocked_date: invoice_date,
          category: inferInventoryCategory(line.description)
        });
        created.push(newItem.ingredient_name);
      }
    }

    return Response.json({ success: true, updated: updates, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});