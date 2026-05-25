import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PLAN_PRICES = {
  starter_monthly:  { priceId: 'price_starter_monthly',  name: 'Starter Monthly' },
  starter_annual:   { priceId: 'price_starter_annual',   name: 'Starter Annual' },
  basic_monthly:    { priceId: 'price_basic_monthly',    name: 'Basic Monthly' },
  basic_annual:     { priceId: 'price_basic_annual',     name: 'Basic Annual' },
  pro_monthly:      { priceId: 'price_pro_monthly',      name: 'Pro Monthly' },
  pro_annual:       { priceId: 'price_pro_annual',       name: 'Pro Annual' },
  premium_monthly:  { priceId: 'price_premium_monthly',  name: 'Premium Monthly' },
  premium_annual:   { priceId: 'price_premium_annual',   name: 'Premium Annual' },
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { plan, billing } = body;

    if (!plan || !billing) {
      return Response.json({ error: 'Missing plan or billing' }, { status: 400 });
    }

    const priceKey = `${plan}_${billing}`;
    const priceConfig = PLAN_PRICES[priceKey];

    if (!priceConfig) {
      return Response.json({ error: 'Invalid plan or billing' }, { status: 400 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.get('origin')}/settings?session_id={CHECKOUT_SESSION_ID}&canceled=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        plan,
        billing,
      },
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});