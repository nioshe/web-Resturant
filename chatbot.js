/* ══ Gusto — Live Customer Chat ══ */

const SB_URL  = window.GUSTO_CONFIG?.supabaseUrl  || '';
const SB_ANON = window.GUSTO_CONFIG?.supabaseAnon || '';

const chatBtn   = document.getElementById('chat-btn');
const chatPanel = document.getElementById('chat-panel');
const chatClose = document.getElementById('chat-close');
const chatMsgs  = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend  = document.getElementById('chat-send');
const chatSuggs = document.getElementById('chat-suggestions');
const chatUnread= document.getElementById('chat-unread');

let convId     = localStorage.getItem('gusto_conv_id')   || null;
let sessionId  = localStorage.getItem('gusto_session_id')|| crypto.randomUUID();
let custName   = localStorage.getItem('gusto_cust_name') || null;
let lastTs     = null;
let pollTimer  = null;
let opened     = false;
let waitingName= false;

localStorage.setItem('gusto_session_id', sessionId);

/* ── REST helpers ── */
async function sbPost(table, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`,
      'Content-Type': 'application/json', Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function sbGet(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` }
  });
  return r.json();
}

async function sbPatch(table, filter, body) {
  await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal'
    },
    body: JSON.stringify(body)
  });
}

/* ── Time format ── */
function fmtTime(iso) {
  return new Date(iso || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/* ── Render a message bubble ── */
function renderMsg({ sender, content, created_at }, animate = true) {
  const role = sender === 'customer' ? 'user' : 'bot';
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}${animate ? '' : ' no-anim'}`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = content;

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = (sender === 'admin' ? '✦ Gusto · ' : '') + fmtTime(created_at);

  wrap.appendChild(bubble);
  wrap.appendChild(time);
  chatMsgs.appendChild(wrap);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

/* ── Typing indicator ── */
let typingEl = null;
function showTyping() {
  if (typingEl) return;
  typingEl = document.createElement('div');
  typingEl.className = 'msg bot';
  typingEl.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  chatMsgs.appendChild(typingEl);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}
function hideTyping() {
  typingEl?.remove();
  typingEl = null;
}

/* ── System message ── */
function sysMsg(text) {
  const el = document.createElement('div');
  el.style.cssText = 'text-align:center;font-size:0.65rem;letter-spacing:1px;color:var(--muted);padding:6px 0;';
  el.textContent = text;
  chatMsgs.appendChild(el);
}

/* ── Load existing messages on re-open ── */
async function loadHistory() {
  if (!convId) return;
  const msgs = await sbGet(`messages?conversation_id=eq.${convId}&order=created_at.asc`);
  if (!Array.isArray(msgs)) return;
  msgs.forEach(m => { renderMsg(m, false); if (m.created_at > (lastTs || '')) lastTs = m.created_at; });
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

/* ── Poll for new admin replies ── */
async function pollReplies() {
  if (!convId) return;
  const filter = lastTs
    ? `messages?conversation_id=eq.${convId}&sender=eq.admin&created_at=gt.${encodeURIComponent(lastTs)}&order=created_at.asc`
    : `messages?conversation_id=eq.${convId}&sender=eq.admin&order=created_at.asc`;

  const msgs = await sbGet(filter);
  if (!Array.isArray(msgs) || msgs.length === 0) return;

  hideTyping();
  msgs.forEach(m => {
    renderMsg(m);
    lastTs = m.created_at;
    // show unread badge if chat closed
    if (!chatPanel.classList.contains('open')) {
      chatUnread.style.display = 'flex';
      chatUnread.textContent   = parseInt(chatUnread.textContent || '0') + 1;
    }
  });
}

/* ── Start polling ── */
function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(pollReplies, 4000);
}

/* ── Create a new conversation ── */
async function createConversation(name) {
  const rows = await sbPost('conversations', {
    session_id: sessionId, customer_name: name, status: 'open'
  });
  if (Array.isArray(rows) && rows[0]) {
    convId    = rows[0].id;
    custName  = name;
    localStorage.setItem('gusto_conv_id',   convId);
    localStorage.setItem('gusto_cust_name', custName);
    return true;
  }
  return false;
}

/* ── Send a message ── */
async function sendMessage(text) {
  if (!text.trim()) return;
  chatInput.value = '';
  chatSuggs.innerHTML = '';

  // Ensure conversation exists
  if (!convId) {
    if (!custName) { promptName(); return; }
    await createConversation(custName);
  }

  renderMsg({ sender: 'customer', content: text, created_at: new Date().toISOString() });

  // Save to Supabase
  const rows = await sbPost('messages', {
    conversation_id: convId,
    sender: 'customer',
    content: text
  });
  if (Array.isArray(rows) && rows[0]) lastTs = rows[0].created_at;

  // Update last_message_at on conversation
  await sbPatch('conversations', `id=eq.${convId}`, { last_message_at: new Date().toISOString() });

  startPolling();
  showAutoReplySuggestions();
}

/* ── Auto suggestions after customer sends ── */
function showAutoReplySuggestions() {
  setTimeout(() => {
    if (chatSuggs.children.length === 0) {
      setSuggestions(['📋 Show menu', '📍 Where are you?', '🕐 Opening hours', '📞 Phone number']);
    }
  }, 500);
}

/* ── Suggestion chips ── */
function setSuggestions(chips) {
  chatSuggs.innerHTML = '';
  chips.slice(0, 4).forEach(label => {
    const btn = document.createElement('button');
    btn.className = 'chat-chip';
    btn.textContent = label;
    btn.addEventListener('click', () => sendMessage(label));
    chatSuggs.appendChild(btn);
  });
}

/* ── Ask for customer name ── */
function promptName() {
  waitingName = true;
  chatMsgs.innerHTML = '';
  sysMsg('New conversation');
  renderMsg({
    sender: 'admin',
    content: 'Marhaba! 👋 Welcome to Gusto. Before we start, what is your name?',
    created_at: new Date().toISOString()
  }, true);
  chatInput.placeholder = 'Enter your name…';
}

/* ── Open chat ── */
function openChat() {
  chatPanel.classList.add('open');
  chatUnread.style.display = 'none';
  chatUnread.textContent   = '0';

  if (!opened) {
    opened = true;
    if (!custName) {
      promptName();
    } else {
      sysMsg('Conversation resumed');
      loadHistory().then(() => startPolling());
    }
  }
}

/* ── Handle send ── */
function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;

  if (waitingName) {
    waitingName = false;
    custName = text;
    localStorage.setItem('gusto_cust_name', custName);
    chatInput.placeholder = 'Type your message…';
    createConversation(custName).then(() => {
      renderMsg({ sender: 'customer', content: text, created_at: new Date().toISOString() });
      chatInput.value = '';
      // Send a welcome message back (admin auto-reply)
      sbPost('messages', {
        conversation_id: convId, sender: 'customer', content: text
      });
      sbPatch('conversations', `id=eq.${convId}`, { last_message_at: new Date().toISOString() });
      showTyping();
      setTimeout(() => {
        hideTyping();
        renderMsg({
          sender: 'admin',
          content: `Shukran ${custName}! 🌟 How can I help you today? Ask about our menu, hours, reservations, or anything else!`,
          created_at: new Date().toISOString()
        });
        setSuggestions(['📋 Show menu', '📍 Where are you?', '🕐 Opening hours', '🍽 Reserve a table']);
      }, 1200);
      startPolling();
    });
    return;
  }

  sendMessage(text);
}

/* ── Events ── */
chatBtn.addEventListener('click', openChat);
chatClose.addEventListener('click', () => chatPanel.classList.remove('open'));
chatSend.addEventListener('click', handleSend);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });

/* ── Show unread badge after 4s ── */
setTimeout(() => {
  if (!opened) {
    chatUnread.style.display = 'flex';
    chatUnread.textContent   = '1';
  }
}, 4000);

/* ── Resume polling if returning visitor ── */
if (convId && custName) startPolling();
