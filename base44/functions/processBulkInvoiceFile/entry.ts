import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { business_id, file_url } = await req.json();

    if (!business_id || !file_url) {
      return Response.json({ error: 'Missing business_id or file_url' }, { status: 400 });
    }

    // Get business details for currency and tax info
    let business;
    try {
      business = await base44.entities.Business.get(business_id);
    } catch {
      business = { vat_rate: 19 }; // Default VAT rate
    }

    // Extract all invoices from the file using LLM with vision
    let extractionResult;
    try {
      extractionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an invoice extraction specialist. Analyze this document which may contain ONE OR MULTIPLE invoices.
        
Extract ALL invoices found in the document. For each invoice, extract:
1. Supplier name
2. Invoice number (if visible)
3. Invoice date
4. Due date (if visible)
5. Net amount (amount before VAT)
6. VAT amount
7. Gross total (total including VAT)
8. VAT rate percentage
9. Category (choose from: food_beverage, staff_costs, fixed_costs, utilities, operating_expenses, one_off_expenses)
10. Brief description of what the invoice is for

Return a JSON array where each object represents one invoice. If you find a multi-page document with multiple invoices, extract each separately.
If amounts are unclear, use your best judgment. If VAT is not shown separately, calculate it or set to null.

Important: Return ONLY valid JSON array, no other text.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            invoices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  supplier_name: { type: 'string' },
                  invoice_number: { type: 'string' },
                  invoice_date: { type: 'string' },
                  due_date: { type: 'string' },
                  net_amount: { type: 'number' },
                  vat_amount: { type: 'number' },
                  gross_total: { type: 'number' },
                  vat_rate: { type: 'number' },
                  category: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['supplier_name', 'gross_total', 'category']
              }
            }
          },
          required: ['invoices']
        },
        model: 'gemini_3_1_pro'
      });
    } catch (err) {
      return Response.json({
        error: `Failed to extract invoices from document: ${err.message}`,
        processed: [],
        failed: 0
      }, { status: 400 });
    }

    if (!extractionResult.invoices || extractionResult.invoices.length === 0) {
      return Response.json({ 
        error: 'No invoices found in the document',
        processed: [],
        failed: 1
      }, { status: 400 });
    }

    const processed = [];
    const failed = [];

    // Process each extracted invoice
    for (const inv of extractionResult.invoices) {
      try {
        // Find or create supplier
        const suppliers = await base44.entities.Supplier.filter({
          business_id,
          name: inv.supplier_name
        });

        let supplierId;
        if (suppliers.length > 0) {
          supplierId = suppliers[0].id;
        } else {
          const newSupplier = await base44.entities.Supplier.create({
            business_id,
            name: inv.supplier_name,
            category: inv.category || 'other'
          });
          supplierId = newSupplier.id;
        }

        // Create expense document
        const expense = await base44.entities.ExpenseDocument.create({
          business_id,
          supplier_name: inv.supplier_name,
          invoice_number: inv.invoice_number || null,
          invoice_date: inv.invoice_date || null,
          due_date: inv.due_date || null,
          net_amount: inv.net_amount || 0,
          vat_amount: inv.vat_amount || 0,
          invoice_total: inv.gross_total || 0,
          vat_rate: inv.vat_rate || business.vat_rate || 19,
          expense_category: inv.category || 'operating_expenses',
          document_url: file_url,
          status: 'pending',
          uploaded_by: user.email,
          confidence_score: 0.8,
          notes: inv.description || null
        });

        processed.push({
          id: expense.id,
          supplier: inv.supplier_name,
          invoice_number: inv.invoice_number,
          amount: inv.gross_total
        });
      } catch (err) {
        failed.push({
          supplier: inv.supplier_name,
          error: err.message
        });
      }
    }

    return Response.json({
      processed,
      failed,
      total: extractionResult.invoices.length,
      success: processed.length,
      message: `Processed ${processed.length} invoice${processed.length !== 1 ? 's' : ''} from the file`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});