import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Entity automation trigger: called when ExpenseDocument is created with status=pending
// Reads the full document and delegates to processInvoice logic inline
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;
    if (!data || !data.business_id) {
      return Response.json({ skipped: true, reason: 'no data or business_id' });
    }

    // Only process if status is pending (avoid re-triggering after we mark it posted)
    if (data.status !== 'pending') {
      return Response.json({ skipped: true, reason: `status is ${data.status}` });
    }

    const expenseDocId = data.id || event?.entity_id;
    if (!expenseDocId) {
      return Response.json({ skipped: true, reason: 'no entity_id' });
    }

    // Delegate to processInvoice via SDK
    const result = await base44.asServiceRole.functions.invoke('processInvoice', {
      business_id: data.business_id,
      expense_document_id: expenseDocId,
      supplier_name: data.supplier_name || '',
      supplier_vat_number: data.supplier_vat_number || '',
      invoice_number: data.invoice_number || '',
      invoice_date: data.invoice_date || '',
      due_date: data.due_date || '',
      expense_category: data.expense_category || 'operating_expenses',
      invoice_total: data.invoice_total || 0,
      net_amount: data.net_amount || 0,
      vat_amount: data.vat_amount || 0,
      vat_rate: data.vat_rate || 0,
      vat_included: data.vat_included || false,
      line_items: []
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});