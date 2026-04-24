import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled function — use service role
    const businesses = await base44.asServiceRole.entities.Business.list();

    const now = new Date();
    // Period = previous month (snapshot created on 1st covers last month)
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodEnd   = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month

    const periodStartStr = periodStart.toISOString().split('T')[0];
    const periodEndStr   = periodEnd.toISOString().split('T')[0];

    const results = [];

    for (const business of businesses) {
      // Avoid duplicates: skip if a snapshot for this period already exists
      const existing = await base44.asServiceRole.entities.FinancialSnapshot.filter({
        business_id: business.id,
        period_start: periodStartStr,
      });

      if (existing.length > 0) {
        results.push({ business_id: business.id, name: business.name, status: 'skipped_duplicate' });
        continue;
      }

      const revenue    = business.monthly_revenue      || 0;
      const food       = business.purchases_food_bev   || 0;
      const staff      = business.staff_costs          || 0;
      const fixed      = business.rent_fixed_costs     || 0;
      const utilities  = business.utilities            || 0;
      const other      = business.other_operating      || 0;

      const totalCosts  = food + staff + fixed + utilities + other;
      const netProfit   = revenue - totalCosts;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      await base44.asServiceRole.entities.FinancialSnapshot.create({
        business_id:         business.id,
        period_start:        periodStartStr,
        period_end:          periodEndStr,
        period_type:         'monthly',
        monthly_revenue:     revenue,
        purchases_food_bev:  food,
        staff_costs:         staff,
        rent_fixed_costs:    fixed,
        utilities:           utilities,
        other_operating:     other,
        net_profit:          netProfit,
        profit_margin:       profitMargin,
      });

      results.push({ business_id: business.id, name: business.name, status: 'created', net_profit: netProfit });
    }

    return Response.json({ period: `${periodStartStr} → ${periodEndStr}`, results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});