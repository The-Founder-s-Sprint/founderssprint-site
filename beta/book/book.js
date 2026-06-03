/* ============================================================
   FOUNDER'S SPRINT — CHECKOUT FLOW
   Single-page multi-step booking prototype
   ============================================================ */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  const state = {
    step: 1,
    tier: null,           // 'single' | 'pick3' | 'cohort'
    disciplines: [],      // selected disc keys
    cohort: 'july-2026',
    plan: 'full',         // 'full' | '2x' | '3x'
    provider: 'mtn',      // 'mtn' | 'airtel'
    name: '',
    email: '',
    phone: '',
    phoneCode: '+256',
    company: '',
  };

  const TIER_DATA = {
    single: { name: 'One-on-One Coaching',  price: 500000,   priceLabel: 'UGX 500,000', maxDisc: 1, shortPrice: 'UGX 500K' },
    pick3:  { name: 'Pick 3 Bundle',        price: 1000000,  priceLabel: 'UGX 1,000,000', maxDisc: 3, shortPrice: 'UGX 1M' },
    cohort: { name: 'Full Cohort',          price: 2500000,  priceLabel: 'UGX 2,500,000', maxDisc: 5, shortPrice: 'UGX 2.5M' },
  };

  const DISC_NAMES = {
    marketing:  'Marketing & Branding',
    finance:    'Financial Modelling',
    investment: 'Investment Readiness',
    strategy:   'Strategy & Team',
    product:    'Product & Pricing',
  };

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
    const disc = params.get('disc');
    if (tier && TIER_DATA[tier]) {
      selectTier(tier);
    }
    if (disc) {
      // e.g. ?disc=marketing or ?disc=marketing,finance,investment
      const discs = disc.split(',').filter(d => DISC_NAMES[d]);
      if (discs.length) {
        state.disciplines = discs;
      }
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
    if (n === 3) setupStep3();
    if (n === 4) setupStep4();
    if (n === 5) startPaymentProcessing();
  }

  // ── Step 1: Tier selection ─────────────────────────────────
  function selectTier(tier) {
    state.tier = tier;
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
      // Move to step 2
      updateStep2Badge();
      goToStep(2);
    });
  });

  // Also allow clicking the card itself to proceed (double-click or if already selected)
  $$('.tier-card').forEach(card => {
    card.addEventListener('dblclick', () => {
      if (state.tier) {
        updateStep2Badge();
        goToStep(2);
      }
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
  function checkExistingSession() {
    // TODO: Replace with real Supabase check:
    // const { data: { session } } = await supabase.auth.getSession();
    // if (session) { ... }
    const proto = new URLSearchParams(window.location.search).get('session');
    if (!proto) return false;

    // Simulate a logged-in user (prototype)
    const userData = {
      name: 'Sarah Nakamya',
      email: 'sarah@example.com',
      phone: '7XX XXX XXX',
      phoneCode: '+256',
    };

    state.name = userData.name;
    state.email = userData.email;
    state.phone = userData.phone;
    state.phoneCode = userData.phoneCode;

    // Show session card, hide forms
    $('#auth-toggle').style.display = 'none';
    $('#form-create').style.display = 'none';
    $('#form-login').style.display = 'none';
    $('#session-active').style.display = 'block';

    // Populate
    const initials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
    $('#session-avatar').textContent = initials;
    $('#session-name').textContent = userData.name;
    $('#session-email').textContent = userData.email;
    $('#session-first-name').textContent = userData.name.split(' ')[0];

    // Update header
    $('#step2-title').textContent = 'Welcome back';
    $('#step2-sub').textContent = "You're already signed in. Continue to configure your coaching sessions.";

    return true;
  }

  // Continue as logged-in user
  const btnContinue = $('#btn-continue-session');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => goToStep(3));
  }

  // Switch account
  const btnSwitch = $('#btn-switch-account');
  if (btnSwitch) {
    btnSwitch.addEventListener('click', () => {
      // TODO: Phase 2 — supabase.auth.signOut()
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
      $('#config-sub').textContent = 'Select a cohort start date. All 5 disciplines are included.';
      state.disciplines = ['marketing', 'finance', 'investment', 'strategy', 'product'];
      updateStep3Button();
    } else {
      discPanel.style.display = 'block';
      cohortPanel.style.display = 'none';
      const max = TIER_DATA[tier].maxDisc;
      $('#disc-max').textContent = max;
      if (tier === 'single') {
        $('#config-title').textContent = 'Choose your discipline';
        $('#config-sub').textContent = 'Which area do you need expert coaching on?';
      } else {
        $('#config-title').textContent = 'Choose your 3 disciplines';
        $('#config-sub').textContent = 'Select the 3 coaching disciplines you want to focus on.';
      }
      renderDiscSelection();
    }
  }

  function renderDiscSelection() {
    const max = TIER_DATA[state.tier].maxDisc;
    $$('.disc-card').forEach(card => {
      const d = card.dataset.disc;
      const sel = state.disciplines.includes(d);
      card.classList.toggle('selected', sel);
      // Disable if at max and not selected
      card.classList.toggle('disabled', !sel && state.disciplines.length >= max);
    });
    $('#disc-count').textContent = state.disciplines.length;
    updateStep3Button();
  }

  $$('.disc-card').forEach(card => {
    card.addEventListener('click', () => {
      const d = card.dataset.disc;
      const max = TIER_DATA[state.tier].maxDisc;
      const idx = state.disciplines.indexOf(d);

      if (idx >= 0) {
        state.disciplines.splice(idx, 1);
      } else if (state.disciplines.length < max) {
        state.disciplines.push(d);
      }
      renderDiscSelection();
    });
  });

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
      const max = TIER_DATA[state.tier].maxDisc;
      btn.disabled = state.disciplines.length < max;
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

    // Disciplines
    const discContainer = $('#review-disciplines');
    discContainer.innerHTML = '';
    state.disciplines.forEach(d => {
      const tag = document.createElement('span');
      tag.className = 'review-disc-tag';
      tag.textContent = DISC_NAMES[d];
      discContainer.appendChild(tag);
    });

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
  readEntryParams();
  const hasSession = checkExistingSession();
  if (state.tier) {
    // If tier was pre-selected via URL, we can still show step 1
    // with the tier highlighted
  }
  goToStep(1);
})();
