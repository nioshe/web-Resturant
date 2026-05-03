/* ══ Gusto Admin Dashboard ══ */

const BASE = window.GUSTO_CONFIG?.supabaseUrl  || '';
const ANON = window.GUSTO_CONFIG?.supabaseAnon || '';

/* ── Auth guard ── */
const token = sessionStorage.getItem('gusto_admin_token');
if (!token) window.location.replace('admin-login.html');

const adminEmail = sessionStorage.getItem('gusto_admin_email') || 'Admin';
document.getElementById('admin-email-display').textContent = adminEmail;

/* ── API helper ── */
async function api(path, opts = {}) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey:        ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type':'application/json',
      Prefer:        opts.prefer || 'return=representation',
      ...opts.headers,
    },
  });
  if (res.status === 401) { logout(); return null; }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function apiCount(path) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    method: 'HEAD',
    headers: {
      apikey:        ANON,
      Authorization: `Bearer ${token}`,
      Prefer:        'count=exact',
    },
  });
  if (!res.ok) return 0;
  const range = res.headers.get('Content-Range') || '';
  return parseInt(range.split('/')[1] || '0', 10);
}

/* ── Logout ── */
function logout() {
  fetch(`${BASE}/auth/v1/logout`, {
    method:'POST',
    headers:{ apikey:ANON, Authorization:`Bearer ${token}` }
  }).catch(() => {});
  sessionStorage.removeItem('gusto_admin_token');
  sessionStorage.removeItem('gusto_admin_email');
  window.location.replace('admin-login.html');
}
document.getElementById('logout-btn').addEventListener('click', logout);

/* ── Toast ── */
let toastTimer;
function showToast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent  = msg;
  el.style.borderColor = isError ? '#f5365c' : 'var(--gold)';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── Format helpers ── */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' });
}
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit' });
}

function badge(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

function orderStatusOptions(current) {
  const opts = ['pending','confirmed','preparing','ready','completed','cancelled'];
  return opts.map(o => `<option value="${o}"${o===current?' selected':''}>${o}</option>`).join('');
}

function resStatusOptions(current) {
  return ['pending','confirmed','cancelled']
    .map(o => `<option value="${o}"${o===current?' selected':''}>${o}</option>`).join('');
}

/* ── Load stats ── */
async function loadStats() {
  const [totalOrders, pendingOrders, totalRes, pendingRes, menuCount] = await Promise.all([
    apiCount('orders'),
    apiCount('orders?status=eq.pending'),
    apiCount('reservations'),
    apiCount('reservations?status=eq.pending'),
    apiCount('menu_items?is_available=eq.true'),
  ]);
  document.getElementById('stat-total-orders').textContent  = totalOrders;
  document.getElementById('stat-pending-orders').textContent = pendingOrders;
  document.getElementById('stat-total-res').textContent     = totalRes;
  document.getElementById('stat-pending-res').textContent   = pendingRes;
  document.getElementById('stat-menu').textContent          = menuCount;
}

/* ── Load orders ── */
async function loadOrders() {
  const rows = await api('orders?select=id,customer_name,order_type,total_amount,status,created_at&order=created_at.desc&limit=30');
  const tbody = document.getElementById('orders-tbody');
  const countEl = document.getElementById('orders-count');

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No orders yet</td></tr>`;
    countEl.textContent = '';
    return;
  }

  countEl.textContent = `${rows.length} shown`;

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${escHtml(r.customer_name)}</td>
      <td>${r.order_type === 'takeout' ? '🥡 Takeout' : '🪑 Dine In'}</td>
      <td class="price-cell">$${parseFloat(r.total_amount || 0).toFixed(2)}</td>
      <td>
        <select class="status-select" data-table="orders" data-id="${r.id}" data-current="${r.status}">
          ${orderStatusOptions(r.status)}
        </select>
      </td>
      <td>${fmtDate(r.created_at)}</td>
    </tr>
  `).join('');
}

/* ── Load reservations ── */
async function loadReservations() {
  const rows = await api('reservations?select=id,first_name,last_name,date,time,guests,occasion,status,created_at&order=created_at.desc&limit=30');
  const tbody  = document.getElementById('res-tbody');
  const countEl = document.getElementById('res-count');

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No reservations yet</td></tr>`;
    countEl.textContent = '';
    return;
  }

  countEl.textContent = `${rows.length} shown`;

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${escHtml(r.first_name)} ${escHtml(r.last_name)}</td>
      <td>${fmtDate(r.date)}</td>
      <td>${r.time || '—'}</td>
      <td>${r.guests || '—'}</td>
      <td>
        <select class="status-select" data-table="reservations" data-id="${r.id}" data-current="${r.status}">
          ${resStatusOptions(r.status)}
        </select>
      </td>
    </tr>
  `).join('');
}

