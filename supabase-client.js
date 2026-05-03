/* ══════════════════════════════════════════════
   Gusto — Supabase Client
   Replace SUPABASE_ANON_KEY with your anon key:
   https://supabase.com/dashboard/project/jgfqvsghjdciygcsoskq/settings/api
══════════════════════════════════════════════ */

const SUPABASE_URL      = window.GUSTO_CONFIG?.supabaseUrl  || '';
const SUPABASE_ANON_KEY = window.GUSTO_CONFIG?.supabaseAnon || '';

/* ── Lightweight fetch wrapper (no SDK needed) ── */
async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Supabase error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

/* ══════════════════════════════════════════════
   MENU
══════════════════════════════════════════════ */

/** Fetch all available menu items with their category */
async function fetchMenuItems() {
  return sbFetch(
    'menu_items?select=*,categories(name,slug)&is_available=eq.true&order=categories(display_order),display_order'
  );
}

/** Fetch items for one category */
async function fetchMenuByCategory(slug) {
  return sbFetch(
    `menu_items?select=*,categories(name,slug)&categories.slug=eq.${slug}&is_available=eq.true&order=display_order`
  );
}

/* ══════════════════════════════════════════════
   ORDERS
══════════════════════════════════════════════ */

/**
 * Submit a completed order.
 * @param {object} details  { customer_name, customer_phone, order_type, notes }
 * @param {object} cart     { [itemName]: { qty, price } }
 * @returns {object} saved order row
 */
async function submitOrder(details, cart) {
  const items    = Object.entries(cart);
  const subtotal = items.reduce((s, [, v]) => s + v.qty * v.price, 0);
  const service  = parseFloat((subtotal * 0.1).toFixed(2));
  const total    = parseFloat((subtotal + service).toFixed(2));

  // 1 — Insert the order header
  const [order] = await sbFetch('orders', {
    method: 'POST',
    body: JSON.stringify({
      customer_name:  details.customer_name,
      customer_phone: details.customer_phone,
      order_type:     details.order_type || 'dine-in',
      notes:          details.notes || null,
      subtotal:       subtotal,
      service_charge: service,
      total_amount:   total,
    }),
  });

  // 2 — Insert each line item
  const lineItems = items.map(([name, { qty, price }]) => ({
    order_id:   order.id,
    item_name:  name,
    item_price: price,
    quantity:   qty,
  }));

  await sbFetch('order_items', {
    method: 'POST',
    body: JSON.stringify(lineItems),
    prefer: 'return=minimal',
  });

  return order;
}

/* ══════════════════════════════════════════════
   RESERVATIONS
══════════════════════════════════════════════ */

/**
 * Submit a table reservation.
 * @param {object} data  Form fields from the reservation form
 * @returns {object} saved reservation row
 */
async function submitReservation(data) {
  const [reservation] = await sbFetch('reservations', {
    method: 'POST',
    body: JSON.stringify({
      first_name:       data.first_name,
      last_name:        data.last_name,
      email:            data.email,
      phone:            data.phone,
      date:             data.date,
      time:             data.time,
      guests:           data.guests,
      occasion:         data.occasion || null,
      special_requests: data.special_requests || null,
    }),
  });
  return reservation;
}

/* Export for use in script.js / order.js */
window.GustoAPI = {
  fetchMenuItems,
  fetchMenuByCategory,
  submitOrder,
  submitReservation,
};
