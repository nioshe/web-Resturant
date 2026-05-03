/* ══ GUSTO — Luxury Restaurant Script ══ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── PRELOADER ── */
  const preloader = document.getElementById('preloader');
  setTimeout(() => {
    preloader.style.opacity = '0';
    preloader.style.transition = 'opacity .8s';
    setTimeout(() => preloader.style.display = 'none', 800);
  }, 2200);

  /* ── CUSTOM CURSOR ── */
  const cursor = document.querySelector('.cursor');
  const follower = document.querySelector('.cursor-follower');
  let mx = -100, my = -100, fx = -100, fy = -100;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  const animCursor = () => {
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    fx += (mx - fx) * 0.12;
    fy += (my - fy) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(animCursor);
  };
  animCursor();

  document.querySelectorAll('a, button, .menu-card, .order-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      follower.style.width = '60px';
      follower.style.height = '60px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '12px';
      cursor.style.height = '12px';
      follower.style.width = '40px';
      follower.style.height = '40px';
    });
  });

  /* ── THREE.JS HERO CANVAS ── */
  initHeroCanvas();

  /* ── NAV SCROLL ── */
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  /* ── WORD REVEAL for section titles ── */
  function wrapTitleWords(title) {
    const nodes = Array.from(title.childNodes);
    title.innerHTML = '';
    nodes.forEach(node => {
      if (node.nodeType === 3) {
        // text node — wrap each word
        node.textContent.split(/(\s+)/).forEach(part => {
          if (/^\s+$/.test(part)) {
            title.appendChild(document.createTextNode(part));
          } else if (part) {
            const wrap = document.createElement('span');
            wrap.className = 'word-wrap';
            wrap.innerHTML = `<span class="word">${part}</span>`;
            title.appendChild(wrap);
          }
        });
      } else {
        // element node (em, br, etc.) — keep it, wrap its text too
        const clone = node.cloneNode(true);
        if (clone.childNodes.length === 1 && clone.firstChild.nodeType === 3) {
          clone.innerHTML = clone.textContent.split(/(\s+)/).map(p =>
            /^\s+$/.test(p) ? p : p ? `<span class="word-wrap"><span class="word">${p}</span></span>` : ''
          ).join('');
        }
        title.appendChild(clone);
      }
    });
  }

  document.querySelectorAll('.section-title').forEach(wrapTitleWords);

  /* ── IMAGE REVEAL ── */
  document.querySelectorAll('.about-img-frame img').forEach(img => {
    img.classList.add('img-reveal');
  });

  /* ── SCROLL REVEAL ── */
  function activateReveal(el) {
    el.classList.add('visible');
    el.querySelectorAll('.word').forEach((w, i) => {
      setTimeout(() => w.classList.add('word-visible'), i * 70);
    });
    const line = el.querySelector('.section-line') ||
      el.closest('.section-header')?.querySelector('.section-line');
    if (line) line.classList.add('line-drawn');
    el.querySelectorAll('.img-reveal').forEach(img => img.classList.add('img-visible'));
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        activateReveal(e.target);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.04, rootMargin: '0px 0px -40px 0px' });

  const revealEls = Array.from(
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
  );
  revealEls.forEach(el => observer.observe(el));

  // Safety net: force-show anything still hidden after 3.5s
  setTimeout(() => {
    revealEls.forEach(el => {
      if (!el.classList.contains('visible')) activateReveal(el);
    });
    document.querySelectorAll('.word:not(.word-visible)').forEach(w => {
      w.classList.add('word-visible');
    });
    document.querySelectorAll('.section-line:not(.line-drawn)').forEach(l => {
      l.classList.add('line-drawn');
    });
    document.querySelectorAll('.img-reveal:not(.img-visible)').forEach(img => {
      img.classList.add('img-visible');
    });
  }, 3500);

  /* ── SECTION LINE DRAW (standalone headers) ── */
  const lineObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('line-drawn');
        lineObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.section-line').forEach(el => lineObserver.observe(el));

  /* ── WORD REVEAL observer (standalone section titles not inside .reveal) ── */
  const titleObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.word').forEach((w, i) => {
          setTimeout(() => w.classList.add('word-visible'), i * 80);
        });
        titleObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.section-title').forEach(t => titleObserver.observe(t));

  /* ── IMAGE REVEAL observer ── */
  const imgRevealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('img-visible');
        imgRevealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.img-reveal').forEach(el => imgRevealObserver.observe(el));


  /* ── ABOUT BADGE ── */
  const badge = document.querySelector('.about-badge');
  if (badge) {
    const badgeObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('badge-in');
          badgeObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    badgeObserver.observe(badge);
  }

  /* ── STAGGERED GRID CARDS ── */
  const staggerObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const siblings = Array.from(e.target.parentElement.children);
        const idx = siblings.indexOf(e.target);
        e.target.style.transitionDelay = `${idx * 0.1}s`;
        e.target.classList.add('visible');
        staggerObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.order-card').forEach(card => {
    staggerObserver.observe(card);
  });

  /* ── ORDER CARD BOUNCE ── */
  const bounceObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const siblings = Array.from(e.target.parentElement.children);
        const idx = siblings.indexOf(e.target);
        setTimeout(() => e.target.classList.add('bounce-in'), idx * 100);
        bounceObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.order-card').forEach(card => bounceObserver.observe(card));

  /* ── COUNTER ANIMATION ── */
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const statItem = e.target.closest('.stat-item');
        if (statItem) {
          const siblings = Array.from(statItem.parentElement.children);
          const idx = siblings.indexOf(statItem);
          setTimeout(() => {
            statItem.classList.add('stat-popped');
            animateCounter(e.target);
          }, idx * 150);
        } else {
          animateCounter(e.target);
        }
        counterObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num[data-target]')
    .forEach(el => counterObserver.observe(el));

  function animateCounter(el) {
    const target = +el.dataset.target;
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.round(current) + (el.dataset.suffix || '');
    }, 16);
  }

  /* ── MENU MARQUEE ── */
  const allMenuCards = Array.from(document.querySelectorAll('.menu-card[data-cat]'));
  const menuGrid = document.querySelector('.menu-grid');
  const marqueeWrap = document.createElement('div');
  marqueeWrap.className = 'menu-marquee-wrap';
  menuGrid.replaceWith(marqueeWrap);

  function attachCardEvents(card) {
    card.addEventListener('click', e => {
      if (e.target.closest('.add-btn')) return;
      const inner = card.querySelector('.card-inner');
      if (inner) inner.style.transform = '';
      card.classList.toggle('flipped');
    });
    card.addEventListener('mousemove', e => {
      if (card.classList.contains('flipped')) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      const inner = card.querySelector('.card-inner');
      if (inner) inner.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      if (card.classList.contains('flipped')) return;
      const inner = card.querySelector('.card-inner');
      if (inner) inner.style.transform = '';
    });
  }

  function buildMenuMarquee(cat) {
    const filtered = cat === 'all'
      ? allMenuCards
      : allMenuCards.filter(c => c.dataset.cat === cat);

    // Ensure enough cards to fill the screen before duplicating
    const cardWidth = 324;
    const minCount  = Math.ceil((window.innerWidth * 1.5) / cardWidth);
    let pool = filtered.slice();
    while (pool.length < minCount) pool = [...pool, ...filtered];

    // Split pool into two rows
    const mid  = Math.ceil(pool.length / 2);
    const rows = [pool.slice(0, mid), pool.slice(mid)];

    marqueeWrap.innerHTML = '';

    rows.forEach((rowCards, idx) => {
      const row = document.createElement('div');
      row.className = `menu-track-row ${idx === 0 ? 'row-left' : 'row-right'}`;
      // Set duration proportional to card count so speed feels consistent
      row.style.setProperty('--track-dur', `${rowCards.length * 5}s`);

      // Duplicate for seamless loop
      [...rowCards, ...rowCards].forEach(card => {
        const clone = card.cloneNode(true);
        clone.classList.remove('reveal', 'reveal-left', 'reveal-right');
        clone.style.opacity = '1';
        clone.style.transform = 'none';
        clone.style.transition = 'none';
        attachCardEvents(clone);
        row.appendChild(clone);
      });

      marqueeWrap.appendChild(row);
    });

  }

  // Delegated listener lives on the wrapper (only added once)
  marqueeWrap.addEventListener('click', e => {
    const btn = e.target.closest('.add-btn');
    if (btn) addToCart(btn.dataset.name, parseFloat(btn.dataset.price));
  });

  buildMenuMarquee('all');

  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildMenuMarquee(btn.dataset.cat);
    });
  });

  /* ── CART (localStorage-backed) ── */
  function getCart() {
    try { return JSON.parse(localStorage.getItem('gusto_cart')) || {}; }
    catch { return {}; }
  }

  function saveCart(cart) {
    localStorage.setItem('gusto_cart', JSON.stringify(cart));
    updateCartUI();
  }

  function updateCartUI() {
    const cart = getCart();
    const items = Object.values(cart);
    const count = items.reduce((s, v) => s + v.qty, 0);
    const subtotal = items.reduce((s, v) => s + v.qty * v.price, 0);
    const total = subtotal * 1.1;

    // Nav badge
    const badge = document.getElementById('nav-cart-badge');
    if (badge) badge.textContent = count;

    // View-order bar
    const bar = document.getElementById('view-order-bar');
    const countEl = document.getElementById('view-order-count');
    const totalEl = document.getElementById('view-order-total');
    if (bar) bar.classList.toggle('visible', count > 0);
    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
  }

  function addToCart(name, price) {
    const cart = getCart();
    if (cart[name]) { cart[name].qty++; }
    else { cart[name] = { qty: 1, price }; }
    saveCart(cart);
    showToast(`${name} added to your order`);
  }

  /* add-btn clicks handled by marquee delegation + order section below */

  // Order section add-btn delegation
  const orderSection = document.getElementById('order');
  if (orderSection) {
    orderSection.addEventListener('click', e => {
      const btn = e.target.closest('.add-btn');
      if (btn) addToCart(btn.dataset.name, parseFloat(btn.dataset.price));
    });
  }

  /* ── VIEW ORDER BUTTON ── */
  document.getElementById('nav-cart-btn')?.addEventListener('click', () => {
    window.location.href = 'order.html';
  });

  document.getElementById('view-order-btn')?.addEventListener('click', () => {
    window.location.href = 'order.html';
  });

  updateCartUI();

  /* ── RESERVATION FORM ── */
  const resForm = document.getElementById('reservation-form');
  if (resForm) {
    resForm.addEventListener('submit', async e => {
      e.preventDefault();
      const inputs = resForm.querySelectorAll('input, select, textarea');
      const d = {};
      inputs.forEach(el => { if (el.name) d[el.name] = el.value; });

      // Collect fields by position (form has no name attrs — use order)
      const all = [...resForm.querySelectorAll('input,select,textarea')];
      const data = {
        first_name:       all[0]?.value.trim(),
        last_name:        all[1]?.value.trim(),
        email:            all[2]?.value.trim(),
        phone:            all[3]?.value.trim(),
        date:             all[4]?.value,
        time:             all[5]?.value,
        guests:           all[6]?.value,
        occasion:         all[7]?.value || null,
        special_requests: all[8]?.value.trim() || null,
      };

      const submitBtn = resForm.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.textContent = 'Sending…'; submitBtn.disabled = true; }

      try {
        if (window.GustoAPI) await window.GustoAPI.submitReservation(data);
      } catch (err) {
        console.error('Reservation save failed:', err);
      } finally {
        if (submitBtn) { submitBtn.textContent = 'Confirm Reservation'; submitBtn.disabled = false; }
      }

      openModal('res-modal');
      resForm.reset();
    });
  }

  /* ── MODALS ── */
  function openModal(id) {
    document.getElementById(id).classList.add('open');
  }

  window.closeModal = function(id) {
    document.getElementById(id).classList.remove('open');
  };

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  /* ── TOAST ── */
  let toastTimeout;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-msg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ── SMOOTH SCROLL NAV ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── NAV RESERVE BUTTON ── */
  document.querySelector('.nav-reserve')?.addEventListener('click', () => {
    document.getElementById('reservation').scrollIntoView({ behavior: 'smooth' });
  });

  /* ── HAMBURGER MENU ── */
  const mobileNav     = document.getElementById('mobile-nav');
  const mobileOverlay = document.getElementById('mobile-nav-overlay');
  const hamburger     = document.querySelector('.nav-hamburger');
  const mobileClose   = document.getElementById('mobile-nav-close');

  function openMobileNav() {
    mobileNav.classList.add('open');
    mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    mobileNav.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openMobileNav);
  mobileClose?.addEventListener('click', closeMobileNav);
  mobileOverlay?.addEventListener('click', closeMobileNav);

  document.querySelectorAll('.mobile-nav a').forEach(a => {
    a.addEventListener('click', () => {
      closeMobileNav();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 400);
    });
  });

  /* ── PARALLAX ON HERO ── */
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
      heroContent.style.opacity = 1 - scrollY / 600;
    }
  });

  /* card flip + unflip handled per-clone inside buildMenuMarquee */

  renderCart();

  /* ══════════════════════════════════════
     BACKGROUND ANIMATIONS (section canvases)
     Layout/content untouched — pure backdrop
  ══════════════════════════════════════ */

  /* ── Constellation canvas ── */
  function initConstellationCanvas(canvas, section, opts = {}) {
    const ctx = canvas.getContext('2d');
    const { count = 45, maxDist = 140, speed = 0.28 } = opts;

    const pts = Array.from({ length: count }, () => ({
      x: 0, y: 0,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r:  Math.random() * 1.6 + 0.4,
    }));

    function resize() {
      canvas.width  = section.offsetWidth;
      canvas.height = section.offsetHeight;
      pts.forEach(p => {
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
      });
    }
    resize();
    window.addEventListener('resize', resize);

    (function tick() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(201,168,76,${(1 - d / maxDist) * 0.18})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      pts.forEach(p => {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, 'rgba(201,168,76,0.75)');
        g.addColorStop(1, 'rgba(201,168,76,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(tick);
    })();
  }

  /* ── Reservation: floating diamonds + pulse rings ── */
  function initReservationCanvas() {
    const section = document.getElementById('reservation');
    if (!section) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'section-canvas';
    section.insertBefore(canvas, section.firstChild);
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = section.offsetWidth;
      canvas.height = section.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const diamonds = Array.from({ length: 14 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      s: Math.random() * 20 + 7,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.005,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random() * 0.14 + 0.03,
    }));

    const rings = Array.from({ length: 5 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 100,
      maxR: Math.random() * 200 + 80,
      spd: Math.random() * 0.5 + 0.2,
    }));

    (function tick() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      rings.forEach(ring => {
        ring.r += ring.spd;
        if (ring.r > ring.maxR) {
          ring.r = 0;
          ring.x = Math.random() * W;
          ring.y = Math.random() * H;
        }
        const a = 0.12 * (1 - ring.r / ring.maxR);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(201,168,76,${a})`;
        ctx.lineWidth = 1;
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      diamonds.forEach(d => {
        d.rot += d.vr; d.x += d.vx; d.y += d.vy;
        if (d.x < -50 || d.x > W + 50) d.vx *= -1;
        if (d.y < -50 || d.y > H + 50) d.vy *= -1;
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.strokeStyle = `rgba(201,168,76,${d.a})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -d.s); ctx.lineTo(d.s * 0.55, 0);
        ctx.lineTo(0, d.s);  ctx.lineTo(-d.s * 0.55, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });

      requestAnimationFrame(tick);
    })();
  }

  /* ── Footer constellation ── */
  function initFooterCanvas() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.45;';
    footer.insertBefore(canvas, footer.firstChild);
    initConstellationCanvas(canvas, footer, { count: 30, maxDist: 120, speed: 0.18 });
  }

  /* ── Ambient orbs (slow drifting glows) ── */
  function addOrbs(section) {
    ['lux-orb-a', 'lux-orb-b', 'lux-orb-c'].forEach(cls => {
      const orb = document.createElement('div');
      orb.className = `lux-orb ${cls}`;
      section.insertBefore(orb, section.firstChild);
    });
  }

  /* ── Sweep line per section ── */
  function addSweep(section) {
    const sweep = document.createElement('div');
    sweep.className = 'section-sweep';
    sweep.style.animationDelay = `${Math.random() * 5}s`;
    section.insertBefore(sweep, section.firstChild);
  }

  /* ── Wire everything up ── */
  ['about-canvas', 'menu-bg-canvas', 'order-bg-canvas'].forEach(id => {
    const c = document.getElementById(id);
    if (c) initConstellationCanvas(c, c.parentElement);
  });

  initReservationCanvas();
  initFooterCanvas();

  ['#about', '#menu', '#order', '#reservation'].forEach(sel => {
    const s = document.querySelector(sel);
    if (s) { addOrbs(s); addSweep(s); }
  });

});

