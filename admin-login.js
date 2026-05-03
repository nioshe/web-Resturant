/* ══ Gusto Admin — Login ══ */
const SUPABASE_URL  = window.GUSTO_CONFIG?.supabaseUrl  || '';
const SUPABASE_ANON = window.GUSTO_CONFIG?.supabaseAnon || '';

// Redirect if already logged in
const existing = sessionStorage.getItem('gusto_admin_token');
if (existing) window.location.href = 'admin.html';

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn   = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  const email = document.getElementById('email').value.trim();
  const pass  = document.getElementById('password').value;

  btn.textContent = 'Signing in…';
  btn.disabled    = true;
  errEl.style.display = 'none';

  try {
    const res  = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method:  'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error_description || data.message || 'Login failed');

    sessionStorage.setItem('gusto_admin_token', data.access_token);
    sessionStorage.setItem('gusto_admin_email', data.user?.email || email);
    window.location.href = 'admin.html';

  } catch (err) {
    errEl.textContent    = err.message;
    errEl.style.display  = 'block';
    btn.textContent      = 'Sign In';
    btn.disabled         = false;
  }
});
