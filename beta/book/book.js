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

  // ── State ──────────────────────────────────────────────────
  const state = {
    step: 1,
    tier: null,           // 'single' | 'pick3' | 'cohort'
    specialties: [],      // selected L3 slugs — the atomic bookable unit
    disciplines: [],      // derived: distinct parent disciplines of the selected L3s
    cohort: 'july-2026',
    plan: 'full',         // 'full' | '2x' | '3x'
    provider: 'mtn',      // 'mtn' | 'airtel'
    name: '',
    email: '',
    phone: '',
    phoneCode: '+256',
    company: '',
  };

  // Single source of truth for the L1/L2/L3 taxonomy (see ../taxonomy.js).
  const TAX = window.FS_TAXONOMY;
  const ALL_SPECS = TAX ? TAX.specialties.map(function (s) { return s.slug; }) : [];

  // `max` = number of L3 specialties this tier includes.
  // single = 1 · pick3 = 3 · cohort = every L3 (the whole programme).
  const TIER_DATA = {
    single: { name: 'One-on-One Coaching',  price: 500000,   priceLabel: 'UGX 500,000',   max: 1,               shortPrice: 'UGX 500K' },
    pick3:  { name: 'Pick 3 Bundle',        price: 1000000,  priceLabel: 'UGX 1,000,000', max: 3,               shortPrice: 'UGX 1M' },
    cohort: { name: 'Full Cohort',          price: 2500000,  priceLabel: 'UGX 2,500,000', max: ALL_SPECS.length, shortPrice: 'UGX 2.5M' },
  };

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
    $('#badge-tier-price').textContent = t.shortPrice;
    // Also update login form badge
    const loginName = $('#badge-tier-name-login');
    const loginPrice = $('#badge-tier-price-login');
    if (loginName) loginName.textContent = t.name;
    if (loginPrice) loginPrice.textContent = t.shortPrice;
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
        $('#step2-sub').textContent = "We'll send a magic link to your email. No password needed — just tap the link to verify.";
      } else {
        $('#step2-title').textContent = 'Welcome back';
        $('#step2-sub').textContent = "Enter your email and we'll send a magic link to sign you in.";
      }
    });
  });

  // Change tier buttons (both forms)
  $('#btn-change-tier').addEventListener('click', () => goToStep(1));
  const changeTierLogin = $('#btn-change-tier-login');
  if (changeTierLogin) changeTierLogin.addEventListener('click', () => goToStep(1));

  // Create account form submission
  $('#auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.name = $('#f-name').value.trim();
    state.email = $('#f-email').value.trim();
    state.phone = $('#f-phone').value.trim();
    state.phoneCode = $('#f-phone-code').value;
    state.company = $('#f-company').value.trim();

    if (!state.name || !state.email || !state.phone) return;

    // Show magic link sent
    $('#form-create').style.display = 'none';
    $('#form-login').style.display = 'none';
    $('#auth-toggle').style.display = 'none';
    $('#magic-sent').style.display = 'block';
    $('#sent-email').textContent = state.email;
  });

  // Login form submission
  const loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#l-email').value.trim();
      if (!email) return;
      state.email = email;

      // Show magic link sent
      $('#form-create').style.display = 'none';
      $('#form-login').style.display = 'none';
      $('#auth-toggle').style.display = 'none';
      $('#magic-sent').style.display = 'block';
      $('#sent-email').textContent = state.email;
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

  // Skip verification (prototype)
  $('#btn-skip-verify').addEventListener('click', () => {
    // If login mode, we need name/phone — use placeholder data for prototype
    if (authMode === 'login' && !state.name) {
      state.name = 'Returning User';
      state.phone = state.phone || '7XX XXX XXX';
      state.phoneCode = state.phoneCode || '+256';
    }
    goToStep(3);
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
      $('#step2-sub').textContent = "Enter your email and we'll send a magic link to sign you in.";
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

    if (tier === 'cohort') {
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
    if (state.tier === 'cohort') {
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

    // Tier
    $('.review-tier-name').textContent = t.name;
    $('.review-tier-price').textContent = t.shortPrice;

    // Specialties (the bookable L3 units)
    const discContainer = $('#review-disciplines');
    discContainer.innerHTML = '';
    if (state.tier === 'cohort') {
      const tag = document.createElement('span');
      tag.className = 'review-disc-tag';
      tag.textContent = 'All ' + ALL_SPECS.length + ' specialties · 5 disciplines';
      discContainer.appendChild(tag);
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

    // Payment — 10% non-refundable deposit reserves the booking; balance due 48h before start
    const deposit = Math.round(t.price * 0.10);
    const balance = t.price - deposit;
    const instNote = $('#review-instalment');
    $('#review-pay-label').textContent = 'Deposit due now (10%)';
    $('#review-amount').textContent = 'UGX ' + deposit.toLocaleString('en-UG');
    $('#btn-pay-amount').textContent = deposit.toLocaleString('en-UG');
    instNote.style.display = 'block';
    instNote.textContent = 'Balance of UGX ' + balance.toLocaleString('en-UG') + ' is due in full 48 hours before your '
      + (state.tier === 'cohort' ? 'cohort starts' : 'first session') + '. The 10% deposit is non-refundable.';

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

  // ── Step 5: Payment processing + confirmation ──────────────
  function startPaymentProcessing() {
    // Show processing, hide success
    $('#state-processing').style.display = 'flex';
    $('#state-success').style.display = 'none';
    $('#proto-payment-skip').style.display = 'flex';

    const providerNames = { mtn: 'MTN MoMo', airtel: 'Airtel Money' };
    $('#provider-name').textContent = providerNames[state.provider];
    $('#processing-phone').textContent = state.phoneCode + ' ' + state.phone;

    // Animate timer bar
    const fill = $('#timer-fill');
    fill.style.width = '0%';
    // Prototype: auto-complete after 5 seconds
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      fill.style.width = (elapsed / 5000 * 100) + '%';
      if (elapsed >= 5000) {
        clearInterval(interval);
        showSuccess();
      }
    }, 100);

    // Store interval for cancel
    state._payInterval = interval;
  }

  function showSuccess() {
    $('#state-processing').style.display = 'none';
    $('#proto-payment-skip').style.display = 'none';
    $('#state-success').style.display = 'flex';

    // Hide nav progress on success
    $('#nav-progress').style.opacity = '0';

    const t = TIER_DATA[state.tier];
    const payNow = Math.round(t.price * 0.10);  // 10% deposit

    // Generate mock transaction ID
    const now = new Date();
    const txnId = 'FS-' + now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '-' +
      String(Math.floor(Math.random() * 9000) + 1000);

    $('#txn-id').textContent = txnId;
    $('#txn-amount').textContent = 'UGX ' + payNow.toLocaleString('en-UG');
    $('#txn-method').textContent = state.provider === 'mtn' ? 'MTN MoMo' : 'Airtel Money';
    $('#txn-email').textContent = state.email;

    // Schedule text
    if (state.tier === 'cohort') {
      const cohortCard = $(`.cohort-card.selected`);
      const month = cohortCard ? $('.cohort-month', cohortCard).textContent : 'your cohort';
      $('#ns-schedule-text').textContent = `Your cohort starts ${month}. Calendar invites for all 5 weeks will arrive 48 hours before.`;
    }
  }

  // Cancel payment
  $('#btn-cancel-payment').addEventListener('click', () => {
    if (state._payInterval) clearInterval(state._payInterval);
    goToStep(4);
  });

  // Skip payment (prototype)
  $('#btn-skip-payment').addEventListener('click', () => {
    if (state._payInterval) clearInterval(state._payInterval);
    showSuccess();
  });

  // ── Init ───────────────────────────────────────────────────
  (async function init() {
    readEntryParams();
    await checkExistingSession();
    // Deep-link with a tier (e.g. a module's "Book a course") + already signed in
    // → skip the login step, go straight to choosing specialties.
    if (state.tier && LOGGED_IN) { updateStep2Badge(); goToStep(3); }
    else { goToStep(1); }
  })();
})();