/* ══ THREE.JS HERO ══ */
function initHeroCanvas() {
  if (!window.THREE) return;

  const canvas = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const geometry = new THREE.BufferGeometry();
  const count = 1200;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    sizes[i] = Math.random() * 2.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime:  { value: 0 },
      uColor: { value: new THREE.Color('#C9A84C') },
    },
    vertexShader: `
      attribute float size;
      uniform float uTime;
      varying float vSize;
      void main() {
        vSize = size;
        vec3 pos = position;
        pos.y += sin(uTime * 0.4 + position.x * 0.5) * 0.15;
        pos.x += cos(uTime * 0.3 + position.z * 0.5) * 0.1;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (250.0 / -mv.z);
        gl_Position  = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vSize;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        float alpha = 1.0 - smoothstep(0.35, 0.5, d);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor, alpha * 0.32);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  /* Floating geometric shapes */
  const shapes = [];
  const shapeMat = new THREE.MeshStandardMaterial({
    color: 0xC9A84C,
    wireframe: true,
    transparent: true,
    opacity: 0.06,
  });

  const ambientLight = new THREE.AmbientLight(0xC9A84C, 0.5);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xC9A84C, 1, 20);
  pointLight.position.set(0, 3, 3);
  scene.add(pointLight);

  [[new THREE.OctahedronGeometry(0.6), [-3, 1.5, -1]],
   [new THREE.IcosahedronGeometry(0.5), [3, -1.5, -2]],
   [new THREE.TetrahedronGeometry(0.7), [0, 2.5, -3]],
   [new THREE.OctahedronGeometry(0.4), [4, 2, -1.5]],
   [new THREE.IcosahedronGeometry(0.35),[-4, -2, -1]],
  ].forEach(([geo, pos]) => {
    const mesh = new THREE.Mesh(geo, shapeMat.clone());
    mesh.position.set(...pos);
    scene.add(mesh);
    shapes.push(mesh);
  });

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();

  const animate = () => {
    const t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;

    particles.rotation.y = t * 0.04;
    particles.rotation.x = t * 0.02;

    camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    shapes.forEach((s, i) => {
      s.rotation.x = t * (0.2 + i * 0.05);
      s.rotation.y = t * (0.15 + i * 0.04);
      s.position.y = s.userData.baseY || s.position.y;
      s.position.y += Math.sin(t * 0.5 + i) * 0.003;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();
}
