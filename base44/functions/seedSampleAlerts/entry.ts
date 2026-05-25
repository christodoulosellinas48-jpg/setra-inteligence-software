import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's first business
    const businesses = await base44.entities.Business.filter({ owner_email: user.email });
    if (!businesses.length) {
      return Response.json({ error: 'No business found' }, { status: 404 });
    }

    const business = businesses[0];

    // Delete existing sample alerts (optional cleanup)
    const existingAlerts = await base44.entities.Alert.filter({ business_id: business.id });
    for (const alert of existingAlerts) {
      if (!alert.dismissed_at) {
        await base44.entities.Alert.update(alert.id, { dismissed_at: new Date().toISOString() });
      }
    }

    // Create sample alerts
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 10);
    const daysToVat = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));

    const sampleAlerts = [
      {
        business_id: business.id,
        user_id: user.id,
        type: 'vat_deadline',
        severity: 'high',
        headline: `VAT deadline in ${daysToVat} days`,
        context: `VAT filing deadline is ${nextMonth.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}. Ensure all transactions are recorded.`,
        deeplink_url: '/VATAndBookkeeping',
        target_entity: `vat_${business.id}`,
      },
      {
        business_id: business.id,
        user_id: user.id,
        type: 'margin_alert',
        severity: 'high',
        headline: 'Food cost margin exceeded',
        context: 'This month\'s food cost is 34%, 4% above target. Review supplier costs and portion control.',
        deeplink_url: '/Dishes?tab=matrix',
        target_entity: `margin_${business.id}`,
      },
      {
        business_id: business.id,
        user_id: user.id,
        type: 'low_stock',
        severity: 'medium',
        headline: 'Premium olive oil stock running low',
        context: 'Current stock: 2.5L. Reorder point: 5L. Contact supplier for urgent delivery.',
        deeplink_url: '/Stock',
        target_entity: `stock_olive_oil_${business.id}`,
      },
      {
        business_id: business.id,
        user_id: user.id,
        type: 'price_spike',
        severity: 'medium',
        headline: 'Salmon price up 18% this week',
        context: 'Supplier cost increased. Consider adjusting menu price or temporarily offering alternative.',
        deeplink_url: '/Suppliers',
        target_entity: `price_salmon_${business.id}`,
      },
      {
        business_id: business.id,
        user_id: user.id,
        type: 'missing_recipe',
        severity: 'info',
        headline: 'No recipe linked to Burrata Salad',
        context: 'Add a recipe to track ingredient costs and food cost margins accurately.',
        deeplink_url: '/Dishes',
        target_entity: `recipe_burrata_${business.id}`,
      },
      {
        business_id: business.id,
        user_id: user.id,
        type: 'setup_gap',
        severity: 'info',
        headline: 'Bank reconciliation not set up',
        context: 'Enable automatic bank matching to catch discrepancies early.',
        deeplink_url: '/VATAndBookkeeping?tab=bank',
        target_entity: `setup_bank_${business.id}`,
      },
    ];

    // Create all alerts
    const created = await base44.entities.Alert.bulkCreate(sampleAlerts);

    return Response.json({
      success: true,
      message: `Created ${created.length} sample alerts for ${business.name}`,
      businessId: business.id,
      alertsCount: created.length,
    });
  } catch (error) {
    console.error('Error seeding alerts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});