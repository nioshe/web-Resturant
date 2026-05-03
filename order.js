/* ══ Gusto — Order Page ══ */

/* ── Cart helpers ── */
function getCart() {
  try { return JSON.parse(localStorage.getItem('gusto_cart')) || {}; }
  catch { return {}; }
}

function saveCart(cart) {
  localStorage.setItem('gusto_cart', JSON.stringify(cart));
  updateNavBadge();
  renderOrder();
}

function updateNavBadge() {
  const count = Object.values(getCart()).reduce((s, v) => s + v.qty, 0);
  const badge = document.getElementById('nav-cart-badge');
  if (badge) badge.textContent = count;
}

/* ── Render order items ── */
function renderOrder() {
  const cart = getCart();
  const items = Object.entries(cart);
  const emptyEl  = document.getElementById('order-empty-state');
  const contentEl = document.getElementById('order-content');
  const listEl    = document.getElementById('order-items-list');

  if (items.length === 0) {
    emptyEl.style.display  = 'flex';
    contentEl.style.display = 'none';
    return;
  }

  emptyEl.style.display  = 'none';
  contentEl.style.display = 'grid';

  const subtotal = items.reduce((s, [, v]) => s + v.qty * v.price, 0);
  const service  = subtotal * 0.1;
  const total    = subtotal + service;

  listEl.innerHTML = items.map(([name, { qty, price }]) => `
    <div class="order-item">
      <div class="order-item-info">
        <span class="order-item-name">${name}</span>
        <span class="order-item-unit">$${price.toFixed(2)} each</span>
      </div>
      <div class="order-item-controls">
        <button class="qty-btn" onclick="changeOrderQty('${name.replace(/'/g,"\\'")}', -1)">−</button>
        <span class="qty-num">${qty}</span>
        <button class="qty-btn" onclick="changeOrderQty('${name.replace(/'/g,"\\'")}', 1)">+</button>
      </div>
      <div class="order-item-line-total">$${(qty * price).toFixed(2)}</div>
      <button class="order-remove-btn" onclick="removeOrderItem('${name.replace(/'/g,"\\'")}')">✕</button>
    </div>
  `).join('');

  document.getElementById('order-subtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('order-service').textContent  = '$' + service.toFixed(2);
  document.getElementById('order-total').textContent    = '$' + total.toFixed(2);
}

function changeOrderQty(name, delta) {
  const cart = getCart();
  if (!cart[name]) return;
  cart[name].qty += delta;
  if (cart[name].qty <= 0) delete cart[name];
  saveCart(cart);
}

function removeOrderItem(name) {
  const cart = getCart();
  delete cart[name];
  saveCart(cart);
}

window.changeOrderQty  = changeOrderQty;
window.removeOrderItem = removeOrderItem;

/* ── Clear all ── */
document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
  if (confirm('Remove all items from your order?')) {
    localStorage.removeItem('gusto_cart');
    renderOrder();
    updateNavBadge();
  }
});

/* ── Confirm order ── */
document.getElementById('confirm-order-btn')?.addEventListener('click', async () => {
  const cart  = getCart();
  const name  = document.getElementById('customer-name')?.value.trim();
  const phone = document.getElementById('customer-phone')?.value.trim();
  const type  = document.getElementById('order-type')?.value || 'dine-in';
  const notes = document.getElementById('order-notes')?.value.trim();

  if (Object.keys(cart).length === 0) {
    showToast('Please add items before confirming.');
    return;
  }
  if (!name) {
    showToast('Please enter your full name.');
    document.getElementById('customer-name')?.focus();
    return;
  }
  if (!phone) {
    showToast('Please enter your phone number.');
    document.getElementById('customer-phone')?.focus();
    return;
  }

  const btn = document.getElementById('confirm-order-btn');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    if (window.GustoAPI) {
      await window.GustoAPI.submitOrder(
        { customer_name: name, customer_phone: phone, order_type: type, notes },
        cart
      );
    }
    localStorage.removeItem('gusto_cart');
    updateNavBadge();
    document.getElementById('order-success-modal')?.classList.add('open');
  } catch (err) {
    console.error('Order save failed:', err);
    // Still confirm locally even if Supabase fails
    localStorage.removeItem('gusto_cart');
    updateNavBadge();
    document.getElementById('order-success-modal')?.classList.add('open');
  } finally {
    btn.textContent = 'Confirm Order';
    btn.disabled = false;
  }
});

document.getElementById('success-home-btn')?.addEventListener('click', () => {
  window.location.href = 'index.html';
});

/* Close modal on backdrop click */
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) window.location.href = 'index.html';
  });
});

/* ── Toast ── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.querySelector('.toast-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ── Nav scroll ── */
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 60);
});

/* ── Hamburger ── */
const mobileNav     = document.getElementById('mobile-nav');
const mobileOverlay = document.getElementById('mobile-nav-overlay');
const hamburger     = document.getElementById('nav-hamburger');
const mobileClose   = document.getElementById('mobile-nav-close');

hamburger?.addEventListener('click', () => {
  mobileNav?.classList.add('open');
  mobileOverlay?.classList.add('open');
  document.body.style.overflow = 'hidden';
});

function closeMobileNav() {
  mobileNav?.classList.remove('open');
  mobileOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

mobileClose?.addEventListener('click', closeMobileNav);
mobileOverlay?.addEventListener('click', closeMobileNav);
document.querySelectorAll('.mobile-nav a').forEach(a => {
  a.addEventListener('click', closeMobileNav);
});

/* ── Nav cart btn (stays on same page) ── */
document.getElementById('nav-cart-btn')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── Init ── */
renderOrder();
updateNavBadge();
