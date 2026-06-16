/* ============================================================
   The Founder's Sprint — universal site chrome (nav + footer)
   ------------------------------------------------------------
   ONE source of truth for the public marketing nav & footer.
   Drop into any page:
       <div id="fs-nav"></div>      (optional — else injected at <body> top)
       ...page...
       <div id="fs-footer"></div>   (optional — else appended to <body>)
       <script src="/site-chrome.js?v=2" defer></script>

   Self-contained: injects its own CSS + fonts, needs nothing from the page.
   Nav styling mirrors the homepage (Josefin wordmark + JetBrains Mono
   uppercase links, centered via a 1fr/auto/1fr grid).
   All links ABSOLUTE behind BASE — the marketing site lives under /beta/;
   change BASE once when it moves to root. Mentors/cookies live at root.
   ============================================================ */
(function () {
  var BASE = '/beta';
  var H = BASE + '/index.html';

  var L = {
    home: H, method: H + '#method', coaches: H + '#coaches', mentors: '/mentors.html',
    explore: BASE + '/explore/', pricing: H + '#pricing', directory: BASE + '/directory.html',
    applyDir: BASE + '/apply-directory.html', faq: H + '#faq', contact: BASE + '/contact.html',
    terms: BASE + '/terms.html', privacy: BASE + '/privacy.html', cookies: '/cookies.html',
    login: BASE + '/login/', book: BASE + '/book/'
  };

  // The five discipline breakdowns under "Method" (the pedagogical pages).
  var METHOD = [
    ['Marketing & Branding', BASE + '/method/marketing.html'],
    ['Financial Modelling', BASE + '/method/finance.html'],
    ['Investment Readiness', BASE + '/method/investment.html'],
    ['Strategy & Team Building', BASE + '/method/strategy.html'],
    ['Product Dev & Pricing', BASE + '/method/product.html']
  ];

  var MARK = '<svg viewBox="0 0 100 100" width="26" height="26" aria-hidden="true">'
    + '<polygon points="50,8 57,50 50,92 43,50" fill="#c8531f" opacity="0.85"></polygon>'
    + '<polygon points="50,8 57,50 50,92 43,50" fill="#c9923a" opacity="0.80" transform="rotate(72 50 50)"></polygon>'
    + '<polygon points="50,8 57,50 50,92 43,50" fill="#8aab5c" opacity="0.78" transform="rotate(144 50 50)"></polygon>'
    + '<polygon points="50,8 57,50 50,92 43,50" fill="#3d4a2e" opacity="0.82" transform="rotate(216 50 50)"></polygon>'
    + '<polygon points="50,8 57,50 50,92 43,50" fill="#777770" opacity="0.75" transform="rotate(288 50 50)"></polygon>'
    + '<circle cx="50" cy="50" r="4.5" fill="#efe7d8"></circle><circle cx="50" cy="50" r="2" fill="#1a1a1a"></circle></svg>';

  var NAV =
    '<nav class="fsx-nav" id="fsx-nav">'
    + '<a class="fsx-brand" href="' + L.home + '">' + MARK + '<span class="fsx-wm">The Founder\'s Sprint</span></a>'
    + '<button class="fsx-burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>'
    + '<div class="fsx-drawer">'
    +   '<div class="fsx-links">'
    +     '<div class="fsx-dd">'
    +       '<a href="' + L.method + '" class="fsx-dd-top">Method</a>'
    +       '<div class="fsx-dd-menu">'
    +         METHOD.map(function (m) { return '<a href="' + m[1] + '">' + m[0] + '</a>'; }).join('')
    +       '</div>'
    +     '</div>'
    +     '<a href="' + L.coaches + '">Coaches</a>'
    +     '<a href="' + L.mentors + '">Mentors</a>'
    +     '<a href="' + L.explore + '">Explore</a>'
    +     '<a href="' + L.pricing + '">Pricing</a>'
    +     '<a href="' + L.directory + '">Directory</a>'
    +     '<a href="' + L.faq + '">FAQ</a>'
    +   '</div>'
    +   '<div class="fsx-cta">'
    +     '<a class="fsx-ghost" href="' + L.login + '">Log in</a>'
    +     '<a class="fsx-pill" href="' + L.book + '">Book a Session</a>'
    +   '</div>'
    + '</div>'
    + '</nav>';

  function col(title, items) {
    return '<div class="fsx-col"><h6>' + title + '</h6><ul>'
      + items.map(function (i) { return '<li><a href="' + i[1] + '">' + i[0] + '</a></li>'; }).join('')
      + '</ul></div>';
  }

  var FOOT_BG =
    '<div class="fsx-foot-bg" aria-hidden="true"><svg viewBox="0 0 1600 400" preserveAspectRatio="xMidYMid slice" style="opacity:.45">'
    + '<line x1="120" y1="60" x2="320" y2="160" stroke="#c8531f" stroke-width="0.6" opacity="0.45"/>'
    + '<line x1="320" y1="160" x2="520" y2="100" stroke="#c9923a" stroke-width="0.5" opacity="0.4"/>'
    + '<line x1="520" y1="100" x2="720" y2="200" stroke="#8aab5c" stroke-width="0.5" opacity="0.35"/>'
    + '<line x1="720" y1="200" x2="920" y2="120" stroke="#3d4a2e" stroke-width="0.5" opacity="0.4"/>'
    + '<line x1="920" y1="120" x2="1120" y2="240" stroke="#777770" stroke-width="0.5" opacity="0.35"/>'
    + '<line x1="1120" y1="240" x2="1360" y2="150" stroke="#c8531f" stroke-width="0.5" opacity="0.4"/>'
    + '<line x1="1360" y1="150" x2="1520" y2="220" stroke="#c9923a" stroke-width="0.5" opacity="0.35"/>'
    + '<line x1="200" y1="280" x2="400" y2="340" stroke="#c8531f" stroke-width="0.4" opacity="0.3"/>'
    + '<line x1="400" y1="340" x2="640" y2="280" stroke="#8aab5c" stroke-width="0.4" opacity="0.3"/>'
    + '<line x1="640" y1="280" x2="880" y2="340" stroke="#c9923a" stroke-width="0.4" opacity="0.3"/>'
    + '<line x1="880" y1="340" x2="1100" y2="310" stroke="#3d4a2e" stroke-width="0.4" opacity="0.3"/>'
    + '<line x1="1100" y1="310" x2="1400" y2="350" stroke="#777770" stroke-width="0.4" opacity="0.25"/>'
    + '<line x1="320" y1="160" x2="400" y2="340" stroke="#c9923a" stroke-width="0.3" opacity="0.2"/>'
    + '<line x1="720" y1="200" x2="640" y2="280" stroke="#8aab5c" stroke-width="0.3" opacity="0.2"/>'
    + '<line x1="1120" y1="240" x2="1100" y2="310" stroke="#777770" stroke-width="0.3" opacity="0.2"/>'
    + '<circle cx="120" cy="60" r="3" fill="#c8531f" opacity="0.65"/><circle cx="120" cy="60" r="7" fill="#c8531f" opacity="0.12"/>'
    + '<circle cx="320" cy="160" r="3.5" fill="#c9923a" opacity="0.6"/><circle cx="320" cy="160" r="8" fill="#c9923a" opacity="0.10"/>'
    + '<circle cx="520" cy="100" r="2.5" fill="#8aab5c" opacity="0.55"/><circle cx="520" cy="100" r="6" fill="#8aab5c" opacity="0.10"/>'
    + '<circle cx="720" cy="200" r="4" fill="#3d4a2e" opacity="0.55"/><circle cx="720" cy="200" r="9" fill="#3d4a2e" opacity="0.10"/>'
    + '<circle cx="920" cy="120" r="2.5" fill="#777770" opacity="0.5"/><circle cx="920" cy="120" r="6" fill="#777770" opacity="0.08"/>'
    + '<circle cx="1120" cy="240" r="3" fill="#c8531f" opacity="0.55"/><circle cx="1120" cy="240" r="7" fill="#c8531f" opacity="0.10"/>'
    + '<circle cx="1360" cy="150" r="3.5" fill="#c9923a" opacity="0.6"/><circle cx="1360" cy="150" r="8" fill="#c9923a" opacity="0.10"/>'
    + '<circle cx="1520" cy="220" r="2" fill="#8aab5c" opacity="0.5"/>'
    + '<circle cx="200" cy="280" r="2" fill="#c8531f" opacity="0.45"/>'
    + '<circle cx="400" cy="340" r="2.5" fill="#8aab5c" opacity="0.45"/><circle cx="400" cy="340" r="5" fill="#8aab5c" opacity="0.08"/>'
    + '<circle cx="640" cy="280" r="2" fill="#c9923a" opacity="0.4"/>'
    + '<circle cx="880" cy="340" r="3" fill="#3d4a2e" opacity="0.45"/><circle cx="880" cy="340" r="6" fill="#3d4a2e" opacity="0.08"/>'
    + '<circle cx="1100" cy="310" r="2" fill="#777770" opacity="0.4"/>'
    + '<circle cx="1400" cy="350" r="1.5" fill="#c8531f" opacity="0.35"/>'
    + '<circle cx="60" cy="180" r="1" fill="#efe7d8" opacity="0.15"/><circle cx="260" cy="40" r="1" fill="#efe7d8" opacity="0.12"/>'
    + '<circle cx="600" cy="380" r="1" fill="#efe7d8" opacity="0.10"/><circle cx="1000" cy="50" r="1" fill="#efe7d8" opacity="0.12"/>'
    + '<circle cx="1240" cy="340" r="1" fill="#efe7d8" opacity="0.10"/><circle cx="1480" cy="80" r="1" fill="#efe7d8" opacity="0.10"/>'
    + '<circle cx="800" cy="40" r="1" fill="#efe7d8" opacity="0.08"/><circle cx="160" cy="360" r="1" fill="#efe7d8" opacity="0.08"/>'
    + '</svg></div>';

  var FOOT =
    '<footer class="fsx-foot">' + FOOT_BG
    + '<div class="fsx-foot-row">'
    +   '<div class="fsx-col fsx-brandcol">'
    +     '<a href="' + L.home + '" class="fsx-brand" style="margin-bottom:14px">' + MARK
    +       '<span class="fsx-wm">The Founder\'s Sprint</span></a>'
    +     '<p class="fsx-blurb">Learn from practitioners who leverage their experience for your growth. Five coaches. Five disciplines.</p>'
    +     '<div class="fsx-social">'
    +       '<a href="https://www.linkedin.com/company/121984533/" target="_blank" rel="noopener" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>'
    +       '<a href="https://www.instagram.com/founderssprint" target="_blank" rel="noopener" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>'
    +     '</div>'
    +   '</div>'
    +   col('Programme', [['Method', L.method], ['Coaches', L.coaches], ['Explore', L.explore], ['Pricing', L.pricing]])
    +   col('For Institutions', [['VIP 1-on-1', L.pricing], ['Mentors', L.mentors], ['Custom programmes', L.pricing], ['Partner with us', L.contact]])
    +   col('Resources', [['Service Directory', L.directory], ['Become a Provider', L.applyDir]])
    +   col('Company', [['FAQ', L.faq], ['Contact', L.contact], ['Terms of Service', L.terms], ['Privacy Policy', L.privacy], ['Cookie Notice', L.cookies]])
    + '</div>'
    + '<div class="fsx-bottom"><span>© 2026 · The Founder\'s Sprint · Kampala</span><span>Made in Uganda</span></div>'
    + '</footer>';

  var CSS =
    // ---- NAV (mirrors homepage: Josefin wordmark + JetBrains Mono uppercase links, centered) ----
    ".fsx-nav{position:sticky;top:0;z-index:1000;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:32px;padding:20px 48px;background:#1A1A1A;}"
    + ".fsx-brand{display:flex;align-items:center;gap:12px;text-decoration:none;justify-self:start;}"
    + ".fsx-brand svg{width:26px;height:26px;animation:fsx-spin 64s linear infinite;}"
    + ".fsx-wm{font-family:'Josefin Sans',system-ui,sans-serif;font-weight:700;font-size:12px;letter-spacing:.30em;text-transform:uppercase;color:#EFE7D8;white-space:nowrap;}"
    + ".fsx-drawer{display:contents;}"
    + ".fsx-links{justify-self:center;display:flex;align-items:center;gap:34px;}"
    + ".fsx-links>a{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.20em;text-transform:uppercase;color:rgba(239,231,216,.55);text-decoration:none;transition:color .2s;white-space:nowrap;}"
    + ".fsx-links>a:hover{color:#EFE7D8;}"
    // ---- Method dropdown ----
    + ".fsx-dd{position:relative;display:flex;align-items:center;}"
    + ".fsx-dd-top{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.20em;text-transform:uppercase;color:rgba(239,231,216,.55);text-decoration:none;transition:color .2s;white-space:nowrap;cursor:pointer;}"
    + ".fsx-dd:hover .fsx-dd-top,.fsx-dd:focus-within .fsx-dd-top{color:#EFE7D8;}"
    + ".fsx-dd-menu{position:absolute;top:calc(100% + 16px);left:50%;transform:translateX(-50%);min-width:236px;background:#161616;border:1px solid #2c2c2c;padding:8px 0;display:none;flex-direction:column;box-shadow:0 24px 50px -20px rgba(0,0,0,.7);}"
    + ".fsx-dd-menu::before{content:'';position:absolute;left:0;right:0;top:-16px;height:16px;}"
    + ".fsx-dd:hover .fsx-dd-menu,.fsx-dd:focus-within .fsx-dd-menu{display:flex;}"
    + ".fsx-dd-menu a{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.1em;color:rgba(239,231,216,.7);text-decoration:none;padding:10px 20px;white-space:nowrap;transition:color .15s,background .15s;}"
    + ".fsx-dd-menu a:hover{color:#EFE7D8;background:rgba(239,231,216,.05);}"
    + ".fsx-cta{justify-self:end;display:flex;align-items:center;gap:16px;}"
    + ".fsx-ghost{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(239,231,216,.6);text-decoration:none;white-space:nowrap;}"
    + ".fsx-ghost:hover{color:#EFE7D8;}"
    + ".fsx-pill{font-family:'Josefin Sans',system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:.20em;text-transform:uppercase;padding:10px 18px;background:#C8531F;color:#EFE7D8;text-decoration:none;white-space:nowrap;transition:filter .18s,transform .18s;}"
    + ".fsx-pill:hover{filter:brightness(1.1);transform:translateY(-1px);}"
    + ".fsx-burger{display:none;justify-self:end;flex-direction:column;gap:4px;background:none;border:none;cursor:pointer;padding:6px;}"
    + ".fsx-burger span{display:block;width:22px;height:2px;background:#EFE7D8;}"
    + ".fsx-nav.fsx-fixed{position:fixed;left:0;right:0;}"  // opt-in via data-fixed on #fs-nav (pages whose hero already clears an overlapping nav, e.g. the homepage)
    + "@keyframes fsx-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}"
    // ---- FOOTER (matches homepage: deep ink + constellation background) ----
    + ".fsx-foot{position:relative;overflow:hidden;background:#08070a;color:rgba(239,231,216,.55);font-family:'Inter',system-ui,sans-serif;padding:54px 48px 32px;border-top:1px solid rgba(239,231,216,.10);}"
    + ".fsx-foot-bg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 500px 300px at 10% 50%,rgba(200,83,31,.18),transparent 65%),radial-gradient(ellipse 400px 250px at 50% 20%,rgba(201,146,58,.12),transparent 65%),radial-gradient(ellipse 450px 280px at 90% 60%,rgba(138,171,92,.10),transparent 65%),radial-gradient(ellipse 350px 220px at 30% 85%,rgba(61,74,46,.14),transparent 65%);}"
    + ".fsx-foot-bg svg{position:absolute;inset:0;width:100%;height:100%;}"
    + ".fsx-foot-row{position:relative;z-index:1;max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;gap:30px;}"
    + ".fsx-brandcol .fsx-wm{font-size:13px;}"
    + ".fsx-blurb{font-size:12.5px;line-height:1.6;color:rgba(239,231,216,.55);max-width:38ch;margin:6px 0 14px;}"
    + ".fsx-social{display:flex;gap:14px;}.fsx-social a{color:rgba(239,231,216,.4);transition:color .15s;}.fsx-social a:hover{color:#EFE7D8;}"
    + ".fsx-col h6{font-family:'Josefin Sans',system-ui,sans-serif;font-weight:700;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:rgba(239,231,216,.42);margin-bottom:13px;}"
    + ".fsx-col ul{list-style:none;padding:0;margin:0;}.fsx-col li{margin-bottom:9px;}"
    + ".fsx-col a{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;color:rgba(239,231,216,.65);text-decoration:none;transition:color .15s;}.fsx-col a:hover{color:#EFE7D8;}"
    + ".fsx-bottom{position:relative;z-index:1;max-width:1080px;margin:44px auto 0;padding-top:22px;border-top:1px solid rgba(239,231,216,.10);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(239,231,216,.35);}"
    // ---- HERO shell (standard page hero — apply class 'fsx-hero' to a <section>) ----
    + ".fsx-hero{position:relative;padding:150px 0 80px;background:#0f0d0a;color:#EFE7D8;overflow:hidden;}"
    + ".fsx-hero .hero-constellation{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 500px 300px at 10% 50%,rgba(200,83,31,.18),transparent 65%),radial-gradient(ellipse 400px 250px at 50% 20%,rgba(201,146,58,.12),transparent 65%),radial-gradient(ellipse 450px 280px at 90% 60%,rgba(138,171,92,.10),transparent 65%),radial-gradient(ellipse 350px 220px at 30% 85%,rgba(61,74,46,.14),transparent 65%),radial-gradient(ellipse 300px 200px at 70% 40%,rgba(200,83,31,.06),transparent 70%);}"
    + ".fsx-hero .hero-constellation svg{position:absolute;inset:0;width:100%;height:100%;}"
    + ".fsx-hero .shell{position:relative;z-index:1;}"  /* width comes from each page's own .shell (1440 marketing / 1120 mentors) so the hero aligns with that page's sections */
    + ".fsx-hero .v6-mark{display:inline-block;width:10px;height:10px;vertical-align:middle;flex-shrink:0;}"
    + ".fsx-hero .eyebrow{font-family:'Josefin Sans',system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;display:inline-flex;align-items:center;gap:8px;color:#C8531F;margin-bottom:26px;}"
    + ".fsx-hero .section-eb{background:none;padding:0;color:#C8531F;}.fsx-hero .section-eb .v6-mark{width:10px;height:10px;}"
    + ".fsx-hero .h-section{font-family:'Josefin Sans',system-ui,sans-serif;font-weight:300;font-size:clamp(34px,4.6vw,60px);line-height:1.05;letter-spacing:-.032em;margin-bottom:18px;color:#EFE7D8;text-wrap:balance;}"
    + ".fsx-hero .h-section em{font-style:normal;font-weight:400;color:#C8531F;}"
    + ".fsx-hero .h-sub{font-family:'Inter',system-ui,sans-serif;font-size:16px;line-height:1.55;max-width:54ch;color:rgba(239,231,216,.62);}"
    + ".fsx-hero .hero-rule{width:80px;height:1px;margin:28px 0;background:linear-gradient(90deg,#C8531F,transparent);}"
    + ".fsx-hero .tag{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;color:#C8531F;opacity:.85;}"
    + ".fsx-hero .cta-row{margin-top:28px;}"
    // ---- mobile ----
    + "@media(max-width:880px){"
    +   ".fsx-hero{padding:118px 0 60px;}"
    +   ".fsx-nav{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;position:sticky;}"
    +   ".fsx-burger{display:flex;}"
    +   ".fsx-drawer{display:none;position:absolute;top:100%;left:0;right:0;background:#1A1A1A;flex-direction:column;align-items:flex-start;gap:0;padding:8px 24px 18px;border-top:1px solid rgba(239,231,216,.1);}"
    +   ".fsx-nav.fsx-open .fsx-drawer{display:flex;}"
    +   ".fsx-links{justify-self:auto;flex-direction:column;align-items:flex-start;gap:0;width:100%;}"
    +   ".fsx-links>a{padding:11px 0;width:100%;font-size:12px;}"
    +   ".fsx-dd{display:block;width:100%;}"
    +   ".fsx-dd-top{display:block;padding:11px 0;font-size:12px;}"
    +   ".fsx-dd-menu{position:static;transform:none;display:flex;min-width:0;border:none;box-shadow:none;background:none;padding:0 0 8px 14px;}"
    +   ".fsx-dd-menu::before{display:none;}"
    +   ".fsx-dd-menu a{padding:8px 0;font-size:11px;}"
    +   ".fsx-cta{justify-self:auto;width:100%;gap:14px;margin-top:10px;}"
    +   ".fsx-foot-row{grid-template-columns:1fr 1fr;gap:24px;}.fsx-brandcol{grid-column:1/-1;}"
    + "}"
    + "@media(max-width:480px){.fsx-foot-row{grid-template-columns:1fr;}}";

  function injectFonts() {
    if (document.getElementById('fsx-fonts')) return;
    var l = document.createElement('link'); l.id = 'fsx-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Josefin+Sans:wght@400;600;700&display=swap';
    document.head.appendChild(l);
  }

  function inject() {
    injectFonts();
    if (!document.getElementById('fsx-style')) {
      var st = document.createElement('style'); st.id = 'fsx-style'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    var navHost = document.getElementById('fs-nav'), navFixed = navHost && navHost.hasAttribute('data-fixed');
    if (navHost) { navHost.innerHTML = NAV; }
    else { var d = document.createElement('div'); d.innerHTML = NAV; document.body.insertBefore(d.firstChild, document.body.firstChild); }
    if (navFixed) { var nvx = document.getElementById('fsx-nav'); if (nvx) nvx.classList.add('fsx-fixed'); }

    var footHost = document.getElementById('fs-footer');
    if (footHost) { footHost.innerHTML = FOOT; }
    else { var d2 = document.createElement('div'); d2.innerHTML = FOOT; document.body.appendChild(d2.firstChild); }

    var nav = document.getElementById('fsx-nav'), burger = nav && nav.querySelector('.fsx-burger');
    if (burger) burger.addEventListener('click', function () {
      var open = nav.classList.toggle('fsx-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
