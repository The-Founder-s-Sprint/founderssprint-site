/* ============================================================
   THE FOUNDER'S SPRINT — LAUNCH PROMO (date-gated, self-contained)
   ------------------------------------------------------------
   Injects its own CSS + a dismissible banner, and rewrites any
   element tagged  data-promo-tier="single|pick3|cohort|vip1on1"
   from its list price into  struck original → 15%-off price.

   Include (mirrors site-chrome.js): before </body>
     <script src="/promo.js?v=1" defer></script>
   Banner mount (optional, for precise placement):
     <div id="fs-promo" data-promo-cta="/beta/book/?tier=single"></div>
   If no #fs-promo mount exists on the page, NO banner renders
   (price rewriting still happens) — so a page can opt into prices
   only, or banner + prices, with zero layout surprises.

   SCOPE — COACHING ONLY. Mentor fees (mentors.html, live from the
   `mentors` table) and corporate/directory sponsorship prices are
   NEVER tagged, so they are excluded by construction.

   ENFORCEMENT — this is DISPLAY + messaging. The "first 100 / 20
   per coach" cap is enforced at the payment/booking layer when
   ioTec is wired; a client-side counter can't be trusted and the
   booking engine is still a prototype. Founders honour 15% for the
   first 100 bookings; the banner communicates that.

   TIMING — nothing renders before `start` or after `end`. On
   1 Aug 2026 (EAT) the banner appears and prices discount
   automatically; after `end` it all reverts with no code change.
   ============================================================ */
