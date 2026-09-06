/* =========================================================================
   The Founder's Sprint — DASHBOARD CHROME (shared left-sidebar nav)
   One source of truth for role-dashboard navigation, mirroring the public
   site's site-chrome.js. Self-contained: injects its own scoped CSS and
   themes itself from the host page's brand CSS variables, so it looks right
   on the light coach/founder portals and the dark Command Centre alike.

   The module replaces the CHROME only — the host page keeps its own panels
   and its existing switchTab(); we just call it. Presentation only: role
   gating decides what is SHOWN, RLS decides what is reachable.

   Usage:
     FSDash.init({
       role: 'Coach',                       // small label under the wordmark
       active: 'founders',                  // initially selected item key
       groups: [                            // sections → items
         { label:'Coaching', items:[
             { key:'founders', label:'My Founders' },
             { key:'sessions', label:'Sessions', badge:0, hidden:false }
         ]}
       ],
       onSelect: function(key){ switchTab(key); },
       hide: ['.tabs'],                     // page chrome to hide on ALL sizes
       hideOnMobile: ['.topbar'],           // page chrome to hide on mobile only
       user: 'teddy@founderssprint.co',
       links: [ { label:'Ops dashboard', href:'/dashboard.html' },
                { label:'Sign out', onClick: signOut } ]
     });

     FSDash.setActive(key) · FSDash.setBadge(key, n) · FSDash.setVisible(key, bool)
   ========================================================================= */
