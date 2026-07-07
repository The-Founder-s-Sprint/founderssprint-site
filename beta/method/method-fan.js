/* ============================================================
   method-fan.js — the fan-out module constellation for the Method pages.
   Mirrors the EXACT node/link/label language of the live explorer
   (beta/explore/constellation.js) — L2 hub (halo + dot), L3 specialties
   (halo + star), disc-colour link paths — with two adjustments for the
   paper page: no atmospheric background, and dark labels. Opacities are
   raised from the dark-field values so the terracotta reads on paper.

   Mount:  <div class="fanlet" data-hub="Go-to-Market"
                data-nodes="Market Entry|Channel Mix|Launch Sequencing"
                data-color="#C8531F"></div>
   The fan opens (links draw, nodes pop, staggered) on scroll-in, then rests.
   ============================================================ */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var CSS =
    '.fanlet{position:relative;margin:14px auto 0;}' +
    '.fanlet svg.fan{width:100%;height:auto;display:block;overflow:visible;}' +
    '.fan-links path{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .85s cubic-bezier(.4,.9,.3,1);}' +
    '.fan.fanned .fan-links path{stroke-dashoffset:0;}' +
    '.fan-node{opacity:0;transform:translateX(-5px) scale(.6);transform-box:fill-box;transform-origin:center;' +
      'transition:opacity .5s ease var(--d,0s),transform .58s cubic-bezier(.34,1.25,.5,1) var(--d,0s);}' +
    '.fan.fanned .fan-node{opacity:1;transform:none;}' +
    '@media (prefers-reduced-motion: reduce){' +
      '.fan-links path{stroke-dashoffset:0;transition:none;}' +
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

  function build(host) {
    if (host.__fan) return;
    var labels = (host.getAttribute('data-nodes') || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!labels.length) return;
    host.__fan = true;
    var color = host.getAttribute('data-color') || '#C8531F';
    var hubName = (host.getAttribute('data-hub') || '').trim();
    var INK = '#2a2824';          // dark label on paper
    var INK_HUB = '#1a1a1a';

    // hub anchored left, specialties fan out to the right (as in the reference)
    var W = 360, H = 176, hubX = 46, hubY = 88, R = 116;
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'fan', 'aria-hidden': 'true' });
    var gl = mk('g', { 'class': 'fan-links' }, svg);
    var gn = mk('g', { 'class': 'fan-nodes' }, svg);

    var n = labels.length;
    var spread = Math.min(32, (n - 1) * 15);   // half-angle of the fan, degrees
    labels.forEach(function (lab, i) {
      var deg = (n === 1 ? 0 : (-spread + (2 * spread) * (i / (n - 1))));
      var a = deg * Math.PI / 180;
      var x = +(hubX + R * Math.cos(a)).toFixed(1);
      var y = +(hubY + R * Math.sin(a)).toFixed(1);

      // link — a gently bowed path (mirrors the explorer's link paths), opacity raised for paper
      var mx = (hubX + x) / 2, my = (hubY + y) / 2 - 5;
      mk('path', { d: 'M' + hubX + ',' + hubY + ' Q' + mx.toFixed(1) + ',' + my.toFixed(1) + ' ' + x + ',' + y, stroke: color, 'stroke-width': 1, opacity: 0.5, fill: 'none', pathLength: 1 }, gl);

      // L3 node — halo (r9) + star (r2.8), exactly as in constellation.js
      var g = mk('g', { 'class': 'fan-node', style: '--d:' + (0.14 + i * 0.08).toFixed(2) + 's' }, gn);
      mk('circle', { cx: x, cy: y, r: 9, fill: color, opacity: 0.13 }, g);
      mk('circle', { cx: x, cy: y, r: 2.8, fill: color }, g);
      var t = mk('text', { x: x + 9, y: y, 'text-anchor': 'start', 'dominant-baseline': 'middle', 'font-family': "'Josefin Sans',sans-serif", 'font-weight': 400, 'font-size': 7.1, 'letter-spacing': 0.6, fill: INK }, g);
      t.textContent = lab.toUpperCase();
    });

    // hub — L2 module node: halo (r14) + dot (r5), exactly as in constellation.js
    var gh = mk('g', { 'class': 'fan-node', style: '--d:0s' }, gn);
    mk('circle', { cx: hubX, cy: hubY, r: 14, fill: color, opacity: 0.13 }, gh);
    mk('circle', { cx: hubX, cy: hubY, r: 5, fill: color }, gh);
    if (hubName) {
      var words = hubName.toUpperCase().split(' ');
      var lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [hubName.toUpperCase()];
      lines.forEach(function (ln, li) {
        var ht = mk('text', { x: hubX, y: hubY + 22 + li * 12, 'text-anchor': 'middle', 'font-family': "'Josefin Sans',sans-serif", 'font-weight': 600, 'font-size': 7.5, 'letter-spacing': 1, fill: INK_HUB }, gh);
        ht.textContent = ln;
      });
    }

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
    }, { threshold: 0.3 });
    hosts.forEach(function (h) { io.observe(h); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
