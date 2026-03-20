import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const TOAST_AUTH_URL = 'https://ws-api.toasttab.com/authentication/v1/authentication/login';
const TOAST_BASE_URL = 'https://ws-api.toasttab.com';

async function getToastToken() {
  const clientId = Deno.env.get('TOAST_POS_CLIENT_ID');
  const clientSecret = Deno.env.get('TOAST_POS_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('TOAST_POS_CLIENT_ID or TOAST_POS_CLIENT_SECRET not configured');
  }

  const res = await fetch(TOAST_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      clientSecret,
      userAccessType: 'TOAST_MACHINE_CLIENT'
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Toast auth failed: ${err}`);
  }

  const data = await res.json();
  return data.token.accessToken;
}

async function fetchToastData(token, restaurantGuid, endpoint) {
  const res = await fetch(`${TOAST_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Toast-Restaurant-External-ID': restaurantGuid
    }
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Toast API error (${endpoint}): ${err}`);
  }

  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, business_id, restaurant_guid } = body;

    if (!business_id) return Response.json({ error: 'business_id is required' }, { status: 400 });

    // Find or create the connection record
    const connections = await base44.asServiceRole.entities.IntegrationConnection.filter({
      business_id,
      integration_type: 'toast_pos'
    });
    let connection = connections[0];

    if (action === 'connect') {
      if (!restaurant_guid) {
        return Response.json({ error: 'restaurant_guid is required to connect' }, { status: 400 });
      }

      // Test credentials by fetching a token
      const token = await getToastToken();

      if (connection) {
        await base44.asServiceRole.entities.IntegrationConnection.update(connection.id, {
          status: 'connected',
          access_token: token,
          restaurant_guid,
          error_message: null,
          token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        });
      } else {
        connection = await base44.asServiceRole.entities.IntegrationConnection.create({
          business_id,
          integration_type: 'toast_pos',
          status: 'connected',
          access_token: token,
          restaurant_guid,
          token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        });
      }

      return Response.json({ success: true, message: 'Toast POS connected successfully' });
    }

    if (action === 'sync') {
      if (!connection || connection.status !== 'connected') {
        return Response.json({ error: 'Toast POS is not connected for this business' }, { status: 400 });
      }

      // Refresh token
      const token = await getToastToken();
      const guid = connection.restaurant_guid;

      // Fetch sales (orders) from today
      const today = new Date();
      const startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endDate = new Date().toISOString();

      const [orders, menuItems] = await Promise.all([
        fetchToastData(token, guid, `/orders/v2/ordersBulk?startDate=${startDate}&endDate=${endDate}`),
        fetchToastData(token, guid, `/config/v2/menus`)
      ]);

      // Process and store orders as Sales records
      let salesCreated = 0;
      if (Array.isArray(orders)) {
        for (const order of orders) {
          if (!order.checks) continue;
          for (const check of order.checks) {
            const selections = check.selections || [];
            for (const sel of selections) {
              await base44.asServiceRole.entities.Sale.create({
                business_id,
                date: today.toISOString().split('T')[0],
                item_id: sel.itemGuid || 'unknown',
                units_sold: sel.quantity || 1,
                net_revenue: (sel.price || 0) / 100,
                channel: 'dine_in'
              });
              salesCreated++;
            }
          }
        }
      }

      // Update connection sync timestamp
      await base44.asServiceRole.entities.IntegrationConnection.update(connection.id, {
        access_token: token,
        last_synced_at: new Date().toISOString(),
        status: 'connected',
        error_message: null
      });

      return Response.json({
        success: true,
        message: `Sync complete`,
        stats: { salesCreated, ordersProcessed: Array.isArray(orders) ? orders.length : 0 }
      });
    }

    if (action === 'disconnect') {
      if (connection) {
        await base44.asServiceRole.entities.IntegrationConnection.update(connection.id, {
          status: 'disconnected',
          access_token: null,
          refresh_token: null
        });
      }
      return Response.json({ success: true, message: 'Disconnected' });
    }

    if (action === 'status') {
      return Response.json({
        connected: connection?.status === 'connected',
        last_synced_at: connection?.last_synced_at || null,
        restaurant_guid: connection?.restaurant_guid || null
      });
    }

    return Response.json({ error: 'Unknown action. Use: connect, sync, disconnect, status' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});