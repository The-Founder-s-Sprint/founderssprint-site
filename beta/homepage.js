/* ============================================================
   FOUNDER'S SPRINT — HOMEPAGE INTERACTIONS
   1. Hero: random B&W video + canvas grain + animated constellation
   2. Nav scroll state + smooth scroll
   3. Section reveal (IntersectionObserver)
   4. Pricing: Bundle Builder, Matrix, Value Ladder
   5. Countdown timer
   6. FAQ accordion
   7. Quotes carousel
   ============================================================ */
(() => {
  'use strict';

  // ------------------------------------------------------------
  // Reload lands on the hero (the fresh per-visit video), not the
  // browser's restored scroll position — users reported manual reloads
  // dumping them in the pricing section. Anchor deep-links (#method,
  // #pricing, …) still work because we only force the top when the URL
  // has no hash.
  // ------------------------------------------------------------
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!window.location.hash) {
    window.scrollTo(0, 0);
    window.addEventListener('load', () => { if (!window.location.hash) window.scrollTo(0, 0); });
  }

  // ============================================================
  // 0. CONSTANTS
  // ============================================================
  const COHORT_START = new Date('2026-09-01T10:00:00+03:00');
  const TIER_RULES = {
    1: { eb: 'One-on-One Coaching', name: '1 × 2-hr session',   price: 500000,  full: '500K',  dur: '2 hours',  save: 0 },
    2: { eb: 'Single + Add-on',    name: '2 × 2-hr sessions',  price: 1000000, full: '1M',    dur: '4 hours',  save: 0,  hint: 'Same as Pick 3' },
    3: { eb: 'Pick 3 Bundle',      name: '3 × 2-hr sessions',  price: 1000000, full: '1M',    dur: '6 hours',  save: 33, popular: true },
    4: { eb: 'Almost Full',        name: '4 × 2-hr sessions',  price: 1900000, full: '1.9M',  dur: '8 hours',  save: 24 },
    5: { eb: 'Full Cohort',        name: '5 weeks · 50 hours', price: 2500000, full: '2.5M',  dur: '5 weeks',  save: 0 }
  };
  const LADDER_TIERS = [
    { eb: 'One-on-One',    name: 'One-on-One Coaching', desc: '"I have one specific problem and I need expert eyes on it."',
      bullets: ['1 coach · 1 discipline · 1 vetted deliverable', '1 × 2-hour live session', 'Recording + notes within 48 hours'],
      price: 'UGX 500K', sub: '1 × 2-hour session', cta: 'Map your problem →', color: 'stone' },
    { eb: 'Pick 3 Bundle', name: 'Pick 3 Bundle',       desc: '"I know my 3 biggest gaps — save 33% on 3 × 2-hour sessions."',
      bullets: ['3 coaches · 3 disciplines · 3 deliverables', '3 × 2-hour live sessions · save 33%', 'Cover your 3 biggest problems', 'Alumni network invite'],
      price: 'UGX 1M', sub: '3 × 2-hour sessions · save 33%', cta: 'Build my bundle →', color: 'ochre' },
    { eb: 'Full Cohort',   name: 'The Full Sprint',     desc: '"All 5 disciplines. 5 weeks. 50 hours of group coaching."',
      bullets: ['All 5 disciplines, in the order they build', '5 weeks · 50 hours of group coaching', 'Complete founder data room', '30-day post-programme advisory'],
      price: 'UGX 2.5M', sub: '5 weeks · 50 hours', cta: 'Join cohort →', color: 'terra' }
  ];

  // ============================================================
  // 1. HERO — Video randomiser + grain + constellation
  // ============================================================
  // ---- 1a. Video randomiser: pick one clip per visit ----
  // Clip list lives in JS — avoids 13 <video> elements in the DOM
  // which browsers probe even with preload="none" (13 HTTP requests).
  const HERO_CLIPS = [
    'assets/hero.mp4',   'assets/hero-1.mp4',  'assets/hero-2.mp4',
    'assets/hero-3.mp4', 'assets/hero-4.mp4',  'assets/hero-5.mp4',
    'assets/hero-6.mp4', 'assets/hero-7.mp4',  'assets/hero-8.mp4',
    'assets/hero-9.mp4', 'assets/hero-10.mp4', 'assets/hero-11.mp4',
    'assets/hero-12.mp4'
  ];
  const heroVideo = document.getElementById('hero-vid');
  if (heroVideo) {
    const clipSrc = HERO_CLIPS[Math.floor(Math.random() * HERO_CLIPS.length)];
    heroVideo.src = clipSrc;
    heroVideo.preload = 'auto';
    heroVideo.load();
  }

  function startHeroVideo() {
    if (!heroVideo) return;
    heroVideo.muted = true;
    function tryPlay() {
      const p = heroVideo.play();
      if (p && p.then) p.then(() => heroVideo.classList.add('playing'));
      if (p && p.catch) p.catch(() => {});
    }
    if (heroVideo.readyState >= 2) {
      tryPlay();
    } else {
      heroVideo.addEventListener('loadeddata', tryPlay, { once: true });
    }
    heroVideo.addEventListener('error', (e) => { e.stopPropagation(); }, { once: true });
  }

  // ---- 1b. Canvas grain: real random pixel noise at 12fps ----
  const grainCanvas = document.getElementById('hero-grain-canvas');
  if (grainCanvas) {
    const gc = grainCanvas.getContext('2d');
    let GW, GH;
    function resizeGrain() {
      GW = Math.ceil(window.innerWidth  / 2);
      GH = Math.ceil(window.innerHeight / 2);
      grainCanvas.width  = GW;
      grainCanvas.height = GH;
    }
    resizeGrain();
    window.addEventListener('resize', resizeGrain);
    function updateGrain() {
      const img = gc.createImageData(GW, GH);
      const d   = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i+1] = d[i+2] = v;
        d[i+3] = 255;
      }
      gc.putImageData(img, 0, 0);
    }
    updateGrain();
    setInterval(updateGrain, 1000 / 12);
  }

  // ---- 1c. Animated constellation canvas (no V6 mark) ----
  const constellationCanvas = document.getElementById('hero-constellation');
  if (constellationCanvas) {
    const cCtx = constellationCanvas.getContext('2d');
    const COLS  = ['#C8531F', '#C9923A', '#8AAB5C', '#3D4A2E', '#777770'];
    const OPS   = [ 0.85,      0.80,      0.78,      0.82,      0.75    ];
    const NAMES = [
      'MARKETING', 'FINANCIAL\nMODELLING', 'INVESTMENT\nREADINESS',
      'STRATEGY\n& TEAM', 'PRODUCT\nDEV',
    ];
    const PAPER_C = '#EFE7D8';
    const TILT    = 0.38;

    let cW, cH, cCX, cCY;
    function resizeConstellation() {
      const dpr  = Math.min(window.devicePixelRatio || 1, 2);
      const rect = constellationCanvas.getBoundingClientRect();
      cW = rect.width;
      cH = rect.height;
      constellationCanvas.width  = cW * dpr;
      constellationCanvas.height = cH * dpr;
      cCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cCX = cW / 2;
      cCY = cH * 0.33;
    }
    resizeConstellation();
    window.addEventListener('resize', resizeConstellation);

    const C_NODES = COLS.map((_, i) => ({
      baseAngle:   (i * 72 - 90) * Math.PI / 180,
      angVel:      0.000165 + i * 0.000012,
      wobbleAmp:   9 + i * 3.5,
      wobbleFreq:  0.00028 + i * 0.000075,
      wobblePhase: i * 1.31,
    }));

    function cNodePos(node, t, baseR) {
      const angle = node.baseAngle + node.angVel * t;
      const r     = baseR + Math.sin(node.wobbleFreq * t + node.wobblePhase) * node.wobbleAmp;
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r * TILT };
    }

    function cHexAlpha(hex, a) {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${a})`;
    }

    function drawPulses(cx, cy, markR, t, ga) {
      const PERIOD = 3200;
      for (let p = 0; p < 3; p++) {
        const phase = ((t / PERIOD) + p / 3) % 1;
        const pr    = markR + phase * markR * 2.8;
        const pa    = (1 - phase) * 0.18 * ga;
        cCtx.beginPath();
        cCtx.arc(cx, cy, pr, 0, Math.PI * 2);
        cCtx.strokeStyle = `rgba(200,83,31,${pa})`;
        cCtx.lineWidth   = 1;
        cCtx.stroke();
      }
    }

    function drawLabel(text, x, y, color, ga) {
      const lines = text.split('\n');
      cCtx.font         = `700 9px 'Josefin Sans', sans-serif`;
      cCtx.textAlign    = 'center';
      cCtx.textBaseline = 'middle';
      cCtx.fillStyle    = color;
      cCtx.globalAlpha  = ga * 0.65;
      const lh  = 13;
      const top = y - ((lines.length - 1) * lh) / 2;
      lines.forEach((line, i) => cCtx.fillText(line, x, top + i * lh));
      cCtx.globalAlpha = 1;
    }

    let cStart = null;
    function drawConstellation(ts) {
      if (!cStart) cStart = ts;
      const t  = ts - cStart;
      const ga = Math.min(1, t / 1800);

      cCtx.clearRect(0, 0, cW, cH);

      const isMobile = cW < 500;
      const isNarrow = cW < 380;
      const base     = Math.min(cW, cH);
      const orbitalR = base * (isNarrow ? 0.32 : isMobile ? 0.38 : 0.48);
      const markR    = base * (isMobile ? 0.127 : 0.12);
      const nodeR    = isMobile ? 7.5 : 9.5;
      const showLabels = cW > 420;

      cCtx.save();
      cCtx.globalAlpha = ga;

      const pos = C_NODES.map(n => cNodePos(n, t, orbitalR));

      // Radial lines from centre to each node
      pos.forEach((p, i) => {
        const nx = cCX + p.x, ny = cCY + p.y;
        const g  = cCtx.createLinearGradient(cCX, cCY, nx, ny);
        g.addColorStop(0,    cHexAlpha(COLS[i], 0.0));
        g.addColorStop(0.25, cHexAlpha(COLS[i], 0.08));
        g.addColorStop(1,    cHexAlpha(COLS[i], 0.28));
        cCtx.beginPath();
        cCtx.moveTo(cCX, cCY);
        cCtx.lineTo(nx, ny);
        cCtx.strokeStyle = g;
        cCtx.lineWidth   = 0.7;
        cCtx.stroke();
      });

      // Inter-node connection lines
      for (let i = 0; i < 5; i++) {
        const j  = (i + 1) % 5;
        const ax = cCX + pos[i].x, ay = cCY + pos[i].y;
        const bx = cCX + pos[j].x, by = cCY + pos[j].y;
        cCtx.beginPath();
        cCtx.moveTo(ax, ay);
        cCtx.lineTo(bx, by);
        cCtx.strokeStyle = 'rgba(239,231,216,0.05)';
        cCtx.lineWidth   = 0.5;
        cCtx.stroke();
      }

      // Pulse rings around centre
      cCtx.globalAlpha = 1;
      drawPulses(cCX, cCY, markR, t, ga);
      cCtx.globalAlpha = ga;

      // Discipline nodes
      pos.forEach((p, i) => {
        const nx = cCX + p.x, ny = cCY + p.y;
        const glow = cCtx.createRadialGradient(nx, ny, 0, nx, ny, nodeR * 4);
        glow.addColorStop(0, cHexAlpha(COLS[i], 0.38));
        glow.addColorStop(1, cHexAlpha(COLS[i], 0.00));
        cCtx.beginPath();
        cCtx.arc(nx, ny, nodeR * 4, 0, Math.PI * 2);
        cCtx.fillStyle   = glow;
        cCtx.globalAlpha = ga;
        cCtx.fill();

        cCtx.beginPath();
        cCtx.arc(nx, ny, nodeR, 0, Math.PI * 2);
        cCtx.fillStyle   = COLS[i];
        cCtx.globalAlpha = ga * OPS[i];
        cCtx.fill();
        cCtx.globalAlpha = ga;

        if (showLabels) {
          const labelDist = nodeR + (isMobile ? 16 : 22);
          const ang = Math.atan2(p.y, p.x);
          const lx  = nx + Math.cos(ang) * labelDist;
          const ly  = ny + Math.sin(ang) * labelDist;
          drawLabel(NAMES[i], lx, ly, COLS[i], ga);
        }
      });

      // No V6 mark in centre — homepage version uses pulse rings only

      cCtx.restore();
      requestAnimationFrame(drawConstellation);
    }
    requestAnimationFrame(drawConstellation);
  }

  // Boot the hero — start video immediately
  startHeroVideo();

  // ============================================================
  // 2. NAV SCROLL STATE + smooth scroll
  // ============================================================
  const nav = document.getElementById('nav');  // null now — nav is the shared site-chrome module, which manages its own appearance
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // ============================================================
  // 3. SECTION REVEALS
  // ============================================================

  // ---- 3a. Stats — progressive reveal per stat ----
  const statsGrid = document.getElementById('stats-grid');
  if (statsGrid && 'IntersectionObserver' in window) {
    const sIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          statsGrid.classList.add('in-view');
          sIO.disconnect();
        }
      });
    }, { threshold: 0.15 });
    sIO.observe(statsGrid);
  } else if (statsGrid) {
    statsGrid.classList.add('in-view');
  }

  // ---- 3b. Coaches — staggered card reveal ----
  const coachesSection = document.querySelector('.coaches');
  if (coachesSection && 'IntersectionObserver' in window) {
    const cIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          coachesSection.classList.add('in-view');
          cIO.disconnect();
        }
      });
    }, { threshold: 0.12 });
    cIO.observe(coachesSection);
  } else if (coachesSection) {
    coachesSection.classList.add('in-view');
  }

  // ---- 3c. Method timeline bar fill on scroll ----
  const timeline = document.getElementById('method-timeline');
  if (timeline && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          timeline.classList.add('in-view');
          io.disconnect();
        }
      });
    }, { threshold: 0.2 });
    io.observe(timeline);
  } else if (timeline) {
    timeline.classList.add('in-view');
  }

  // ---- 3d. DELIVERABLES — Data room fade-in + checkmark on scroll ----
  const delivSection = document.querySelector('.deliv');
  const delivGrid    = document.querySelector('.deliv .deliv-grid');
  if (delivGrid && 'IntersectionObserver' in window) {
    const dIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          delivSection.classList.add('in-view');
          dIO.disconnect();
        }
      });
    }, { threshold: 0.25 });
    dIO.observe(delivGrid);
  } else if (delivSection) {
    delivSection.classList.add('in-view');
  }

  // ---- 3e. PRICING — scroll-reveal for matrix, premium cards, pay strip ----
  const pricingSection = document.querySelector('.pricing');
  if (pricingSection && 'IntersectionObserver' in window) {
    const pIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          pricingSection.classList.add('in-view');
          pIO.disconnect();
        }
      });
    }, { threshold: 0.1 });
    pIO.observe(pricingSection);
  } else if (pricingSection) {
    pricingSection.classList.add('in-view');
  }

  // ============================================================
  // 4. PRICING — Three interactive variants
  // ============================================================

  // ---- 4.A Bundle Builder ----
  const bbItems = document.querySelectorAll('.bb-d');
  const bbCount = document.getElementById('bb-count');
  const bbReceipt = document.getElementById('bb-receipt');
  const bbTierEb = document.getElementById('bb-tier-eb');
  const bbTierName = document.getElementById('bb-tier-name');
  const bbPrice = document.getElementById('bb-price');
  const bbSave = document.getElementById('bb-save');
  const bbDCount = document.getElementById('bb-d-count');
  const bbCCount = document.getElementById('bb-c-count');
  const bbDlCount = document.getElementById('bb-dl-count');
  const bbDur = document.getElementById('bb-dur');
  const bbCta = document.getElementById('bb-cta');
  const bbClear = document.getElementById('bb-clear');

  function fmtUGX(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
    if (n >= 1000) return (n / 1000) + 'K';
    return String(n);
  }

  function updateBundle() {
    const selected = Array.from(bbItems).filter(i => i.classList.contains('on'));
    const n = selected.length;
    bbCount.textContent = String(n);

    if (n === 0) {
      bbTierEb.textContent = 'Pick to begin';
      bbTierName.textContent = 'Your bundle';
      bbPrice.textContent = '—';
      bbSave.classList.remove('show');
      bbReceipt.classList.remove('popular');
      bbDCount.textContent = '0';
      bbCCount.textContent = '0';
      bbDlCount.textContent = '0';
      bbDur.textContent = '—';
      bbCta.disabled = true;
      bbCta.textContent = 'Choose a discipline →';
      return;
    }

    const rule = TIER_RULES[n];
    bbTierEb.textContent = rule.eb;
    bbTierName.textContent = rule.name;
    bbPrice.textContent = fmtUGX(rule.price);
    bbDCount.textContent = String(n);
    bbCCount.textContent = String(n);
    bbDlCount.textContent = String(n);
    bbDur.textContent = rule.dur;
    if (rule.save > 0) {
      bbSave.textContent = 'save ' + rule.save + '%';
      bbSave.classList.add('show');
    } else {
      bbSave.classList.remove('show');
    }
    if (rule.popular) {
      bbReceipt.classList.add('popular');
    } else {
      bbReceipt.classList.remove('popular');
    }
    bbCta.disabled = false;
    if (n === 5) bbCta.textContent = 'Join Full Cohort →';
    else if (n === 3) bbCta.textContent = 'Get my Pick 3 Bundle →';
    else if (n === 1) bbCta.textContent = 'Map your problem →';
    else bbCta.textContent = 'Confirm bundle →';
  }

  bbItems.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('on');
      updateBundle();
    });
  });
  if (bbClear) bbClear.addEventListener('click', () => {
    bbItems.forEach(i => i.classList.remove('on'));
    updateBundle();
  });
  document.querySelectorAll('.bb-picker .preset button').forEach(b => {
    b.addEventListener('click', () => {
      const want = parseInt(b.dataset.preset, 10);
      // turn all off then turn on first N
      bbItems.forEach((i, idx) => {
        if (idx < want) i.classList.add('on');
        else i.classList.remove('on');
      });
      updateBundle();
    });
  });
  updateBundle();

  // Bundle CTA → booking page with tier + disciplines
  if (bbCta) bbCta.addEventListener('click', () => {
    const selected = Array.from(bbItems).filter(i => i.classList.contains('on'));
    const n = selected.length;
    if (n === 0) return;
    const discs = selected.map(i => i.dataset.d).join(',');
    let tier = 'single';
    if (n >= 5) tier = 'cohort';
    else if (n >= 3) tier = 'pick3';
    window.location.href = 'book/?tier=' + tier + '&disc=' + discs;
  });

  // ---- 4.B Matrix — hover row/col sync ----
  const matrixBody = document.getElementById('matrix-body');
  const tierCols = document.querySelectorAll('.matrix .tier-col');
  if (matrixBody) {
    const tiers = ['single', 'pick3', 'cohort'];
    // Highlight column on tier-col hover
    tierCols.forEach((col, ci) => {
      col.addEventListener('mouseenter', () => {
        document.querySelectorAll('.matrix .tier-col').forEach((c, i) => c.classList.toggle('hl', i === ci));
        document.querySelectorAll('.matrix tbody tr').forEach(tr => {
          [...tr.children].forEach((td, i) => {
            // i=0 is row label, then 1..3 are tiers
            td.classList.toggle('hl', i - 1 === ci);
          });
        });
      });
      col.addEventListener('mouseleave', () => {
        document.querySelectorAll('.matrix .tier-col, .matrix tbody td').forEach(el => el.classList.remove('hl'));
      });
    });
  }

  // ---- 4.C Value Ladder ----
  const ladderNodes = document.querySelectorAll('.ladder .node');
  const ladderProgress = document.getElementById('ladder-progress');
  const ldName = document.getElementById('ld-name');
  const ldDesc = document.getElementById('ld-desc');
  const ldBullets = document.getElementById('ld-bullets');
  const ldPrice = document.getElementById('ld-price');
  const ldSub = document.getElementById('ld-sub');
  const ldCta = document.getElementById('ld-cta');
  const ldDetail = document.getElementById('ladder-detail');

  function setLadderStep(step) {
    // mark reached/active
    ladderNodes.forEach((n, i) => {
      n.classList.toggle('reached', i <= step);
      n.classList.toggle('active', i === step);
    });
    // progress bar: 0% at step 0, 100% at step 4. Stops at the active ball.
    const pct = (step / (ladderNodes.length - 1)) * 100;
    if (ladderProgress) ladderProgress.style.width = pct + '%';

    const tier = LADDER_TIERS[step];
    if (!tier) return;
    ldName.textContent = tier.name;
    ldDesc.textContent = tier.desc;
    ldBullets.innerHTML = tier.bullets.map(b => `<li>${b}</li>`).join('');
    // Price formatting — keep UGX prefix
    if (tier.price === 'Quote') {
      ldPrice.innerHTML = 'Quote';
    } else {
      const num = tier.price.replace('UGX ', '');
      // Launch promo (date-gated via /promo.js): show struck list price → 15%-off.
      const P = window.FS_PROMO;
      const pkey = { 'One-on-One': 'single', 'Pick 3 Bundle': 'pick3', 'Full Cohort': 'cohort' }[tier.eb];
      if (P && P.active && P.active() && pkey && P.base[pkey] != null) {
        ldPrice.innerHTML = `<span class="ccy">UGX</span><span class="fsp-now">${P.compact(P.discount(P.base[pkey]))}</span><s class="fsp-was">was ${num}</s>`;
      } else {
        ldPrice.innerHTML = `<span class="ccy">UGX</span>${num}`;
      }
    }
    ldSub.textContent = tier.sub;
    ldCta.textContent = tier.cta;
    const tierMap = { 'One-on-One': 'single', 'Pick 3 Bundle': 'pick3', 'Full Cohort': 'cohort' };
    ldCta.href = tier.eb === 'Custom' ? '/contact' : 'book/?tier=' + (tierMap[tier.eb] || 'single');
    // Theme accent
    ldDetail.className = 'ladder-detail c-' + tier.color;
  }
  ladderNodes.forEach((n, i) => {
    n.addEventListener('click', () => setLadderStep(i));
    n.addEventListener('mouseenter', () => setLadderStep(i));
  });
  setLadderStep(2); // default to Full Cohort (the recommended middle)

  // ============================================================
  // 5. FAQ ACCORDION
  // ============================================================
  document.querySelectorAll('.faq .item').forEach(it => {
    const btn = it.querySelector('.q');
    btn.addEventListener('click', () => {
      // close siblings (single-open behavior)
      document.querySelectorAll('.faq .item').forEach(other => {
        if (other !== it) other.classList.remove('open');
      });
      it.classList.toggle('open');
    });
  });

  // ============================================================
  // 7. SOCIAL PROOF — Testimonial wall (APPROVED submissions from the DB)
  //    Floating quote bubbles drift left→centre; a randomiser highlights one.
  // ============================================================
  (function(){
    var SB_URL='https://ivedeivyotwevjxvcuoe.supabase.co';
    var SB_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZWRlaXZ5b3R3ZXZqeHZjdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk1OTIsImV4cCI6MjA5MDc3NTU5Mn0.qMqjTMDRcvuuSy0yXLPH-yZpWFZdUv63enAsEWxzsss';
    var PHOTO_BASE=SB_URL+'/storage/v1/object/public/testimonial-photos/';
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var field=document.getElementById('tw-field');
    if(!field) return; // §5 not present on this page
    function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
    function photo(p){ if(!p) return null; return /^https?:\/\//.test(p)?p:PHOTO_BASE+encodeURIComponent(p); }
    function initials(n){ var a=String(n||'?').trim().split(/\s+/); return ((a[0]||'?')[0]+(a.length>1?a[a.length-1][0]:'')).toUpperCase(); }
    function excerpt(t,n){ t=String(t||'').replace(/\s+/g,' ').trim(); return t.length>n? t.slice(0,n-1).replace(/[\s,;:]+\S*$/,'')+'…':t; }
    function avatarHTML(q){ var p=photo(q.photo_path); return p?'<img class="tw-av" src="'+esc(p)+'" alt="" loading="lazy">':'<div class="tw-ini">'+esc(initials(q.name))+'</div>'; }
    function meta(q){ return [q.role_title,q.company].filter(Boolean).map(esc).join(' · '); }
    var Q=[], qi=0;
    function nextQ(){ var q=Q[qi%Q.length]; qi++; return q; }
    // Prefer the same-origin /db proxy (no CORS preflight); fall back to direct Supabase.
    function twFetch(path,o){ return fetch('/db'+path,o).then(function(r){ var ct=r.headers.get('content-type')||''; if(r.ok&&ct.indexOf('json')!==-1) return r; throw 0; }).catch(function(){ return fetch(SB_URL+path,o); }); }
    twFetch('/rest/v1/testimonial_submissions?status=eq.approved&select=name,role_title,company,for_target,testimonial,photo_path&order=created_at.desc&limit=60',{headers:{apikey:SB_ANON,Authorization:'Bearer '+SB_ANON}})
      .then(function(r){ return r.ok?r.json():[]; }).catch(function(){ return []; })
      .then(function(rows){
        Q=rows||[];
        for(var i=Q.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=Q[i]; Q[i]=Q[j]; Q[j]=t; }
        if(!Q.length){ renderEmpty(); return; }
        buildField(); buildMobile(); startHighlight();
      });
    function renderEmpty(){ var s=document.getElementById('tw-stage'); if(s) s.innerHTML='<div class="tw-empty">Founders’ stories are coming soon. <a href="/share-testimonial.html">Share yours →</a></div>'; }
    function fillBubble(el){ var q=nextQ(); el.querySelector('.tw-inner').innerHTML='<div class="tw-row">'+avatarHTML(q)+'<div><div class="tw-nm">'+esc(q.name)+'</div>'+(meta(q)?'<div class="tw-ro">'+meta(q)+'</div>':'')+'</div></div><div class="tw-qt">“'+esc(excerpt(q.testimonial,150))+'”</div>'; }
    function buildField(){ field.innerHTML=''; var count=Math.min(6,Math.max(3,Q.length)); for(var i=0;i<count;i++){ var el=document.createElement('div'); el.className='tw-bubble'; el.innerHTML='<div class="tw-inner"></div>'; el.style.top=(6+i*(80/count)+Math.random()*6)+'%'; fillBubble(el); if(reduce){ el.style.animation='none'; el.style.left=(4+(i%2)*40+Math.random()*8)+'%'; el.style.opacity='1'; if(i>3) el.style.display='none'; } else { var dur=17+Math.random()*9; el.style.animationDuration=dur+'s'; el.style.animationDelay=(-Math.random()*dur)+'s'; el.querySelector('.tw-inner').style.animationDelay=(-Math.random()*6)+'s'; el.addEventListener('animationiteration',(function(b){return function(){ b.style.top=(5+Math.random()*82)+'%'; fillBubble(b); };})(el)); } field.appendChild(el); } }
    function buildMobile(){ var host=document.getElementById('tw-mlist'); if(!host) return; host.innerHTML=Q.slice(0,4).map(function(q){ return '<div class="tw-mcard"><div class="tw-row">'+avatarHTML(q)+'<div><div class="tw-nm">'+esc(q.name)+'</div>'+(meta(q)?'<div class="tw-ro">'+meta(q)+'</div>':'')+'</div></div><div class="tw-qt">“'+esc(excerpt(q.testimonial,220))+'”</div></div>'; }).join(''); }
    function highlightHTML(q){ return '<div class="tw-quote">“'+esc(excerpt(q.testimonial,240))+'”</div><div class="tw-attrib">'+avatarHTML(q)+'<div><div class="tw-nm">'+esc(q.name)+'</div>'+(meta(q)?'<div class="tw-ro">'+meta(q)+'</div>':'')+'</div></div>'; }
    function startHighlight(){ var el=document.getElementById('tw-hl'), dotsEl=document.getElementById('tw-dots'); var N=Math.min(Q.length,6); dotsEl.innerHTML=Array.apply(null,{length:N}).map(function(){return '<i></i>';}).join(''); var dots=[].slice.call(dotsEl.children); var hi=Math.floor(Math.random()*Q.length); function paint(){ var q=Q[hi%Q.length]; el.style.opacity='0'; setTimeout(function(){ el.innerHTML=highlightHTML(q); el.style.opacity='1'; }, reduce?0:420); dots.forEach(function(d,i){ d.classList.toggle('on', i===(hi%N)); }); } paint(); if(!reduce && Q.length>1){ setInterval(function(){ hi++; paint(); }, 6500); } }
  })();

  // ============================================================
  // 8. PRICING VARIANT — show matrix by default
  // ============================================================
  const stages = {
    bundle: document.getElementById('stage-bundle'),
    matrix: document.getElementById('stage-matrix'),
    ladder: document.getElementById('stage-ladder')
  };
  Object.keys(stages).forEach(k => {
    if (stages[k]) stages[k].classList.toggle('active', k === 'matrix');
  });

})();
