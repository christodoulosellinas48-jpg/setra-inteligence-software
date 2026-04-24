import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * AI-driven expense categorization.
 * Accepts: { business_id, supplier_name, line_items, gross_total, raw_text }
 * Returns: { category, reason, confidence, source }
 */

const CATEGORIES = {
  food_beverage: 'Ingredients, beverages, produce, meat, dairy, dry goods purchased for the business',
  staff_costs: 'Wages, payroll runs, recruitment agencies, staff uniforms, employment contracts',
  fixed_costs: 'Rent, commercial insurance, equipment leases, licenses, annual subscriptions',
  utilities: 'Electricity, water, gas, internet, telephone/mobile bills',
  operating_expenses: 'Cleaning supplies, packaging, maintenance & repairs, marketing, general consumables',
  one_off_expenses: 'Capital purchases, one-time exceptional costs, refurbishments, legal fees'
};

// Keyword fallback — used if AI call fails
const KEYWORD_MAP = {
  food_beverage: ['food', 'catering', 'bakery', 'meat', 'fish', 'dairy', 'produce', 'beverage', 'drink', 'wine', 'beer', 'grocery', 'fresh', 'ingredient', 'vegetables', 'fruit', 'flour', 'butter', 'eggs', 'coffee'],
  utilities: ['electric', 'electricity', 'water', 'gas', 'energy', 'power', 'telecom', 'internet', 'broadband', 'phone', 'mobile'],
  fixed_costs: ['rent', 'insurance', 'lease', 'mortgage', 'rates', 'license', 'subscription', 'annual fee', 'retainer'],
  staff_costs: ['staff', 'payroll', 'salary', 'wage', 'agency', 'recruitment', 'uniform', 'hr ', 'employment'],
  operating_expenses: ['cleaning', 'maintenance', 'repair', 'packaging', 'office', 'supplies', 'advertising', 'marketing', 'laundry', 'linen', 'detergent'],
  one_off_expenses: ['refurbishment', 'renovation', 'legal', 'accountant', 'solicitor', 'capital', 'one-off', 'equipment purchase']
};

function keywordFallback(supplierName, lineItems, rawText) {
  const combined = [
    supplierName || '',
    ...(lineItems || []).map(i => i.description || ''),
    rawText || ''
  ].join(' ').toLowerCase();

  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(k => combined.includes(k))) return { category: cat, reason: 'Keyword match', confidence: 0.55, source: 'keyword' };
  }
  return { category: 'operating_expenses', reason: 'Default fallback', confidence: 0.3, source: 'fallback' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { business_id, supplier_name, line_items = [], gross_total, raw_text } = await req.json();

    if (!supplier_name) {
      return Response.json({ error: 'supplier_name is required' }, { status: 400 });
    }

    // --- Supplier history: fetch past category from Supplier records ---
    let supplierHistory = null;
    if (business_id) {
      const existing = await base44.entities.Supplier.filter({ business_id, name: supplier_name });
      if (existing.length > 0 && existing[0].category && existing[0].category !== 'other') {
        supplierHistory = existing[0].category;
      }
    }

    // --- Build rich LLM prompt ---
    const lineItemText = line_items.length > 0
      ? line_items.map(i => `• ${i.description || ''}${i.total != null ? ` (€${i.total})` : ''}`).join('\n')
      : 'No line items available';

    const categoryDefs = Object.entries(CATEGORIES)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n');

    const historyNote = supplierHistory
      ? `\nIMPORTANT: This supplier was previously categorised as "${supplierHistory}". Use this as a strong prior unless the line items clearly indicate a different category.`
      : '';

    const prompt = `You are an expert bookkeeper for hospitality businesses (restaurants, bars, cafes, hotels).
Your task: assign the single most accurate expense category to an invoice based on the supplier and line-item details.

SUPPLIER: ${supplier_name}
INVOICE TOTAL: €${gross_total || 0}
LINE ITEMS:
${lineItemText}
${raw_text ? `\nADDITIONAL CONTEXT:\n${raw_text.slice(0, 800)}` : ''}${historyNote}

AVAILABLE CATEGORIES:
${categoryDefs}

Rules:
1. If line items describe food/drink ingredients → food_beverage
2. If supplier is a utility company → utilities
3. If supplier is a landlord or the invoice mentions rent/lease → fixed_costs
4. Staff agency, payroll provider → staff_costs
5. Cleaning products, packaging, marketing → operating_expenses
6. Large one-time capital costs or professional services → one_off_expenses
7. When in doubt, prefer food_beverage for F&B businesses if the supplier is food-related

Respond ONLY with valid JSON: {"category": "...", "reason": "one sentence explanation", "confidence": 0.0-1.0}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: Object.keys(CATEGORIES) },
          reason: { type: 'string' },
          confidence: { type: 'number' }
        },
        required: ['category', 'reason', 'confidence']
      }
    });

    if (!result?.category || !Object.keys(CATEGORIES).includes(result.category)) {
      return Response.json({ ...keywordFallback(supplier_name, line_items, raw_text) });
    }

    return Response.json({
      category: result.category,
      reason: result.reason,
      confidence: result.confidence,
      source: supplierHistory && result.category === supplierHistory ? 'history+ai' : 'ai'
    });

  } catch (error) {
    // Degrade gracefully to keyword fallback
    try {
      const body = await req.clone().json().catch(() => ({}));
      return Response.json(keywordFallback(body.supplier_name, body.line_items, body.raw_text));
    } catch (_) {
      return Response.json({ category: 'operating_expenses', reason: 'Error fallback', confidence: 0.2, source: 'error' }, { status: 200 });
    }
  }
});