/* ── Status change handler (event delegation) ── */
document.addEventListener('change', async e => {
  if (!e.target.classList.contains('status-select')) return;
  const { table, id, current } = e.target.dataset;
  const newStatus = e.target.value;
  if (newStatus === current) return;

  e.target.disabled = true;
  try {
    await api(`${table}?id=eq.${id}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({ status: newStatus }),
    });
    e.target.dataset.current = newStatus;
    showToast(`Status updated to "${newStatus}"`);
    // Refresh stats silently
    loadStats();
  } catch (err) {
    showToast(`Failed: ${err.message}`, true);
    e.target.value = current; // revert
  } finally {
    e.target.disabled = false;
  }
});

/* ── Security: escape HTML ── */
function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Full refresh ── */
async function loadAll() {
  await Promise.all([ loadStats(), loadOrders(), loadReservations() ]);
  const now = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('last-updated').textContent = `Last updated: ${now}`;
}

document.getElementById('refresh-btn').addEventListener('click', loadAll);

/* ══════════════════════════════════════
   LIVE CHAT — Admin Side
══════════════════════════════════════ */

let activeConvId   = null;
let lastMsgTs      = null;
let chatPollTimer  = null;

/* ── Load conversation list ── */
async function loadConversations() {
  const convs = await api('conversations?select=*&order=last_message_at.desc&limit=30');
  const list  = document.getElementById('conv-list');
  const badge = document.getElementById('chat-unread-badge');
  const count = document.getElementById('chat-conv-count');
  if (!convs || !list) return;

  count.textContent = `${convs.length} conversation${convs.length !== 1 ? 's' : ''}`;

  // Count unread (conversations with unread customer messages)
  const unreadCount = convs.filter(c => c.status === 'open').length;
  if (unreadCount > 0) {
    badge.style.display = 'inline';
    badge.textContent   = `${unreadCount} open`;
  } else {
    badge.style.display = 'none';
  }

  list.innerHTML = convs.map(c => `
    <div class="conv-item${activeConvId === c.id ? ' active' : ''}"
         data-id="${c.id}"
         style="padding:12px 16px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);transition:background .2s;${activeConvId === c.id ? 'background:rgba(201,168,76,0.08);border-left:2px solid var(--gold);' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <strong style="font-size:0.82rem;color:var(--white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(c.customer_name)}</strong>
        <span style="font-size:0.6rem;color:var(--muted);white-space:nowrap;">${fmtDate(c.last_message_at)}</span>
      </div>
      <div style="margin-top:3px;">
        <span style="font-size:0.62rem;padding:2px 7px;letter-spacing:1px;text-transform:uppercase;font-weight:700;${c.status === 'open' ? 'color:#2dce89;background:rgba(45,206,137,0.1);' : 'color:var(--muted);background:rgba(136,136,128,0.1);'}">${c.status}</span>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.conv-item').forEach(el => {
    el.addEventListener('mouseenter', () => { if (el.dataset.id !== activeConvId) el.style.background = 'rgba(255,255,255,0.03)'; });
    el.addEventListener('mouseleave', () => { if (el.dataset.id !== activeConvId) el.style.background = ''; });
    el.addEventListener('click', () => openConversation(el.dataset.id, convs.find(c => c.id === el.dataset.id)?.customer_name));
  });
}

/* ── Open a conversation thread ── */
async function openConversation(convId, custName) {
  activeConvId = convId;
  lastMsgTs    = null;

  const header   = document.getElementById('chat-thread-header');
  const thread   = document.getElementById('chat-thread');
  const replyRow = document.getElementById('admin-reply-row');

  header.innerHTML = `<span style="color:var(--gold)">✦</span>&nbsp; ${escHtml(custName || 'Customer')}
    <button onclick="closeConversation('${convId}')" style="background:transparent;border:1px solid rgba(245,54,92,0.3);color:#f5365c;font-size:0.65rem;letter-spacing:1px;padding:4px 10px;cursor:pointer;font-family:'Montserrat',sans-serif;">Close Chat</button>`;
  thread.innerHTML  = '';
  replyRow.style.display = 'flex';

  // Load messages
  const msgs = await api(`messages?conversation_id=eq.${convId}&order=created_at.asc`);
  if (Array.isArray(msgs)) {
    msgs.forEach(m => renderAdminMsg(m, false));
    if (msgs.length) lastMsgTs = msgs[msgs.length - 1].created_at;
  }
  thread.scrollTop = thread.scrollHeight;

  // Mark customer messages as read
  await api(`messages?conversation_id=eq.${convId}&sender=eq.customer&is_read=eq.false`, {
    method: 'PATCH', prefer: 'return=minimal', body: JSON.stringify({ is_read: true })
  });

  // Reload conv list to update highlights
  loadConversations();

  // Start polling for new messages in this conversation
  if (chatPollTimer) clearInterval(chatPollTimer);
  chatPollTimer = setInterval(() => pollThread(convId), 3500);
}

/* ── Render a single message in admin thread ── */
function renderAdminMsg(msg, animate = true) {
  const thread  = document.getElementById('chat-thread');
  if (!thread) return;
  const isAdmin = msg.sender === 'admin';
  const wrap = document.createElement('div');
  wrap.style.cssText = `display:flex;flex-direction:column;max-width:80%;align-self:${isAdmin ? 'flex-end' : 'flex-start'};${animate ? 'animation:msgIn .35s ease' : ''}`;

  const bubble = document.createElement('div');
  bubble.style.cssText = `padding:10px 14px;font-size:0.82rem;line-height:1.6;${
    isAdmin
      ? 'background:linear-gradient(135deg,var(--gold-dark),var(--gold));color:var(--black);font-weight:600;'
      : 'background:var(--surface2);border:1px solid var(--border);border-left:2px solid var(--gold);color:#ddd;'
  }`;
  bubble.textContent = msg.content;

  const time = document.createElement('div');
  time.style.cssText = `font-size:0.58rem;color:var(--muted);margin-top:3px;${isAdmin ? 'text-align:right;' : ''}`;
  time.textContent   = (isAdmin ? 'You · ' : `${msg.sender === 'customer' ? 'Customer · ' : ''}`) + fmtTime(msg.created_at);

  wrap.appendChild(bubble);
  wrap.appendChild(time);
  thread.appendChild(wrap);
  thread.scrollTop = thread.scrollHeight;
}

function fmtTime(iso) {
  return new Date(iso || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/* ── Poll for new customer messages ── */
async function pollThread(convId) {
  if (!lastMsgTs) return;
  const msgs = await api(
    `messages?conversation_id=eq.${convId}&created_at=gt.${encodeURIComponent(lastMsgTs)}&order=created_at.asc`
  );
  if (!Array.isArray(msgs) || msgs.length === 0) return;
  msgs.forEach(m => {
    renderAdminMsg(m);
    lastMsgTs = m.created_at;
  });
}

/* ── Admin sends reply ── */
async function sendAdminReply() {
  const input = document.getElementById('admin-reply-input');
  const text  = input?.value.trim();
  if (!text || !activeConvId) return;
  input.value = '';

  const rows = await api(`messages`, {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({ conversation_id: activeConvId, sender: 'admin', content: text })
  });
  if (Array.isArray(rows) && rows[0]) {
    renderAdminMsg(rows[0]);
    lastMsgTs = rows[0].created_at;
    await api(`conversations?id=eq.${activeConvId}`, {
      method: 'PATCH', prefer: 'return=minimal',
      body: JSON.stringify({ last_message_at: new Date().toISOString() })
    });
  }
}

/* ── Close conversation ── */
async function closeConversation(convId) {
  await api(`conversations?id=eq.${convId}`, {
    method: 'PATCH', prefer: 'return=minimal',
    body: JSON.stringify({ status: 'closed' })
  });
  showToast('Conversation closed');
  if (chatPollTimer) clearInterval(chatPollTimer);
  document.getElementById('chat-thread-header').innerHTML = '<span>Select a conversation</span>';
  document.getElementById('chat-thread').innerHTML = '';
  document.getElementById('admin-reply-row').style.display = 'none';
  activeConvId = null;
  loadConversations();
}

window.closeConversation = closeConversation;

/* ── Reply events ── */
document.getElementById('admin-reply-send')?.addEventListener('click', sendAdminReply);
document.getElementById('admin-reply-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendAdminReply();
});

/* ── Auto-refresh every 60s ── */
loadAll();
loadConversations();
setInterval(loadAll, 60000);
setInterval(loadConversations, 8000);