(function () {
  if (window.FSDash) return;

  var W = 244;               // desktop sidebar width
  var cfg = null, side = null, scrim = null, bar = null, injected = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function injectCSS() {
    if (injected) return; injected = true;
    var hide = (cfg.hide || []).join(',');
    var hideM = (cfg.hideOnMobile || []).join(',');
    var css = '\
.fsn-side{position:fixed;top:0;left:0;bottom:0;width:' + W + 'px;z-index:900;display:flex;flex-direction:column;\
background:var(--card,var(--paper,#F6F0E3));border-right:1px solid var(--border,rgba(26,26,26,.14));overflow-y:auto;-webkit-overflow-scrolling:touch;}\
.fsn-brand{display:flex;align-items:center;gap:10px;padding:18px 18px 14px;border-bottom:1px solid var(--border,rgba(26,26,26,.10));}\
.fsn-mark{width:26px;height:26px;flex:0 0 26px;}\
.fsn-name{font-family:var(--sans,"Josefin Sans",sans-serif);font-size:10.5px;font-weight:700;letter-spacing:.16em;\
text-transform:uppercase;color:var(--ink,#1A1A1A);line-height:1.3;}\
.fsn-role{display:block;font-size:9px;letter-spacing:.18em;color:var(--terra,#C8531F);margin-top:3px;}\
.fsn-nav{flex:1;padding:6px 0 16px;}\
.fsn-group{margin:16px 0 4px;padding:0 18px;font-family:var(--sans,"Josefin Sans",sans-serif);font-size:8.5px;\
font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--muted,#8b8578);opacity:.9;}\
.fsn-item{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;\
padding:10px 18px;border:0;border-left:3px solid transparent;background:none;cursor:pointer;\
font-family:var(--font,"Inter",system-ui,sans-serif);font-size:13.5px;line-height:1.3;color:var(--ink,#1A1A1A);}\
.fsn-item:hover{background:rgba(200,83,31,.07);}\
.fsn-item.on{background:rgba(200,83,31,.12);border-left-color:var(--terra,#C8531F);font-weight:600;}\
.fsn-badge{min-width:18px;padding:1px 6px;border-radius:9px;background:var(--terra,#C8531F);color:#fff;\
font-size:10px;font-weight:700;text-align:center;}\
.fsn-foot{border-top:1px solid var(--border,rgba(26,26,26,.10));padding:12px 18px 18px;}\
.fsn-user{font-size:11px;color:var(--muted,#8b8578);word-break:break-all;margin-bottom:8px;}\
.fsn-link{display:block;width:100%;text-align:left;background:none;border:0;padding:6px 0;cursor:pointer;\
font-family:var(--sans,"Josefin Sans",sans-serif);font-size:10px;font-weight:600;letter-spacing:.1em;\
text-transform:uppercase;color:var(--terra,#C8531F);text-decoration:none;}\
.fsn-link:hover{opacity:.75;}\
.fsn-bar{display:none;}.fsn-scrim{display:none;}\
body.fsn-on{padding-left:' + W + 'px;}\
' + (hide ? hide + '{display:none !important;}' : '') + '\
@media(max-width:900px){\
  body.fsn-on{padding-left:0;padding-top:52px;}\
  ' + (hideM ? hideM + '{display:none !important;}' : '') + '\
  .fsn-side{width:272px;transform:translateX(-100%);transition:transform .22s ease;box-shadow:0 0 44px rgba(0,0,0,.34);}\
  .fsn-side.fsn-open{transform:none;}\
  .fsn-bar{display:flex;align-items:center;gap:12px;position:fixed;top:0;left:0;right:0;height:52px;z-index:880;\
    background:var(--ink,#1A1A1A);color:var(--paper,#EFE7D8);padding:0 14px;}\
  .fsn-burger{width:34px;height:26px;border:0;background:none;cursor:pointer;display:flex;flex-direction:column;\
    justify-content:center;gap:5px;padding:0;}\
  .fsn-burger span{display:block;height:2px;background:var(--paper,#EFE7D8);border-radius:2px;}\
  .fsn-bartitle{font-family:var(--sans,"Josefin Sans",sans-serif);font-size:10.5px;font-weight:700;\
    letter-spacing:.16em;text-transform:uppercase;}\
  .fsn-scrim.fsn-open{display:block;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:890;}\
}\
@media (prefers-reduced-motion: reduce){.fsn-side{transition:none;}}';
    var s = document.createElement('style');
    s.setAttribute('data-fsn', '1');
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  var MARK = '<svg class="fsn-mark" viewBox="0 0 100 100" aria-hidden="true">' +
    '<polygon points="50,8 57,50 50,92 43,50" fill="#C8531F" opacity="0.85"/>' +
    '<polygon points="50,8 57,50 50,92 43,50" fill="#C9923A" opacity="0.8" transform="rotate(72,50,50)"/>' +
    '<polygon points="50,8 57,50 50,92 43,50" fill="#8AAB5C" opacity="0.78" transform="rotate(144,50,50)"/>' +
    '<polygon points="50,8 57,50 50,92 43,50" fill="#3D4A2E" opacity="0.82" transform="rotate(216,50,50)"/>' +
    '<polygon points="50,8 57,50 50,92 43,50" fill="#777770" opacity="0.75" transform="rotate(288,50,50)"/>' +
    '<circle cx="50" cy="50" r="4.5" fill="#EFE7D8"/><circle cx="50" cy="50" r="2" fill="#1A1A1A"/></svg>';

  function itemsHTML() {
    return (cfg.groups || []).map(function (g) {
      var items = (g.items || []).map(function (it) {
        return '<button type="button" class="fsn-item' + (it.key === cfg.active ? ' on' : '') + '" data-key="' + esc(it.key) + '"' +
          (it.hidden ? ' style="display:none"' : '') + '>' +
          '<span>' + esc(it.label) + '</span>' +
          '<span class="fsn-badge" data-badge="' + esc(it.key) + '"' + (it.badge ? '' : ' style="display:none"') + '>' + (it.badge || 0) + '</span>' +
          '</button>';
      }).join('');
      // a group whose items are all hidden still renders; setVisible re-evaluates the header
      return '<div class="fsn-groupwrap" data-group="' + esc(g.label || '') + '">' +
        (g.label ? '<div class="fsn-group">' + esc(g.label) + '</div>' : '') + items + '</div>';
    }).join('');
  }

  function footHTML() {
    var links = (cfg.links || []).map(function (l, i) {
      return l.href
        ? '<a class="fsn-link" href="' + esc(l.href) + '">' + esc(l.label) + '</a>'
        : '<button type="button" class="fsn-link" data-link="' + i + '">' + esc(l.label) + '</button>';
    }).join('');
    return (cfg.user ? '<div class="fsn-user">' + esc(cfg.user) + '</div>' : '') + links;
  }

  function syncGroupHeaders() {
    if (!side) return;
    Array.prototype.forEach.call(side.querySelectorAll('.fsn-groupwrap'), function (w) {
      var any = Array.prototype.some.call(w.querySelectorAll('.fsn-item'), function (b) { return b.style.display !== 'none'; });
      var h = w.querySelector('.fsn-group');
      if (h) h.style.display = any ? '' : 'none';
    });
  }

  function setOpen(on) {
    if (!side) return;
    side.classList.toggle('fsn-open', !!on);
    if (scrim) scrim.classList.toggle('fsn-open', !!on);
  }

  function build() {
    injectCSS();

    side = document.createElement('nav');
    side.className = 'fsn-side';
    side.setAttribute('aria-label', 'Dashboard navigation');
    side.innerHTML =
      '<div class="fsn-brand">' + MARK +
        '<div><span class="fsn-name">Founder\'s Sprint' +
        (cfg.role ? '<span class="fsn-role">' + esc(cfg.role) + '</span>' : '') + '</span></div>' +
      '</div>' +
      '<div class="fsn-nav">' + itemsHTML() + '</div>' +
      '<div class="fsn-foot">' + footHTML() + '</div>';

    scrim = document.createElement('div'); scrim.className = 'fsn-scrim';

    bar = document.createElement('div');
    bar.className = 'fsn-bar';
    bar.innerHTML = '<button type="button" class="fsn-burger" aria-label="Open menu"><span></span><span></span><span></span></button>' +
      '<span class="fsn-bartitle">' + esc(cfg.role || 'Dashboard') + '</span>';

    document.body.appendChild(scrim);
    document.body.appendChild(side);
    document.body.appendChild(bar);
    document.body.classList.add('fsn-on');

    side.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.fsn-item') : null;
      if (btn) { select(btn.getAttribute('data-key')); return; }
      var lk = e.target.closest ? e.target.closest('[data-link]') : null;
      if (lk) { var l = cfg.links[+lk.getAttribute('data-link')]; if (l && l.onClick) l.onClick(); }
    });
    bar.querySelector('.fsn-burger').addEventListener('click', function () { setOpen(!side.classList.contains('fsn-open')); });
    scrim.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });

    syncGroupHeaders();
  }

  function select(key) {
    if (!key) return;
    setActive(key);
    setOpen(false);
    if (cfg.onSelect) { try { cfg.onSelect(key); } catch (e) { console.error('[FSDash] onSelect', e); } }
  }

  function setActive(key) {
    cfg.active = key;
    if (!side) return;
    Array.prototype.forEach.call(side.querySelectorAll('.fsn-item'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-key') === key);
    });
  }

  function setBadge(key, n) {
    if (!side) return;
    var el = side.querySelector('[data-badge="' + key + '"]');
    if (!el) return;
    n = Number(n) || 0;
    el.textContent = n;
    el.style.display = n > 0 ? '' : 'none';
  }

  function setVisible(key, on) {
    if (!side) return;
    var b = side.querySelector('.fsn-item[data-key="' + key + '"]');
    if (b) b.style.display = on ? '' : 'none';
    syncGroupHeaders();
  }

  window.FSDash = {
    init: function (options) {
      cfg = options || {};
      if (document.body) build();
      else document.addEventListener('DOMContentLoaded', build);
    },
    setActive: setActive,
    setBadge: setBadge,
    setVisible: setVisible,
    open: function () { setOpen(true); },
    close: function () { setOpen(false); }
  };
})();