(function () {
  'use strict';
  if (window.FS_PROMO) return;

  // ---- CONFIG (the only thing to touch to tune / extend / kill) ----
  var PROMO = {
    id:       'founding15',                 // dismissal key — bump to force re-show
    pct:      15,                           // discount %
    start:    '2026-08-01T00:00:00+03:00',  // EAT — booking opens; banner+prices switch ON
    end:      '2026-09-30T23:59:59+03:00',  // guard so the bar can't linger forever; set to null for no auto-expiry
    cap:      100,                          // messaging only (enforced at payment)
    perCoach: 20,                           // messaging only
    base: { single: 500000, pick3: 1000000, cohort: 2500000, vip1on1: 5000000 }
  };

  function active() {
    // QA overrides (this viewer only): ?promo=preview forces ON, ?promo=off forces OFF.
    try {
      var q = String(location.search || '');
      if (q.indexOf('promo=preview') !== -1) return true;
      if (q.indexOf('promo=off') !== -1) return false;
    } catch (e) {}
    var s = new Date(PROMO.start).getTime();
    if (isNaN(s)) return false;
    var e = PROMO.end ? new Date(PROMO.end).getTime() : Infinity;
    var now = Date.now();
    return now >= s && now <= e;
  }
  function discount(n) { n = Number(n) || 0; return Math.round(n * (100 - PROMO.pct) / 100); }

  // compact, PRECISE UGX (425K · 850K · 2.125M · 4.25M) — never rounds a
  // discount UP the way a 1-decimal formatter would (4.25M ≠ 4.3M).
  function compact(n) {
    n = Number(n) || 0;
    if (n >= 1000000) return (Math.round((n / 1000000) * 1000) / 1000) + 'M';
    if (n >= 1000)    return (n / 1000) + 'K';
    return String(n);
  }
  function full(n) { return Number(n || 0).toLocaleString('en-UG'); }

  // Public API — consumed by book.js (checkout math) and homepage.js (ladder detail).
  window.FS_PROMO = {
    active: active, discount: discount, pct: PROMO.pct, base: PROMO.base,
    cap: PROMO.cap, perCoach: PROMO.perCoach, compact: compact, full: full
  };

  if (!active()) return;   // pre-1-Aug / post-end: API exists, but nothing is injected

  // ------------------------------------------------------------
  // Styles
  // ------------------------------------------------------------
  var css = ''
    + '.fsp-bar{position:relative;display:flex;align-items:center;gap:14px;flex-wrap:wrap;'
    +   'background:#1A1A1A;color:#EFE7D8;border-top:2px solid #C8531F;'
    +   'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;'
    +   'padding:12px 20px;line-height:1.4;}'
    + '.fsp-bar .fsp-spark{color:#C9923A;font-size:14px;line-height:1;}'
    + '.fsp-bar .fsp-txt{flex:1 1 320px;font-size:13.5px;letter-spacing:.01em;}'
    + '.fsp-bar .fsp-txt strong{color:#fff;font-weight:700;}'
    + '.fsp-bar .fsp-cta{flex:0 0 auto;background:#C8531F;color:#fff;text-decoration:none;'
    +   'font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;'
    +   'padding:9px 16px;white-space:nowrap;transition:background .15s;}'
    + '.fsp-bar .fsp-cta:hover{background:#9A3E16;}'
    + '.fsp-bar .fsp-x{flex:0 0 auto;background:none;border:none;color:rgba(239,231,216,.6);'
    +   'font-size:20px;line-height:1;cursor:pointer;padding:0 2px;}'
    + '.fsp-bar .fsp-x:hover{color:#EFE7D8;}'
    + '@media(max-width:600px){.fsp-bar{padding:10px 16px;gap:10px;}'
    +   '.fsp-bar .fsp-txt{font-size:12.5px;flex-basis:100%;}'
    +   '.fsp-bar .fsp-cta{flex:1 1 auto;text-align:center;}}'
    // struck original + discounted price (used inside tagged spans)
    + '.fsp-was{opacity:.5;text-decoration:line-through;font-weight:400;font-size:.5em;'
    +   'display:block;margin-top:2px;letter-spacing:.02em;}'
    + '.fsp-now{display:inline;}'
    + '.fsp-off{display:inline-block;background:#C8531F;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;'
    +   'font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;'
    +   'padding:2px 7px;margin-left:8px;vertical-align:middle;border-radius:0 0 8px 0;}';

  function injectCSS() {
    if (document.getElementById('fsp-css')) return;
    var s = document.createElement('style');
    s.id = 'fsp-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  // ------------------------------------------------------------
  // Price rewriting — tag the price NUMBER with data-promo-tier.
  // The currency prefix (UGX) stays outside the tagged span, untouched.
  // Idempotent: marks done so re-renders don't double-strike.
  // ------------------------------------------------------------
  function renderPrices(root) {
    var els = (root || document).querySelectorAll('[data-promo-tier]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.getAttribute('data-promo-done')) continue;
      var tier = el.getAttribute('data-promo-tier');
      if (!(tier in PROMO.base)) continue;
      var fmt = el.getAttribute('data-promo-fmt') || 'compact';
      var was = fmt === 'full' ? full(PROMO.base[tier]) : compact(PROMO.base[tier]);
      var now = fmt === 'full' ? full(discount(PROMO.base[tier])) : compact(discount(PROMO.base[tier]));
      el.setAttribute('data-promo-done', '1');
      el.innerHTML = '<span class="fsp-now">' + now + '</span><s class="fsp-was">was ' + was + '</s>';
    }
  }

  // ------------------------------------------------------------
  // Banner (only into an explicit #fs-promo mount)
  // ------------------------------------------------------------
  function renderBanner() {
    var mount = document.getElementById('fs-promo');
    if (!mount || mount.getAttribute('data-promo-done')) return;
    mount.setAttribute('data-promo-done', '1');

    try {
      if (localStorage.getItem('fsp-dismiss-' + PROMO.id) === '1') return;
    } catch (e) {}

    var cta = mount.getAttribute('data-promo-cta') || '';
    var bar = document.createElement('div');
    bar.className = 'fsp-bar';
    bar.innerHTML =
        '<span class="fsp-spark" aria-hidden="true">◇</span>'
      + '<span class="fsp-txt"><strong>Founding offer &mdash; 15% off</strong> your first coaching booking. '
      +   'First 100 founders (20 per coach).</span>'
      + (cta ? '<a class="fsp-cta" href="' + cta + '">Book now &rarr;</a>' : '')
      + '<button class="fsp-x" type="button" aria-label="Dismiss offer">×</button>';
    mount.appendChild(bar);

    bar.querySelector('.fsp-x').addEventListener('click', function () {
      bar.parentNode && bar.parentNode.removeChild(bar);
      try { localStorage.setItem('fsp-dismiss-' + PROMO.id, '1'); } catch (e) {}
    });
  }

  function boot() {
    injectCSS();
    renderPrices(document);
    renderBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Expose the rewriter so JS-rendered prices (book.js review, homepage ladder)
  // can re-apply after they mutate the DOM.
  window.FS_PROMO.renderPrices = renderPrices;
})();
