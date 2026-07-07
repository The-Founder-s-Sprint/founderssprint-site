/* ============================================================
   method-fan.js — the fan-out module constellation for the Method pages.
   Replaces the old rotating orbit. Drop a mount anywhere:
       <div class="fanlet" data-nodes="Positioning|Messaging|Visual Identity"
            data-color="#C8531F"></div>
   Each specialty fans out from a V6 hub; the fan opens (links draw, nodes
   pop, staggered) when it scrolls into view, then rests. Reduced-motion safe.
   ============================================================ */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var CSS =
    /* dark constellation panel so the glowing nodes + cream labels read (the page bg is paper) */
    '.fanlet{position:relative;margin:14px auto 0;padding:18px 16px 20px;border-radius:0 0 24px 0;overflow:hidden;' +
      'background:radial-gradient(ellipse 130% 105% at 50% 42%,#1f1c17 0%,#12100b 60%,#0d0b08 100%);' +
      'border:1px solid rgba(239,231,216,0.10);box-shadow:0 18px 40px -22px rgba(0,0,0,0.6);}' +
    '.fanlet svg.fan{width:100%;height:auto;display:block;overflow:visible;position:relative;z-index:1;}' +
    '.fan-links line{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .85s cubic-bezier(.4,.9,.3,1);}' +
    '.fan.fanned .fan-links line{stroke-dashoffset:0;}' +
    '.fan-node{opacity:0;transform:translateY(8px) scale(.5);transform-box:fill-box;transform-origin:center;' +
      'transition:opacity .55s ease var(--d,0s),transform .6s cubic-bezier(.34,1.25,.5,1) var(--d,0s);}' +
    '.fan.fanned .fan-node{opacity:1;transform:translateY(0) scale(1);}' +
    '@media (prefers-reduced-motion: reduce){' +
      '.fan-links line{stroke-dashoffset:0;transition:none;}' +
      '.fan-node{opacity:1;transform:none;transition:none;}}';

  function inject() {
    if (document.getElementById('fanlet-css')) return;
    var s = document.createElement('style'); s.id = 'fanlet-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function v6(color, cx, cy, scale) {
    var g = mk('g', { transform: 'translate(' + cx + ' ' + cy + ') scale(' + scale + ')' });
    for (var i = 0; i < 5; i++) mk('polygon', { points: '0,-9 3.4,0 0,9 -3.4,0', fill: color, opacity: 0.85, transform: 'rotate(' + (i * 72) + ')' }, g);
    mk('circle', { r: 2.6, fill: '#efe7d8' }, g);
    mk('circle', { r: 1.1, fill: '#15110a' }, g);
    return g;
  }

  function build(host) {
    if (host.__fan) return;
    var labels = (host.getAttribute('data-nodes') || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!labels.length) return;
    host.__fan = true;
    var color = host.getAttribute('data-color') || '#C8531F';
    var W = 300, H = 212, hubX = 150, hubY = 186, R = 122;
    var fid = 'fanblur-' + Math.random().toString(36).slice(2, 7);

    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'fan', 'aria-hidden': 'true' });
    var defs = mk('defs', {}, svg);
    var f = mk('filter', { id: fid, x: '-80%', y: '-80%', width: '260%', height: '260%' }, defs);
    mk('feGaussianBlur', { stdDeviation: 4 }, f);

    // faint scatter stars
    var stars = mk('g', { fill: color, opacity: 0.22 }, svg);
    [[36, 40], [268, 48], [22, 150], [282, 122], [150, 24], [96, 18], [212, 22], [40, 96]].forEach(function (p) { mk('circle', { cx: p[0], cy: p[1], r: 1.1 }, stars); });

    // links (hub → each node; drawn on fan-open)
    var gl = mk('g', { 'class': 'fan-links', stroke: color, 'stroke-width': 1, fill: 'none', opacity: 0.5 }, svg);
    var gn = mk('g', { 'class': 'fan-nodes' }, svg);

    var n = labels.length;
    var spread = Math.min(60, (n - 1) * 24);   // half-angle of the fan
    labels.forEach(function (lab, i) {
      var deg = -90 + (n === 1 ? 0 : (-spread + (2 * spread) * (i / (n - 1))));
      var a = deg * Math.PI / 180;
      var x = +(hubX + R * Math.cos(a)).toFixed(1);
      var y = +(hubY + R * Math.sin(a)).toFixed(1);
      mk('line', { x1: hubX, y1: hubY, x2: x, y2: y, pathLength: 1 }, gl);

      var g = mk('g', { 'class': 'fan-node', style: '--d:' + (0.12 + i * 0.09).toFixed(2) + 's' }, gn);
      mk('circle', { cx: x, cy: y, r: 11, fill: color, opacity: 0.16, filter: 'url(#' + fid + ')' }, g);
      mk('circle', { cx: x, cy: y, r: 7, fill: '#15110a', stroke: color, 'stroke-width': 1.6 }, g);
      mk('circle', { cx: x, cy: y, r: 2.6, fill: color }, g);
      mk('circle', { cx: x - 2, cy: y - 2.5, r: 1.4, fill: '#EFE7D8', opacity: 0.5 }, g);
      var t = mk('text', { x: x, y: y - 15, 'text-anchor': 'middle', 'font-family': "'Josefin Sans',sans-serif", 'font-weight': 600, 'font-size': 9, 'letter-spacing': 0.4, fill: '#efe7d8', opacity: 0.85 }, g);
      t.textContent = lab.toUpperCase();
    });

    svg.appendChild(v6(color, hubX, hubY, 1.2));
    host.appendChild(svg);
  }

  function boot() {
    inject();
    var hosts = [].slice.call(document.querySelectorAll('.fanlet'));
    if (!hosts.length) return;
    hosts.forEach(build);
    if (!('IntersectionObserver' in window)) {
      hosts.forEach(function (h) { var s = h.querySelector('svg.fan'); if (s) s.classList.add('fanned'); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { var s = e.target.querySelector('svg.fan'); if (s) s.classList.add('fanned'); io.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    hosts.forEach(function (h) { io.observe(h); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
