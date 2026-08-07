/* ============================================================
   FOUNDER'S SPRINT — CHECKOUT FLOW
   Single-page multi-step booking prototype
   ============================================================ */

(function () {
  'use strict';

  // ── Supabase (session detection so logged-in founders skip the login step) ──
  var SB_URL = 'https://ivedeivyotwevjxvcuoe.supabase.co';
  var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZWRlaXZ5b3R3ZXZqeHZjdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk1OTIsImV4cCI6MjA5MDc3NTU5Mn0.qMqjTMDRcvuuSy0yXLPH-yZpWFZdUv63enAsEWxzsss';
  var sb = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(SB_URL, SB_ANON) : null;
  var LOGGED_IN = false;
  var API = '';  // same-origin → Cloudflare /api/* proxy → api.founderssprint.co

  // ── State ──────────────────────────────────────────────────
  const state = {
    step: 1,
    tier: null,           // 'single' | 'pick3' | 'cohort'
    specialties: [],      // selected L3 slugs — the atomic bookable unit
    disciplines: [],      // derived: distinct parent disciplines of the selected L3s
    cohort: 'sep-2026',
    plan: 'full',         // 'full' | '2x' | '3x'
    provider: 'mtn',      // 'mtn' | 'airtel'
    name: '',
    email: '',
    phone: '',
    phoneCode: '+256',
    company: '',
    password: '',
    cohorts: [],          // real cohorts fetched from /api/cohorts (for cohort-track id resolution)
    _registrationId: null,
  };

  // Fetch the real, open cohorts so the cohort track can resolve a numeric cohortId.
  function loadCohorts() {
    fetch(API + '/api/cohorts')
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) { state.cohorts = Array.isArray(list) ? list : []; })
      .catch(function () { state.cohorts = []; });
  }

  // Map the selected cohort card ('sep-2026' / 'oct-2026') to a real open cohort id
  // by matching year + month on start_date. Returns null if none is available.
  function resolveCohortId() {
    var m = /^([a-z]{3})-(\d{4})$/.exec(state.cohort || '');
    if (!m) return null;
    var MONTHS = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
    var mon = MONTHS[m[1]], yr = parseInt(m[2], 10);
    var match = state.cohorts.filter(function (c) {
      if (!c.start_date || c.status !== 'open') return false;
      var d = new Date(c.start_date);
      return d.getUTCFullYear() === yr && (d.getUTCMonth() + 1) === mon;
    });
    return match.length ? match[0].id : null;
  }

  // Single source of truth for the L1/L2/L3 taxonomy (see ../taxonomy.js).
  const TAX = window.FS_TAXONOMY;
  const ALL_SPECS = TAX ? TAX.specialties.map(function (s) { return s.slug; }) : [];

  // `max` = number of L3 specialties this tier includes.
  // single = 1 · pick3 = 3 · cohort = every L3 (the whole programme).
  const TIER_DATA = {
    single:  { name: 'One-on-One Coaching', price: 500000,   priceLabel: 'UGX 500,000',   max: 1,                shortPrice: 'UGX 500K' },
    pick3:   { name: 'Pick 3 Bundle',       price: 1000000,  priceLabel: 'UGX 1,000,000', max: 3,                shortPrice: 'UGX 1M' },
    cohort:  { name: 'Full Cohort',         price: 2500000,  priceLabel: 'UGX 2,500,000', max: ALL_SPECS.length, shortPrice: 'UGX 2.5M' },
    vip1on1: { name: 'VIP',                 price: 5000000,  priceLabel: 'UGX 5,000,000', max: 0,                shortPrice: 'UGX 5M' },
  };

  // ── Launch promo (date-gated via /promo.js) ────────────────
  // Tier/marketing displays show the discounted OFFER price. The deposit charged
  // now stays FULL (server-computed, matches the MoMo prompt); the 15% is realised
  // on the balance, collected once payment-layer enforcement is wired.
  function promo()       { return (window.FS_PROMO && window.FS_PROMO.active && window.FS_PROMO.active()) ? window.FS_PROMO : null; }
  function offerTotal(t) { var P = promo(); return P ? P.discount(TIER_DATA[t].price) : TIER_DATA[t].price; }
  function offerShort(t) { var P = promo(); return P ? ('UGX ' + P.compact(P.discount(TIER_DATA[t].price))) : TIER_DATA[t].shortPrice; }

  const DISC_NAMES = {
    marketing:  'Marketing & Branding',
    finance:    'Financial Modelling',
    investment: 'Investment Readiness',
    strategy:   'Strategy & Team Building',
    product:    'Product Dev & Pricing',
  };

  // Keep state.disciplines in sync with the selected L3 specialties.
  function syncDisciplines() {
    const seen = [];
    state.specialties.forEach(function (slug) {
      const s = TAX && TAX.get(slug);
      if (s && seen.indexOf(s.disciplineKey) === -1) seen.push(s.disciplineKey);
    });
    state.disciplines = seen;
  }

  // L2 modules whose every L3 is currently selected (e.g. the full Pitch Craft track).
  function completedTracks() {
    if (!TAX) return [];
    const out = [];
    TAX.disciplines.forEach(function (d) {
      d.l2.forEach(function (m) {
        const slugs = m.l3.map(function (n) { return TAX.slugify(n); });
        if (slugs.length && slugs.every(function (sl) { return state.specialties.indexOf(sl) >= 0; })) {
          out.push(m.name);
        }
      });
    });
    return out;
  }

  // ── Elements ───────────────────────────────────────────────
  const $  = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

  const panels  = $$('.step-panel');
  const navSteps = $$('.nav-progress .step');
  const navBars  = $$('.nav-progress .bar .fill');

  // ── URL params for entry-point pre-selection ───────────────
  function readEntryParams() {
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier');
    if (tier && TIER_DATA[tier]) {
      selectTier(tier);
    }
    // Deep-link from discovery: ?spec=slug or ?spec=slug,slug,slug (L3 slugs).
    const spec = params.get('spec');
    if (spec && TAX) {
      const max = state.tier ? TIER_DATA[state.tier].max : 3;
      const picked = spec.split(',').map(function (x) { return x.trim(); })
        .filter(function (sl) { return TAX.get(sl); });
      state.specialties = picked.slice(0, max);
      syncDisciplines();
    }
  }

  // ── Navigation ─────────────────────────────────────────────
  function goToStep(n) {
    state.step = n;

    panels.forEach((p, i) => {
      p.classList.toggle('active', i + 1 === n);
    });

    navSteps.forEach((s, i) => {
      const sn = i + 1;
      s.classList.toggle('done', sn < n);
      s.classList.toggle('active', sn === n);
    });

    // Fill progress bars
    navBars.forEach((bar, i) => {
      const barStep = i + 1; // bar between step i+1 and i+2
      bar.style.width = barStep < n ? '100%' : '0%';
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Step-specific setup
    if (n === 2) setupStep2();
    if (n === 3) setupStep3();
    if (n === 4) setupStep4();
    if (n === 5) startPaymentProcessing();
  }

  // After choosing a tier: skip the login step entirely if already signed in.
  function proceedFromTier() {
    if (!state.tier) return;
    updateStep2Badge();
    goToStep(LOGGED_IN ? 3 : 2);
  }

  // ── Step 1: Tier selection ─────────────────────────────────
  function selectTier(tier) {
    state.tier = tier;
    state.specialties = [];
    state.disciplines = [];

    $$('.tier-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.tier === tier);
    });
  }

  $$('.tier-card').forEach(card => {
    card.addEventListener('click', () => {
      selectTier(card.dataset.tier);
    });
  });

  $$('.tier-cta').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectTier(btn.dataset.tier);
      proceedFromTier();
    });
  });

  // Also allow clicking the card itself to proceed (double-click or if already selected)
  $$('.tier-card').forEach(card => {
    card.addEventListener('dblclick', () => {
      proceedFromTier();
    });
  });

  // ── Step 2: Account / Login ─────────────────────────────────
  let authMode = 'create'; // 'create' | 'login'

  function updateStep2Badge() {
    const t = TIER_DATA[state.tier];
    if (!t) return;
    $('#badge-tier-name').textContent = t.name;
    $('#badge-tier-price').textContent = offerShort(state.tier);
    // Also update login form badge
    const loginName = $('#badge-tier-name-login');
    const loginPrice = $('#badge-tier-price-login');
    if (loginName) loginName.textContent = t.name;
    if (loginPrice) loginPrice.textContent = offerShort(state.tier);
  }

  // Auth toggle tabs
  $$('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      authMode = tab.dataset.mode;
      $$('.auth-tab').forEach(t => t.classList.toggle('active', t === tab));
      $('#form-create').style.display = authMode === 'create' ? 'block' : 'none';
      $('#form-login').style.display = authMode === 'login' ? 'block' : 'none';
      $('#magic-sent').style.display = 'none';

      // Update header text
      if (authMode === 'create') {
        $('#step2-title').textContent = 'Create your account';
        $('#step2-sub').textContent = "Create your account with a password — you'll use it to sign in and reach your data room.";
      } else {
        $('#step2-title').textContent = 'Welcome back';
        $('#step2-sub').textContent = "Enter your email and password to sign in and continue.";
      }
    });
  });

  // Change tier buttons (both forms)
  $('#btn-change-tier').addEventListener('click', () => goToStep(1));
  const changeTierLogin = $('#btn-change-tier-login');
  if (changeTierLogin) changeTierLogin.addEventListener('click', () => goToStep(1));

  // Create account form submission — capture details (incl. password) and move on.
  // The account + registration are created server-side at the pay step so the
  // deposit STK push can fire immediately after.
  $('#auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.name = $('#f-name').value.trim();
    state.email = $('#f-email').value.trim();
    state.phone = $('#f-phone').value.trim();
    state.phoneCode = $('#f-phone-code').value;
    state.company = $('#f-company').value.trim();
    const pwEl = $('#f-password');
    state.password = pwEl ? pwEl.value : '';

    if (!state.name || !state.email || !state.phone) return;
    if (!state.password || state.password.length < 8) {
      if (pwEl) { pwEl.focus(); pwEl.reportValidity && pwEl.reportValidity(); }
      return;
    }
    goToStep(3);
  });

  // Login form submission — real password sign-in so the returning founder gets a
  // session (drives the deposit poll + the dashboard link), then continue to config.
  const loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#l-email').value.trim();
      const pw = $('#l-password') ? $('#l-password').value : '';
      const errEl = $('#login-error');
      if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
      if (!email || !pw) return;

      const btn = $('#btn-login-link');
      const tx = btn ? btn.querySelector('.btn-text') : null;
      const ld = btn ? btn.querySelector('.btn-loading') : null;
      if (tx) tx.style.display = 'none'; if (ld) ld.style.display = 'inline';
      if (btn) btn.disabled = true;

      try {
        if (!sb) throw new Error('Sign-in is unavailable right now.');
        const { error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        state.email = email;
        state.password = pw;   // lets the pay step re-establish the session if needed
        LOGGED_IN = true;
        // Best-effort: pull name + phone from the founder profile (RLS scopes to own row)
        try {
          const pr = await sb.from('founder_profiles').select('first_name,last_name,phone,whatsapp').limit(1);
          const p = pr && pr.data && pr.data[0];
          if (p) {
            const nm = ((p.first_name || '') + ' ' + (p.last_name || '')).trim();
            if (nm) state.name = nm;
            const ph = (p.phone || p.whatsapp || '').trim();
            if (ph) { state.phone = ph; state.phoneCode = ''; }
          }
        } catch (e2) {}
        goToStep(3);
      } catch (err) {
        if (errEl) { errEl.textContent = (err && err.message) ? err.message : 'Could not sign you in. Check your details.'; errEl.style.display = 'block'; }
      } finally {
        if (tx) tx.style.display = 'inline'; if (ld) ld.style.display = 'none';
        if (btn) btn.disabled = false;
      }
    });
  }

  // Resend
  $('#btn-resend').addEventListener('click', () => {
    $('#btn-resend').textContent = 'Sent!';
    setTimeout(() => { $('#btn-resend').textContent = 'Resend link'; }, 2000);
  });

  // Change email — return to whichever form was active
  $('#btn-change-email').addEventListener('click', () => {
    $('#auth-toggle').style.display = 'flex';
    if (authMode === 'create') {
      $('#form-create').style.display = 'block';
      $('#f-email').focus();
    } else {
      $('#form-login').style.display = 'block';
      $('#l-email').focus();
    }
    $('#magic-sent').style.display = 'none';
  });

  // ── Session detection (already logged in) ──────────────────
  // Checks for an existing Supabase session. If found, shows the
  // "Continue as [name]" card instead of create/login forms.
  // Phase 1: stub that checks for a prototype flag.
  // Phase 2: real Supabase session check.
  async function checkExistingSession() {
    if (!sb) return false;
    try {
      const s = await sb.auth.getSession();
      const session = s && s.data && s.data.session;
      if (!session || !session.user) return false;
      state.email = session.user.email || state.email;
      // Name + phone from the founder's profile (best-effort; RLS scopes to own row)
      try {
        const pr = await sb.from('founder_profiles').select('first_name,last_name,phone,whatsapp').limit(1);
        const p = pr && pr.data && pr.data[0];
        if (p) {
          const nm = ((p.first_name || '') + ' ' + (p.last_name || '')).trim();
          if (nm) state.name = nm;
          const ph = (p.phone || p.whatsapp || '').trim();
          if (ph) { state.phone = ph; state.phoneCode = ''; }
        }
      } catch (e) {}
      LOGGED_IN = true;
      return true;
    } catch (e) { return false; }
  }

  function populateSessionCard() {
    const nm = state.name || (state.email ? state.email.split('@')[0] : 'Your account');
    const initials = (state.name || state.email || '?').replace(/@.*/, '').split(/[ .]/).filter(Boolean)
      .map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('session-avatar', initials);
    set('session-name', nm);
    set('session-email', state.email || '');
    set('session-first-name', (state.name || 'there').split(' ')[0]);
  }

  // Step 2: signed-in founders see "Continue as…", everyone else sees the auth forms.
  function setupStep2() {
    updateStep2Badge();
    if (!LOGGED_IN) return;
    populateSessionCard();
    ['auth-toggle', 'form-create', 'form-login', 'magic-sent'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    const sa = document.getElementById('session-active'); if (sa) sa.style.display = 'block';
    $('#step2-title').textContent = 'Welcome back';
    $('#step2-sub').textContent = "You're signed in. Continue to configure your sessions.";
  }

  // Continue as logged-in user
  const btnContinue = $('#btn-continue-session');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => goToStep(3));
  }

  // Switch account
  const btnSwitch = $('#btn-switch-account');
  if (btnSwitch) {
    btnSwitch.addEventListener('click', async () => {
      try { if (sb) await sb.auth.signOut(); } catch (e) {}
      LOGGED_IN = false;
      $('#session-active').style.display = 'none';
      $('#auth-toggle').style.display = 'flex';
      $('#form-login').style.display = 'block';
      $('#form-create').style.display = 'none';
      authMode = 'login';
      $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'login'));
      $('#step2-title').textContent = 'Welcome back';
      $('#step2-sub').textContent = "Enter your email and password to sign in and continue.";
      state.name = '';
      state.email = '';
      state.phone = '';
    });
  }

  // ── Step 3: Session configuration ──────────────────────────
  function setupStep3() {
    const tier = state.tier;
    const discPanel = $('#config-disciplines');
    const cohortPanel = $('#config-cohort');
    const vipPanel = $('#config-vip');
    if (vipPanel) vipPanel.style.display = 'none';

    if (tier === 'vip1on1') {
      discPanel.style.display = 'none';
      cohortPanel.style.display = 'none';
      if (vipPanel) vipPanel.style.display = 'block';
      $('#config-title').textContent = 'Your VIP engagement';
      $('#config-sub').textContent = 'Private, dedicated coaching across all five disciplines — for you and your whole leadership team.';
      state.specialties = [];
      state.disciplines = [];
      updateStep3Button();
    } else if (tier === 'cohort') {
      discPanel.style.display = 'none';
      cohortPanel.style.display = 'block';
      $('#config-title').textContent = 'Choose your cohort';
      $('#config-sub').textContent = 'Select a cohort start date. Every specialty across all 5 disciplines is included.';
      state.specialties = ALL_SPECS.slice();
      syncDisciplines();
      updateStep3Button();
    } else {
      discPanel.style.display = 'block';
      cohortPanel.style.display = 'none';
      const max = TIER_DATA[tier].max;
      $('#disc-max').textContent = max;
      if (tier === 'single') {
        $('#config-title').textContent = 'Choose your specialty';
        $('#config-sub').textContent = 'Pick the one 2-hour deep-dive you need most. Open a discipline to see its specialties.';
      } else {
        $('#config-title').textContent = 'Pick your 3 specialties';
        $('#config-sub').textContent = 'Any 3 two-hour deep-dives — mix across disciplines, or take all three of one track.';
      }
      buildSpecPicker();
      renderSpecSelection();
    }
  }

  // Build the discipline → L2 → L3 accordion once (idempotent).
  function buildSpecPicker() {
    const grid = $('#disc-grid');
    if (!grid || grid.dataset.built === '1' || !TAX) return;
    let html = '';
    TAX.disciplines.forEach(function (d) {
      html += '<div class="spec-disc" data-disc="' + d.key + '">';
      html += '<button type="button" class="spec-disc-head">'
        + '<span class="spec-dot" style="background:' + d.color + '"></span>'
        + '<span class="spec-disc-name">' + d.label + '</span>'
        + '<span class="spec-disc-meta"><span class="spec-disc-count" data-disc-count="' + d.key + '"></span>'
        + '<svg class="spec-chev" width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
        + '</button>';
      html += '<div class="spec-disc-body">';
      d.l2.forEach(function (m) {
        html += '<div class="spec-l2">' + m.name + '</div>';
        m.l3.forEach(function (name) {
          const slug = TAX.slugify(name);
          html += '<button type="button" class="spec-row" data-spec="' + slug + '">'
            + '<span class="spec-row-name">' + name + '</span>'
            + '<span class="spec-check"><svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 10L9 14L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
            + '</button>';
        });
      });
      html += '</div></div>';
    });
    grid.innerHTML = html;
    grid.dataset.built = '1';

    // Accordion expand/collapse
    $$('.spec-disc-head', grid).forEach(function (head) {
      head.addEventListener('click', function () {
        head.parentElement.classList.toggle('open');
      });
    });
    // Specialty toggle (delegated)
    grid.addEventListener('click', function (e) {
      const row = e.target.closest('.spec-row');
      if (!row) return;
      toggleSpec(row.dataset.spec);
    });
  }

  function toggleSpec(slug) {
    const max = TIER_DATA[state.tier].max;
    const idx = state.specialties.indexOf(slug);
    if (idx >= 0) {
      state.specialties.splice(idx, 1);
    } else if (state.specialties.length < max) {
      state.specialties.push(slug);
    }
    syncDisciplines();
    renderSpecSelection();
  }

  function renderSpecSelection() {
    const grid = $('#disc-grid');
    if (!grid) return;
    const max = TIER_DATA[state.tier].max;
    const atMax = state.specialties.length >= max;

    $$('.spec-row', grid).forEach(function (row) {
      const sel = state.specialties.indexOf(row.dataset.spec) >= 0;
      row.classList.toggle('selected', sel);
      row.classList.toggle('disabled', !sel && atMax);
    });
    // Per-discipline selected counts
    TAX.disciplines.forEach(function (d) {
      const n = state.specialties.filter(function (sl) {
        const s = TAX.get(sl); return s && s.disciplineKey === d.key;
      }).length;
      const el = grid.querySelector('[data-disc-count="' + d.key + '"]');
      if (el) el.textContent = n ? (n + ' selected') : '';
    });
    $('#disc-count').textContent = state.specialties.length;
    updateStep3Button();
  }

  // Cohort selection
  $$('.cohort-card').forEach(card => {
    card.addEventListener('click', () => {
      state.cohort = card.dataset.cohort;
      $$('.cohort-card').forEach(c => c.classList.toggle('selected', c === card));
      updateStep3Button();
    });
  });

  // Instalment picker
  $$('.inst-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      state.plan = btn.dataset.plan;
      $$('.inst-opt').forEach(b => b.classList.toggle('selected', b === btn));
    });
  });

  function updateStep3Button() {
    const btn = $('#btn-next-3');
    if (state.tier === 'vip1on1') {
      btn.disabled = false;   // VIP is a tailored package — nothing to select
    } else if (state.tier === 'cohort') {
      btn.disabled = !state.cohort;
    } else {
      const max = TIER_DATA[state.tier].max;
      btn.disabled = state.specialties.length < max;
    }
  }

  $('#btn-next-3').addEventListener('click', () => {
    if (!$('#btn-next-3').disabled) goToStep(4);
  });

  $('#btn-back-3').addEventListener('click', () => goToStep(2));

  // ── Step 4: Review & pay ───────────────────────────────────
  function setupStep4() {
    const t = TIER_DATA[state.tier];

    // Tier — show the discounted offer price (struck list price) when the promo is live
    $('.review-tier-name').textContent = t.name;
    if (promo()) {
      $('.review-tier-price').innerHTML = offerShort(state.tier)
        + ' <s style="opacity:.5;font-weight:400;font-size:.82em">was ' + t.shortPrice + '</s>';
    } else {
      $('.review-tier-price').textContent = t.shortPrice;
    }

    // Specialties (the bookable L3 units)
    const discContainer = $('#review-disciplines');
    discContainer.innerHTML = '';
    if (state.tier === 'cohort') {
      const tag = document.createElement('span');
      tag.className = 'review-disc-tag';
      tag.textContent = 'All ' + ALL_SPECS.length + ' specialties · 5 disciplines';
      discContainer.appendChild(tag);
    } else if (state.tier === 'vip1on1') {
      const tag = document.createElement('span');
      tag.className = 'review-disc-tag';
      tag.textContent = 'Private VIP · all 5 disciplines · your whole leadership team';
      discContainer.appendChild(tag);
      const hint = $('#review-track-hint'); if (hint) hint.style.display = 'none';
    } else {
      state.specialties.forEach(slug => {
        const s = TAX && TAX.get(slug);
        const tag = document.createElement('span');
        tag.className = 'review-disc-tag';
        tag.textContent = s ? s.name : slug;
        discContainer.appendChild(tag);
      });
      // "You've completed a full track" nudge (e.g. all 3 Pitch Craft L3s)
      const hint = $('#review-track-hint');
      if (hint) {
        const tracks = completedTracks();
        if (tracks.length) {
          hint.textContent = '✓ That\'s the complete ' + tracks.join(' & ') + ' track.';
          hint.style.display = 'block';
        } else {
          hint.style.display = 'none';
        }
      }
    }

    // Account info
    $('#review-name').textContent = state.name;
    $('#review-email').textContent = state.email;
    $('#review-phone').textContent = state.phoneCode + ' ' + state.phone;

    // Schedule (cohort only)
    const schedSection = $('#review-schedule-section');
    if (state.tier === 'cohort') {
      schedSection.style.display = 'block';
      const cohortCard = $(`.cohort-card.selected`);
      if (cohortCard) {
        $('#review-cohort').textContent = $('.cohort-month', cohortCard).textContent;
        $('#review-dates').textContent = $('.cohort-range', cohortCard).textContent;
      }
    } else {
      schedSection.style.display = 'none';
    }

    // Payment — 10% non-refundable deposit reserves the booking; balance due 48h before start.
    // Deposit stays 10% of the LIST price (server-computed, matches the MoMo prompt).
    // When the founding offer is live, the 15% comes off the balance, so the TOTAL is discounted.
    const deposit = Math.round(t.price * 0.10);
    const total   = offerTotal(state.tier);     // discounted if promo live, else list
    const balance = total - deposit;
    const P = promo();
    const instNote = $('#review-instalment');
    $('#review-pay-label').textContent = 'Deposit due now (10%)';
    $('#review-amount').textContent = 'UGX ' + deposit.toLocaleString('en-UG');
    $('#btn-pay-amount').textContent = deposit.toLocaleString('en-UG');
    instNote.style.display = 'block';
    const whenTxt = (state.tier === 'cohort' ? 'cohort starts' : 'first session');
    if (P) {
      const listBalance = t.price - deposit;
      instNote.innerHTML = '<strong>Founding offer applied — 15% off</strong> (first 100 founders, 20 per coach). '
        + 'Your balance is <strong>UGX ' + balance.toLocaleString('en-UG') + '</strong> '
        + '<s style="opacity:.5">was UGX ' + listBalance.toLocaleString('en-UG') + '</s>, due in full 48 hours before your '
        + whenTxt + '. The 10% deposit is non-refundable.';
    } else {
      instNote.textContent = 'Balance of UGX ' + balance.toLocaleString('en-UG') + ' is due in full 48 hours before your '
        + whenTxt + '. The 10% deposit is non-refundable.';
    }

    // MoMo phone
    $('#momo-phone-display').textContent = state.phoneCode + ' ' + state.phone;
  }

  // MoMo provider
  $$('.momo-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      state.provider = btn.dataset.provider;
      $$('.momo-opt').forEach(b => b.classList.toggle('selected', b === btn));
    });
  });

  $('#btn-back-4').addEventListener('click', () => goToStep(3));

  $('#btn-pay').addEventListener('click', () => {
    goToStep(5);
  });

  // ── Step 5: Real checkout — register → deposit STK push → confirm ──
  const providerNames = { mtn: 'MTN MoMo', airtel: 'Airtel Money' };

  function fullPhone() { return (state.phoneCode || '') + String(state.phone || '').replace(/\s+/g, ''); }

  async function startPaymentProcessing() {
    // Show the "check your phone" state
    $('#state-processing').style.display = 'flex';
    $('#state-success').style.display = 'none';
    $('#provider-name').textContent = providerNames[state.provider] || 'Mobile Money';
    $('#processing-phone').textContent = (state.phoneCode || '') + ' ' + state.phone;
    const fill = $('#timer-fill'); if (fill) fill.style.width = '0%';
    const cancel = $('#btn-cancel-payment'); if (cancel) cancel.disabled = true;

    try {
      // 1 — Create the registration (+ founder account) server-side
      const parts = state.name.trim().split(/\s+/);
      const firstName = parts.shift() || state.name;
      const lastName  = parts.join(' ') || '—';

      let cohortId = null;
      if (state.tier === 'cohort') {
        cohortId = resolveCohortId();
        if (!cohortId) throw new Error('That cohort is no longer open — go back and choose another date.');
      }

      const regBody = {
        track: state.tier,
        firstName, lastName, email: state.email,
        phone: fullPhone(), company: state.company || null,
        enrolledSpecialties: state.specialties.slice(),
        disciplines: state.disciplines.slice(),
      };
      if (state.password) regBody.password = state.password;
      if (cohortId) regBody.cohortId = cohortId;

      const regRes = await fetch(API + '/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(regBody),
      });
      const regData = await regRes.json().catch(() => ({}));
      if (!regRes.ok) throw new Error(regData.error || 'We could not create your booking. Please try again.');
      state._registrationId = regData.registrationId;
      state._depositAmount  = regData.depositAmount;

      // 2 — Fire the deposit mobile-money prompt (STK push)
      const payRes = await fetch(API + '/api/payment-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: regData.registrationId, paymentType: 'deposit', phone: fullPhone() }),
      });
      const payData = await payRes.json().catch(() => ({}));
      if (!payRes.ok && !payData.pending) {
        // Booking exists but the prompt failed — they can still pay from the dashboard.
        return showPending(true);
      }

      // 3 — Sign the founder in (they just set a password) so we can watch their
      //     own registration flip to paid, and so "Go to dashboard" just works.
      if (!LOGGED_IN && state.password && sb) {
        try { await sb.auth.signInWithPassword({ email: state.email, password: state.password }); LOGGED_IN = true; } catch (e) {}
      }
      pollDeposit(regData.registrationId);
    } catch (e) {
      showPayError(e.message);
    }
  }

  // Poll the founder's own registration (RLS-scoped) until the deposit confirms.
  function pollDeposit(regId) {
    const fill = $('#timer-fill');
    const MAX = 36; let tries = 0;   // ~3 minutes at 5s
    if (state._payInterval) clearInterval(state._payInterval);
    state._payInterval = setInterval(async () => {
      tries++;
      if (fill) fill.style.width = Math.min(100, (tries / MAX) * 100) + '%';
      let paid = false;
      try {
        const r = await sb.from('registrations').select('deposit_paid').eq('id', regId).maybeSingle();
        paid = !!(r && r.data && r.data.deposit_paid);
      } catch (e) {}
      if (paid) { clearInterval(state._payInterval); showConfirmed(); }
      else if (tries >= MAX) { clearInterval(state._payInterval); showPending(false); }
    }, 5000);
  }

  function setSuccessCard() {
    $('#txn-id').textContent    = state._registrationId ? ('Booking #' + state._registrationId) : '—';
    $('#txn-amount').textContent = 'UGX ' + Number(state._depositAmount || Math.round(TIER_DATA[state.tier].price * 0.10)).toLocaleString('en-UG');
    $('#txn-method').textContent = providerNames[state.provider] || 'Mobile Money';
    $('#txn-email').textContent  = state.email;
    if (state.tier === 'cohort') {
      const cohortCard = $('.cohort-card.selected');
      const month = cohortCard ? $('.cohort-month', cohortCard).textContent : 'your cohort';
      $('#ns-schedule-text').textContent = `Your cohort starts ${month}. Calendar invites for all 5 weeks will arrive 48 hours before.`;
    }
    // Point the primary action at the dashboard now that they have an account.
    const act = document.querySelector('#state-success .success-actions .btn-primary');
    if (act) { act.textContent = 'Go to your dashboard'; act.setAttribute('href', LOGGED_IN ? '../../founder.html' : '../login-founder.html'); }
  }

  function showConfirmed() {
    $('#state-processing').style.display = 'none';
    $('#state-success').style.display = 'flex';
    const np = $('#nav-progress'); if (np) np.style.opacity = '0';
    const h = document.querySelector('#state-success .h-section'); if (h) h.textContent = "You're in.";
    const sub = document.querySelector('#state-success > .h-sub'); if (sub) sub.textContent = 'Deposit received. Check your email for your receipt and next steps.';
    setSuccessCard();
  }

  // Prompt sent but not yet confirmed (timed out or STK send failed).
  function showPending(sendFailed) {
    $('#state-processing').style.display = 'none';
    $('#state-success').style.display = 'flex';
    const np = $('#nav-progress'); if (np) np.style.opacity = '0';
    const h = document.querySelector('#state-success .h-section'); if (h) h.textContent = 'Almost there.';
    const sub = document.querySelector('#state-success > .h-sub');
    if (sub) sub.textContent = sendFailed
      ? 'Your booking is reserved. We couldn’t send the prompt automatically — you can pay your deposit from your dashboard.'
      : 'Your booking is reserved. Approve the prompt on your phone to confirm your deposit — we’ll email your receipt once it lands.';
    setSuccessCard();
  }

  function showPayError(msg) {
    const sub = $('#state-processing') && document.querySelector('#state-processing .h-sub');
    const h = document.querySelector('#state-processing .h-section');
    if (h) h.textContent = 'Something went wrong';
    if (sub) sub.innerHTML = (msg || 'Please try again.');
    const timer = document.querySelector('#state-processing .processing-timer'); if (timer) timer.style.display = 'none';
    const cancel = $('#btn-cancel-payment');
    if (cancel) { cancel.disabled = false; cancel.textContent = 'Back'; }
  }

  // Back / cancel — return to review
  $('#btn-cancel-payment').addEventListener('click', () => {
    if (state._payInterval) clearInterval(state._payInterval);
    // reset processing UI for a possible retry
    const h = document.querySelector('#state-processing .h-section'); if (h) h.textContent = 'Check your phone';
    const timer = document.querySelector('#state-processing .processing-timer'); if (timer) timer.style.display = '';
    const cancel = $('#btn-cancel-payment'); if (cancel) { cancel.disabled = false; cancel.textContent = 'Cancel'; }
    goToStep(4);
  });

  // ── Init ───────────────────────────────────────────────────
  (async function init() {
    loadCohorts();
    readEntryParams();
    await checkExistingSession();
    // Deep-link with a tier (e.g. a module's "Book a course") + already signed in
    // → skip the login step, go straight to choosing specialties.
    if (state.tier && LOGGED_IN) { updateStep2Badge(); goToStep(3); }
    else { goToStep(1); }
  })();
})();
