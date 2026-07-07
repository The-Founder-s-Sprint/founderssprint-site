/* =========================================================================
   FSConstellation — The Founder's Sprint constellation explorer
   -------------------------------------------------------------------------
   Vanilla JavaScript + inline SVG. No frameworks, no build step.

   Mount:
     <link rel="stylesheet" href="constellation.css">
     <script src="constellation.js"></script>
     <div id="constellation"></div>
     <script>
       FSConstellation.init(document.getElementById('constellation'), {
         taxonomy: window.FS_TAXONOMY
       });
     </script>

   The module renders the constellation and its own overlay chrome (title
   card, legend, search field, stat strip). It owns NO business logic:
   search only emits events, clicks only emit events — the host page owns
   scoring, coach panels, and booking.

   Public API (all on window.FSConstellation):
     init(containerEl, { taxonomy, colors, config })
     on(event, fn) / off(event, fn)
       'nodeClick'   node            — user clicked a star (or legend row)
       'nodeHover'   node | null     — pointer entered / left a star
       'search'      query           — user typed in the search field
       'focusChange' node | null     — view focused a branch / snapped back
     highlight(ids[]) / clearHighlight()
     focus(id) / focusDiscipline(indexOrKey) / reset()
     pause() / resume() / destroy()
     nodes()  — every rendered node payload (for mapping search indexes)

   Node payloads carry { id, level, disciplineKey, name, disciplineLabel,
   moduleIndex, moduleName }.

   Id scheme (stable, derived from the taxonomy):
     L1  d:{key}                      d:marketing
     L2  l2:{key}:{moduleIndex}       l2:marketing:1
     L3  l3:{key}:{slug(name)}        l3:marketing:whatsapp-commerce
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     0 · Small helpers
     --------------------------------------------------------------------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let UID = 0;

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  function htmlEl(tag, className, parent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (parent) parent.appendChild(el);
    return el;
  }

  /** slug('Positioning & Story') → 'positioning-and-story' */
  function slugify(s) {
    return String(s).toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** Two-level-deep config merge (objects merge, everything else replaces). */
  function merge(base, over) {
    const out = {};
    for (const k in base) out[k] = base[k];
    if (over) for (const k in over) {
      const b = base ? base[k] : undefined, o = over[k];
      out[k] = (o && b && typeof o === 'object' && typeof b === 'object' &&
                !Array.isArray(o) && !Array.isArray(b)) ? merge(b, o) : o;
    }
    return out;
  }

  function norm180(x) { return ((x + 180) % 360 + 360) % 360 - 180; }

  /* ---------------------------------------------------------------------
     1 · Default configuration — the refined values, as shipped.
         Every number here is overridable via init(..., { config }).
     --------------------------------------------------------------------- */
  const DEFAULTS = {
    /* SVG coordinate space. The module scales responsively inside its
       container; these only set the drawing's internal proportions. */
    viewBox: { width: 1600, height: 1000 },

    layout: {
      r1: 175,              // discipline (L1) ring radius
      r2: 315,              // module (L2) ring radius
      r3: 452,              // specialty (L3) ring radius
      focusR2: 335,         // L2 radius while its branch is fanned open
      focusR3: 560,         // L3 radius while fanned
      dimScale: 0.74,       // non-selected branches recede to this × radius
      cxFocus: 372,         // hub x while focused (viewBox units)
      cxFocusMin: 140,      // never push the hub further left than this
      reservedRight: 428,   // px kept clear on the right for the HOST panel while focused
      gutterDeg: 7,         // angular gap between discipline sectors
      fanSpreadDeg: 62,     // half-angle of the fanned-open branch
      axisTiltDeg: 12       // elliptical tilt of the orbit plane (0 = flat circle)
    },

    nodes: {
      l1: { ring: 16, diamondH: 8.5, diamondW: 7 },
      l2: { halo: 14, dot: 5 },
      l3: { halo: 9, star: 2.8 },
      hitRadius: 17,        // invisible pointer target around every node
      hoverScale: 1.45,
      focusScale: 1.75      // the focused node itself
    },

    labels: {
      fsL1: 15, fsL2: 11, fsL3: 10,          // font sizes (viewBox units)
      trackL1: 2.4, trackL2: 1.4, trackL3: 0.9, // letter-spacing
      gapBuffer: 3                            // min vertical gap in the collision cascade
    },

    /* The V6 mark at the hub. Blade geometry is taken from the Logo System
       (mark-full-on-dark.svg): full-diameter blades, static eye on top. */
    mark: {
      bladeLength: 42, bladeWidth: 7,
      eyeRadius: 4.5, pupilRadius: 2,
      scale: 1.15, hoverScale: 1.3,
      hitRadius: 58,          // hub rollover target (also wakes the search field)
      spinSeconds: 18,        // one blade revolution — the brand's mark-spin loop
      colors: null,           // null → logo palette when 5 disciplines, else taxonomy colours
      opacities: null         // null → logo per-blade opacities / 0.8
    },

    motion: {
      easeMs: 190,            // global spring constant (higher = softer)
      idleSpinDegPerSec: 0.6, // constellation self-rotation while idle
      starWheelDegPerSec: 1.2,// background sky rotation (~5 min / revolution)
      twinkle: 1,             // multiplier on star + node twinkle speed
      snapbackSeconds: 12,    // inactivity before a focused view returns to orbit
      intro: true             // supernova load sequence (~2.6 s; skipped on reduced motion)
    },

    atmosphere: {
      cloudIntensity: 0.26,   // master opacity for the three cloud plates
      driftSecondsA: 150, driftSecondsB: 216, driftSecondsC: 264,
      images: null,           // { a, b, c } URL overrides; null → constellation.css defaults
      stars: { scatter: 150, lane: 230, bright: 26, laneAngleRad: -0.42 }
    },

    chrome: {
      header: true, legend: true, search: true, meta: true, hint: true,
      eyebrow: "THE FOUNDER'S SPRINT",
      title: 'The constellation',
      subtitle: null,         // null → derived: "5 disciplines · 49 specialties. Choose a star."
      legendHeading: 'DISCIPLINES',
      searchPlaceholder: 'Search specialties…',
      metaSuffix: '',         // appended to the stat strip, e.g. ' · 5 COACHES'
      hintText: null          // null → derived from snapbackSeconds
    },

    behaviour: {
      focusOnClick: true,        // clicking a star fans its branch open
      fadeChromeOnFocus: true,   // header + legend fade while focused (host panel is open)
      wakeSearchOnHub: true,     // hovering the V6 mark focuses the search field
      expandHighlight: true      // highlight(ids) also lights parents + children
    }
  };

  /* Logo-system blade palette (mark-full-on-dark.svg) — used when the
     taxonomy has exactly five disciplines, so the hub mark stays on-brand. */
  const LOGO_BLADES = [
    ['#C8531F', 0.85], ['#C9923A', 0.80], ['#8AAB5C', 0.78],
    ['#3D4A2E', 0.82], ['#777770', 0.75]
  ];

  /* Load-sequence timings (ms from first rendered frame). Tuned as a set —
     edit here if you must, but they are deliberately not in `config`. */
  const INTRO = {
    total: 2600,
    skyFade: 350,                    // scatter stars fade up
    mw: { start: 350, dur: 500 },    // milky-way lane blooms
    seed: { start: 560, dur: 320 },  // dim seed star charges at the hub
    flash: { start: 870, dur: 540 }, // supernova flash core
    shock: { start: 900, dur: 900 }, // expanding shock ring
    sparks: { start: 890, count: 44 },
    tiers: { 1: [950, 500], 2: [1150, 620], 3: [1350, 780] }, // [start, dur] per level
    rings: { start: 1250, dur: 650 },
    chromeReveal: 2050
  };

  /* ---------------------------------------------------------------------
     2 · Taxonomy normalisation
         Input (taxonomy.js shape):
           { disciplines: [ { key, label, color, l2: [ { name, l3: [...] } ] } ] }
         (a bare array of disciplines is also accepted)
     --------------------------------------------------------------------- */
  function normalizeTaxonomy(input, colorOpts) {
    const list = Array.isArray(input) ? input : (input && input.disciplines);
    if (!list || !list.length) {
      throw new Error('FSConstellation.init: taxonomy must contain a non-empty `disciplines` array');
    }
    const FALLBACK = ['#c8531f', '#c9923a', '#8aab5c', '#5f7a45', '#a59b8c', '#7a8a99', '#a86b4c'];
    const overrides = (colorOpts && colorOpts.disciplines) || {};

    return list.map((d, i) => {
      const key = d.key != null ? String(d.key) : slugify(d.label || 'discipline-' + i);
      const seen = Object.create(null);
      const modules = (d.l2 || []).map((m, mi) => ({
        index: mi,
        name: String(m.name || 'Module ' + (mi + 1)),
        kids: (m.l3 || []).map(name => {
          let s = slugify(name);
          if (seen[s]) { seen[s] += 1; s = s + '-' + seen[s]; } else seen[s] = 1;
          return { name: String(name), slug: s };
        })
      }));
      return {
        key,
        label: String(d.label || key),
        color: overrides[key] || d.color || FALLBACK[i % FALLBACK.length],
        modules,
        count: modules.reduce((s, m) => s + m.kids.length, 0)
      };
    });
  }

  /* ---------------------------------------------------------------------
     3 · The instance
     --------------------------------------------------------------------- */
  class Instance {
    constructor(container, opts) {
      if (!container || !container.appendChild) {
        throw new Error('FSConstellation.init: first argument must be a DOM element');
      }
      this.container = container;
      this.cfg = merge(DEFAULTS, (opts && opts.config) || {});
      this.colors = (opts && opts.colors) || {};
      this.ds = normalizeTaxonomy(opts && opts.taxonomy, this.colors);
      this.uid = 'fsc' + (++UID);

      this.vw = this.cfg.viewBox.width;
      this.vh = this.cfg.viewBox.height;
      this.cxIdle = this.vw / 2;
      this.cy = this.vh / 2;
      this.reduced = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this._ev = {};            // event name → [fns]
      this.hlSet = null;        // current highlight() Set
      this.focusId = null;
      this._paused = false;

      this._buildModel();
      this._buildDom();
      this._buildScene();
      this._bindEvents();

      /* motion state */
      this.rot = { c: 0, t: 0 };
      this.gcx = { c: this.cxIdle, t: this.cxIdle };
      this.tilt = { c: this.cfg.layout.axisTiltDeg, t: this.cfg.layout.axisTiltDeg };
      this.markRot = 0;
      this.markSc = { c: this.cfg.mark.scale, t: this.cfg.mark.scale };
      this.starRot = 0;
      this.idleSpin = 0;
      this.lastAct = performance.now();
      this._pt = null;

      /* load sequence — the clock starts at the first real animation frame
         (background tabs defer rAF; the intro should play when SEEN) */
      this._introStart = this.cfg.motion.intro && !this.reduced ? performance.now() : -1e9;
      this._chromeHidden = this._introStart > 0;
      if (this._chromeHidden) {
        if (this.els.search) this.els.search.style.opacity = 0;
        if (this.els.meta) this.els.meta.style.opacity = 0;
        this._chromeTO = setTimeout(() => this._revealChrome(), 6000); // fallback; re-armed on first tick
      }
      this._syncChrome();

      this._measured = this._measureLabels();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (this._destroyed) return;
          this._measured = this._measureLabels();
          this._exT = 0;
          this._settle();
        });
      }

      this._loop = this._loop.bind(this);
      this._renderFrame(performance.now(), 1);   // synchronous first paint
      this._raf = requestAnimationFrame(this._loop);
    }

    /* ------------------------------------------------------------------
       3.1 · Data model — angular sectors sized by specialty count
       ------------------------------------------------------------------ */
    _buildModel() {
      const L = this.cfg.layout;
      const total = this.ds.reduce((s, d) => s + d.count, 0) || 1;
      const avail = 360 - L.gutterDeg * this.ds.length;
      let a = -90;

      this.nodes = []; this.links = []; this.byId = {};

      this.ds.forEach(d => {
        const span = avail * d.count / total;
        d.a0 = a; d.span = span; d.center = a + span / 2;

        const l1 = this._mkNode({
          lvl: 1, id: 'd:' + d.key, name: d.label, disc: d, ang: d.center, r: L.r1
        });
        let ki = 0;
        d.modules.forEach(m => {
          const kidNodes = m.kids.map(k => {
            const ang = a + span * ((ki + 0.5) / d.count); ki++;
            return this._mkNode({
              lvl: 3, id: 'l3:' + d.key + ':' + k.slug, name: k.name,
              disc: d, ang, r: L.r3, mod: m
            });
          });
          const mAng = kidNodes.reduce((s, n) => s + n.base, 0) / kidNodes.length;
          const l2 = this._mkNode({
            lvl: 2, id: 'l2:' + d.key + ':' + m.index, name: m.name,
            disc: d, ang: mAng, r: L.r2, mod: m
          });
          m.node = l2; l2.children = kidNodes; l2.parentL1 = l1;
          kidNodes.forEach(n => { n.parent = l2; this.links.push({ a: l2, b: n, d, el: null }); });
          this.links.push({ a: l1, b: l2, d, el: null });
        });
        d.node = l1;
        a += span + L.gutterDeg;
      });
    }

    _mkNode(o) {
      const n = Object.assign({
        base: o.ang, tAng: o.ang, cAng: o.ang,   // angle: base / target / current
        rBase: o.r, tR: o.r, cR: o.r,            // radius
        tOp: 1, cOp: 0, tSc: 1, cSc: 1,          // opacity + scale
        twS: (0.0014 + Math.random() * 0.0024) * this.cfg.motion.twinkle,
        twP: Math.random() * 6.283,
        hovered: false
      }, o);
      this.nodes.push(n);
      this.byId[n.id] = n;
      return n;
    }

    /** Public payload for one node — what every event hands the host. */
    _payload(n) {
      return {
        id: n.id,
        level: n.lvl,
        disciplineKey: n.disc.key,
        name: n.name,
        disciplineLabel: n.disc.label,
        moduleIndex: n.mod ? n.mod.index : null,
        moduleName: n.mod ? n.mod.name : null
      };
    }

    /* ------------------------------------------------------------------
       3.2 · DOM — clouds, svg, overlay chrome
       ------------------------------------------------------------------ */
    _buildDom() {
      const c = this.container, cfg = this.cfg, A = cfg.atmosphere;
      c.classList.add('fsc-root');
      c.style.setProperty('--fsc-cloud', A.cloudIntensity);
      c.style.setProperty('--fsc-drift-a', A.driftSecondsA + 's');
      c.style.setProperty('--fsc-drift-b', A.driftSecondsB + 's');
      c.style.setProperty('--fsc-drift-c', A.driftSecondsC + 's');
      if (this.colors.bg) c.style.setProperty('--fsc-bg', this.colors.bg);
      if (this.colors.ink) c.style.setProperty('--fsc-ink', this.colors.ink);

      this.els = {};

      /* cloud plates — A + C behind the constellation, B in front */
      const cloud = (name) => {
        const wrap = htmlEl('div', 'fsc-cloud fsc-cloud-' + name, c);
        const img = htmlEl('div', 'fsc-cloud-img', wrap);
        if (A.images && A.images[name]) img.style.backgroundImage = 'url("' + A.images[name] + '")';
        return wrap;
      };
      this.els.cloudA = cloud('a');
      this.els.cloudC = cloud('c');

      /* the constellation itself */
      this.svg = svgEl('svg', {
        viewBox: '0 0 ' + this.vw + ' ' + this.vh,
        preserveAspectRatio: 'xMidYMid meet',
        'class': 'fsc-svg'
      });
      c.appendChild(this.svg);

      this.els.cloudB = cloud('b');

      /* header card */
      if (cfg.chrome.header) {
        const h = htmlEl('div', 'fsc-header', c);
        const brand = htmlEl('div', 'fsc-header-brand', h);
        brand.appendChild(this._buildMiniMark(19));
        const eb = htmlEl('span', 'fsc-eyebrow', brand);
        eb.textContent = cfg.chrome.eyebrow;
        const t = htmlEl('div', 'fsc-title', h);
        t.textContent = cfg.chrome.title;
        const sub = htmlEl('div', 'fsc-subtitle', h);
        const nMod = this.ds.reduce((s, d) => s + d.modules.length, 0);
        const nSpec = this.ds.reduce((s, d) => s + d.count, 0);
        sub.textContent = cfg.chrome.subtitle != null
          ? cfg.chrome.subtitle
          : this.ds.length + ' disciplines · ' + nSpec + ' specialties. Choose a star.';
        this.els.header = h;
        this._nMod = nMod; this._nSpec = nSpec;
      }

      /* search field — emits 'search'; the host owns matching + results UI */
      if (cfg.chrome.search) {
        const w = htmlEl('div', 'fsc-search', c);
        const inp = htmlEl('input', 'fsc-search-input', w);
        inp.type = 'text';
        inp.placeholder = cfg.chrome.searchPlaceholder;
        inp.autocomplete = 'off';
        inp.spellcheck = false;
        inp.setAttribute('aria-label', 'Search specialties');
        this.els.search = w;
        this.els.searchInput = inp;
      }

      /* legend — derived from the taxonomy; a row click focuses its discipline */
      if (cfg.chrome.legend) {
        const lg = htmlEl('div', 'fsc-legend', c);
        const head = htmlEl('div', 'fsc-legend-heading', lg);
        head.textContent = cfg.chrome.legendHeading;
        const items = htmlEl('div', 'fsc-legend-items', lg);
        this.ds.forEach((d, i) => {
          const btn = htmlEl('button', 'fsc-legend-item', items);
          btn.type = 'button';
          const sw = htmlEl('span', 'fsc-legend-swatch', btn);
          sw.style.background = d.color;
          const nm = htmlEl('span', 'fsc-legend-name', btn);
          nm.textContent = d.label.toUpperCase();
          const ct = htmlEl('span', 'fsc-legend-count', btn);
          ct.textContent = String(d.count).padStart(2, '0');
          btn.addEventListener('click', () => {
            this._emit('nodeClick', this._payload(d.node));
            this.focusDiscipline(i);
          });
        });
        this.els.legend = lg;
      }

      /* stat strip — counts derived from the taxonomy */
      if (cfg.chrome.meta) {
        const m = htmlEl('div', 'fsc-meta', c);
        const nMod = this.ds.reduce((s, d) => s + d.modules.length, 0);
        const nSpec = this.ds.reduce((s, d) => s + d.count, 0);
        m.textContent = nSpec + ' SPECIALTIES · ' + nMod + ' MODULES · ' +
          this.ds.length + ' DISCIPLINES' + cfg.chrome.metaSuffix;
        this.els.meta = m;
      }

      /* inactivity hint — visible only while focused */
      if (cfg.chrome.hint) {
        const hint = htmlEl('div', 'fsc-hint', c);
        hint.textContent = cfg.chrome.hintText != null
          ? cfg.chrome.hintText
          : 'STILL FOR ' + cfg.motion.snapbackSeconds + 'S — THE CONSTELLATION RETURNS TO ORBIT';
        this.els.hint = hint;
      }
    }

    /** Resolve the hub-mark blade palette (colours + per-blade opacity). */
    _bladePalette() {
      const M = this.cfg.mark, N = this.ds.length;
      const useLogo = N === 5;
      return this.ds.map((d, i) => ({
        key: d.key,
        color: (M.colors && M.colors[i]) || (useLogo ? LOGO_BLADES[i][0] : d.color),
        idle: (M.opacities && M.opacities[i]) || (useLogo ? LOGO_BLADES[i][1] : 0.8)
      }));
    }

    /** Small static V6 mark for the header (same blade geometry, 100-box). */
    _buildMiniMark(size) {
      const M = this.cfg.mark, N = this.ds.length, step = 360 / N;
      const svg = svgEl('svg', { width: size, height: size, viewBox: '0 0 100 100', 'aria-hidden': 'true' });
      const pts = '50,' + (50 - M.bladeLength) + ' ' + (50 + M.bladeWidth) + ',50 50,' +
                  (50 + M.bladeLength) + ' ' + (50 - M.bladeWidth) + ',50';
      this._bladePalette().forEach((b, i) => {
        const at = { points: pts, fill: b.color, opacity: b.idle };
        if (i) at.transform = 'rotate(' + (i * step) + ', 50, 50)';
        svgEl('polygon', at, svg);
      });
      svgEl('circle', { cx: 50, cy: 50, r: M.eyeRadius, fill: 'var(--fsc-ink, #EFE7D8)' }, svg);
      svgEl('circle', { cx: 50, cy: 50, r: M.pupilRadius, fill: '#1A1A1A' }, svg);
      return svg;
    }

    /* ------------------------------------------------------------------
       3.3 · SVG scene — stars, rings, links, nodes, labels, mark, burst
       ------------------------------------------------------------------ */
    _buildScene() {
      const svg = this.svg, cfg = this.cfg;
      const mk = (t, at, parent) => svgEl(t, at, parent || svg);
      const vw = this.vw, vh = this.vh, cy = this.cy;
      const sf = Math.hypot(vw, vh) / Math.hypot(1600, 1000);   // star-geometry scale

      const defs = mk('defs', {});

      /* --- far starfield: wheels slowly about the sky centre --- */
      this.gStars = mk('g', { 'pointer-events': 'none' });
      this.stars = [];
      const S = cfg.atmosphere.stars;
      const BA = S.laneAngleRad, BAD = BA * 180 / Math.PI;

      /* soft glow plates under the milky-way lane */
      const rg = mk('radialGradient', { id: this.uid + '-mw' }, defs);
      mk('stop', { offset: '0%', 'stop-color': '#efe7d8', 'stop-opacity': 0.2 }, rg);
      mk('stop', { offset: '55%', 'stop-color': '#d8cdbb', 'stop-opacity': 0.09 }, rg);
      mk('stop', { offset: '100%', 'stop-color': '#d8cdbb', 'stop-opacity': 0 }, rg);
      this.mwGlow = [[0, 0, 700, 175], [-430, 26, 430, 120], [430, -26, 460, 128]].map(g => {
        const t = g[0] * sf, off = g[1] * sf;
        const gx = vw / 2 + Math.cos(BA) * t - Math.sin(BA) * off;
        const gy = cy + Math.sin(BA) * t + Math.cos(BA) * off;
        return mk('ellipse', {
          rx: (g[2] * sf).toFixed(1), ry: (g[3] * sf).toFixed(1),
          fill: 'url(#' + this.uid + '-mw)',
          transform: 'translate(' + gx.toFixed(1) + ',' + gy.toFixed(1) + ') rotate(' + BAD.toFixed(1) + ')'
        }, this.gStars);
      });

      const addStar = (x, y, rr, base, lane) => {
        const el = mk('circle', {
          cx: x.toFixed(1), cy: y.toFixed(1), r: rr.toFixed(2),
          fill: '#efe7d8', opacity: base.toFixed(3)
        }, this.gStars);
        this.stars.push({
          el, base, lane: !!lane,
          s: (0.0005 + Math.random() * 0.0016) * cfg.motion.twinkle,
          p: Math.random() * 6.283
        });
      };
      /* all-sky scatter — disc wide enough to cover the corners mid-rotation */
      for (let i = 0; i < S.scatter; i++) {
        const a = Math.random() * 6.283, rd = 990 * sf * Math.sqrt(Math.random());
        addStar(vw / 2 + Math.cos(a) * rd, cy + Math.sin(a) * rd,
          0.55 + Math.random() * 1.05, 0.12 + Math.random() * 0.3);
      }
      /* the lane — a dense river of stars */
      for (let i = 0; i < S.lane; i++) {
        const t = (Math.random() * 2 - 1) * 1050 * sf;
        const off = (Math.random() + Math.random() + Math.random() - 1.5) * 96 * sf;
        addStar(vw / 2 + Math.cos(BA) * t - Math.sin(BA) * off,
          cy + Math.sin(BA) * t + Math.cos(BA) * off,
          0.4 + Math.random() * 0.85, 0.1 + Math.random() * 0.26, true);
      }
      /* bright wayfinding stars — the ones that make the wheel legible */
      for (let i = 0; i < S.bright; i++) {
        const inLane = i % 2 === 0;
        const t = (Math.random() * 2 - 1) * 1000 * sf;
        const off = (Math.random() * 2 - 1) * (inLane ? 110 : 620) * sf;
        const x = inLane ? vw / 2 + Math.cos(BA) * t - Math.sin(BA) * off
                         : vw / 2 + (Math.random() * 2 - 1) * 950 * sf;
        const y = inLane ? cy + Math.sin(BA) * t + Math.cos(BA) * off
                         : cy + (Math.random() * 2 - 1) * 620 * sf;
        addStar(x, y, 1.25 + Math.random() * 0.8, 0.5 + Math.random() * 0.35, inLane);
      }

      /* --- orbit guide rings --- */
      const L = cfg.layout;
      this.rings = [L.r1, L.r2, L.r3].map(r => {
        const el = mk('ellipse', {
          rx: r, ry: r, fill: 'none', stroke: '#efe7d8',
          'stroke-width': 0.7, opacity: 0.05, 'pointer-events': 'none'
        });
        el._r = r;
        return el;
      });

      /* --- layer groups (paint order matters) --- */
      this.gLinks = mk('g', { fill: 'none', 'pointer-events': 'none' });
      this.gLead = mk('g', { 'pointer-events': 'none' });
      this.gNodes = mk('g', {});
      this.gLabels = mk('g', { 'pointer-events': 'none', 'class': 'fsc-svg-labels' });

      this.links.forEach(Lk => {
        Lk.el = mk('path', { stroke: Lk.d.color, 'stroke-width': 1, opacity: 0.16 }, this.gLinks);
      });

      /* --- nodes + labels --- */
      const NC = cfg.nodes, LB = cfg.labels;
      this.nodes.forEach(n => {
        const g = mk('g', { cursor: 'pointer', opacity: 0 }, this.gNodes);
        if (n.lvl === 1) {
          mk('circle', { r: NC.l1.ring, fill: 'none', stroke: n.disc.color, 'stroke-width': 1, opacity: 0.3 }, g);
          mk('path', {
            d: 'M0,-' + NC.l1.diamondH + ' L' + NC.l1.diamondW + ',0 L0,' + NC.l1.diamondH +
               ' L-' + NC.l1.diamondW + ',0 Z',
            fill: n.disc.color
          }, g);
        } else if (n.lvl === 2) {
          mk('circle', { r: NC.l2.halo, fill: n.disc.color, opacity: 0.09 }, g);
          mk('circle', { r: NC.l2.dot, fill: n.disc.color }, g);
        } else {
          mk('circle', { r: NC.l3.halo, fill: n.disc.color, opacity: 0.1 }, g);
          n.star = mk('circle', { r: NC.l3.star, fill: n.disc.color }, g);
        }

        /* pointer target */
        const hit = mk('circle', { r: NC.hitRadius, fill: '#000', opacity: 0, 'pointer-events': 'all' }, g);
        hit.addEventListener('pointerenter', () => {
          n.hovered = true;
          this._emit('nodeHover', this._payload(n));
        });
        hit.addEventListener('pointerleave', () => {
          n.hovered = false;
          this._emit('nodeHover', null);
        });
        hit.addEventListener('pointerdown', e => {
          e.stopPropagation();
          this._emit('nodeClick', this._payload(n));
          if (cfg.behaviour.focusOnClick) this.focus(n.id);
        });
        n.el = g;

        /* label — L1/L2 hang centred below their node on 2 balanced lines;
           L3 projects outward from the ring */
        n.lab = mk('text', {
          'font-weight': n.lvl === 1 ? 600 : 400,
          'font-size': n.lvl === 1 ? LB.fsL1 : n.lvl === 2 ? LB.fsL2 : LB.fsL3,
          'letter-spacing': n.lvl === 1 ? LB.trackL1 : n.lvl === 2 ? LB.trackL2 : LB.trackL3,
          fill: n.lvl === 1 ? n.disc.color : '#efe7d8',
          'dominant-baseline': 'middle', opacity: 0
        }, this.gLabels);
        /* label is clickable too, not just the node dot */
        n.lab.style.pointerEvents = 'all';
        n.lab.style.cursor = 'pointer';
        n.lab.addEventListener('pointerdown', e => { e.stopPropagation(); this._emit('nodeClick', this._payload(n)); if (cfg.behaviour.focusOnClick) this.focus(n.id); });
        n.lab.addEventListener('pointerenter', () => { n.hovered = true; this._emit('nodeHover', this._payload(n)); });
        n.lab.addEventListener('pointerleave', () => { n.hovered = false; this._emit('nodeHover', null); });
        if (n.lvl <= 2) {
          const words = n.name.split(' ');
          let l1 = n.name, l2 = '';
          if (words.length > 1) {
            let best = 1, diff = 1e9;
            for (let s = 1; s < words.length; s++) {
              const da = Math.abs(words.slice(0, s).join(' ').length - words.slice(s).join(' ').length);
              if (da < diff) { diff = da; best = s; }
            }
            l1 = words.slice(0, best).join(' ');
            l2 = words.slice(best).join(' ');
          }
          n.lines = [l1, l2];
          n.tsp = [l1, l2].filter(Boolean).map((t, i) => {
            const ts = document.createElementNS(SVG_NS, 'tspan');
            ts.setAttribute('dy', i === 0 ? '0.1em' : '1.08em');
            ts.textContent = t;
            n.lab.appendChild(ts);
            return ts;
          });
        } else {
          n.lab.textContent = n.name;
        }
        if (n.lvl === 3) {
          n.lead = mk('line', { stroke: '#efe7d8', 'stroke-width': 0.7, opacity: 0 }, this.gLead);
        }
      });

      /* --- the V6 mark at the hub ---
         Blade geometry from Logo System/svg/mark-full-on-dark.svg: N full-
         diameter blades spinning (mark-spin loop); static eye + pupil on top.
         While a discipline is focused its blade goes to 1, the rest to 0.08. */
      const M = cfg.mark;
      this.gMark = mk('g', { 'pointer-events': 'none' });
      this.gMarkSpin = mk('g', {}, this.gMark);
      const step = 360 / this.ds.length;
      this.petals = this._bladePalette().map((b, i) => {
        const p = mk('path', {
          d: 'M0,-' + M.bladeLength + ' L' + M.bladeWidth + ',0 L0,' + M.bladeLength +
             ' L-' + M.bladeWidth + ',0 Z',
          fill: b.color, transform: 'rotate(' + (i * step) + ')', opacity: b.idle
        }, this.gMarkSpin);
        return { key: b.key, el: p, o: b.idle, idle: b.idle };
      });
      mk('circle', { r: M.eyeRadius, fill: '#EFE7D8' }, this.gMark);
      mk('circle', { r: M.pupilRadius, fill: '#1A1A1A' }, this.gMark);

      /* hub rollover — wakes the search field */
      this.markHit = mk('circle', {
        r: M.hitRadius, fill: '#000', opacity: 0, 'pointer-events': 'all', cursor: 'pointer'
      });
      const wake = () => {
        if (this._chromeHidden) return;
        this._markHov = true;
        if (cfg.behaviour.wakeSearchOnHub && !this.focusId && this.els.searchInput) {
          this.els.searchInput.focus();
        }
      };
      this.markHit.addEventListener('pointerenter', wake);
      this.markHit.addEventListener('pointerdown', e => { e.stopPropagation(); wake(); });
      this.markHit.addEventListener('pointerleave', () => { this._markHov = false; });

      /* --- supernova burst layer (load sequence) --- */
      const fg = mk('radialGradient', { id: this.uid + '-flash' }, defs);
      mk('stop', { offset: '0%', 'stop-color': '#fff6e4', 'stop-opacity': 1 }, fg);
      mk('stop', { offset: '32%', 'stop-color': '#efe7d8', 'stop-opacity': 0.55 }, fg);
      mk('stop', { offset: '100%', 'stop-color': '#efe7d8', 'stop-opacity': 0 }, fg);
      this.gBurst = mk('g', { 'pointer-events': 'none' });
      this.flashEl = mk('circle', { r: 0, fill: 'url(#' + this.uid + '-flash)', opacity: 0 }, this.gBurst);
      this.shockEl = mk('circle', { r: 0, fill: 'none', stroke: '#efe7d8', 'stroke-width': 1.4, opacity: 0 }, this.gBurst);
      const sparkCols = this.ds.map(d => d.color).concat(['#efe7d8', '#f2c88b', '#efe7d8']);
      this.sparks = [];
      for (let i = 0; i < INTRO.sparks.count; i++) {
        const el = mk('line', {
          stroke: sparkCols[i % sparkCols.length],
          'stroke-width': (1 + Math.random() * 1.2).toFixed(2),
          'stroke-linecap': 'round', opacity: 0
        }, this.gBurst);
        this.sparks.push({
          el,
          ang: Math.random() * 6.283,
          curl: (Math.random() - 0.5) * 1.1,
          maxD: (160 + Math.random() * 480) * sf,
          life: 520 + Math.random() * 420,
          delay: Math.random() * 130,
          len: (26 + Math.random() * 66) * sf
        });
      }
      this._sf = sf;
    }

    /* ------------------------------------------------------------------
       3.4 · Global listeners
       ------------------------------------------------------------------ */
    _bindEvents() {
      this._act = () => { this.lastAct = performance.now(); };
      ['pointermove', 'pointerdown', 'wheel', 'keydown'].forEach(ev =>
        window.addEventListener(ev, this._act, { passive: true }));

      /* any click skips the load sequence */
      this._skipIntro = () => {
        if (this._introStart > 0 && performance.now() - this._introStart < INTRO.total) {
          this._introStart = -1e9;
          this._revealChrome();
          this._settle();
        }
      };
      window.addEventListener('pointerdown', this._skipIntro);

      this._esc = e => { if (e.key === 'Escape') this.reset(); };
      window.addEventListener('keydown', this._esc);

      /* click on empty sky returns to orbit */
      this.svg.addEventListener('pointerdown', e => {
        if (e.target === this.svg) this.reset();
      });

      /* search field only EMITS — the host owns matching and results UI */
      if (this.els.searchInput) {
        this.els.searchInput.addEventListener('input', e => {
          this._emit('search', e.target.value);
        });
      }

      /* keep the focus clamp + label exclusions honest across resizes */
      if (window.ResizeObserver) {
        this._ro = new ResizeObserver(() => {
          this._exT = 0;
          if (this.focusId) this._computeFocusCx();
          this._settle();
        });
        this._ro.observe(this.container);
      }
    }

    /* ------------------------------------------------------------------
       3.5 · Chrome sync (fade states) + label exclusion rects
       ------------------------------------------------------------------ */
    _revealChrome() {
      clearTimeout(this._chromeTO);
      this._chromeHidden = false;
      this._syncChrome();
      if (this.els.search) this.els.search.style.opacity = 1;
      if (this.els.meta) this.els.meta.style.opacity = 1;
    }

    _syncChrome() {
      const faded = (this.focusId && this.cfg.behaviour.fadeChromeOnFocus) || this._chromeHidden;
      if (this.els.header) this.els.header.style.opacity = faded ? 0 : 1;
      if (this.els.legend) {
        this.els.legend.style.opacity = faded ? 0 : 1;
        this.els.legend.style.pointerEvents = faded ? 'none' : 'auto';
      }
      if (this.els.hint) this.els.hint.style.opacity = this.focusId ? 0.42 : 0;
    }

    /** Chrome cards as label no-go rects, in viewBox coords. Labels exit
        below the header and above the legend — never behind them. */
    _updateExclusions() {
      this.exRects = [];
      if (this.focusId && this.cfg.behaviour.fadeChromeOnFocus) return;   // chrome is faded out
      const ctm = this.svg.getScreenCTM();
      if (!ctm) return;
      const inv = ctm.inverse();
      [['header', 'down'], ['legend', 'up']].forEach(([key, dir]) => {
        const el = this.els[key];
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;   // no layout yet
        const p0 = new DOMPoint(r.left, r.top).matrixTransform(inv);
        const p1 = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
        this.exRects.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, dir });
      });
    }

    /** Measured glyph widths (length×fs estimates miss letter-spacing).
        Returns true only when EVERY label yielded a real width. */
    _measureLabels() {
      let all = true;
      for (const n of this.nodes) {
        try {
          const w = n.tsp && n.tsp.length
            ? Math.max.apply(null, n.tsp.map(t => t.getComputedTextLength()))
            : n.lab.getComputedTextLength();
          n.labW = isFinite(w) && w > 0 ? w : null;
        } catch (e) { n.labW = null; }
        if (n.labW == null) all = false;
      }
      return all;
    }

    /* ------------------------------------------------------------------
       3.6 · Public view control
       ------------------------------------------------------------------ */
    focus(id) {
      const n = this.byId[id];
      if (!n) return this;
      if (this._introStart > 0 && performance.now() - this._introStart < INTRO.total) {
        this._introStart = -1e9;
        this._revealChrome();
      }
      const L = this.cfg.layout;
      const d = n.disc, fanH = L.fanSpreadDeg, selHalf = d.span / 2;
      this.focusId = id;
      this.rot.t = -d.center;              // branch centre points right (0°)
      this._computeFocusCx();

      this.nodes.forEach(m => {
        const dd = norm180(m.base - d.center);
        const inSel = m.disc === d;
        /* selected branch maps its sector onto ±fanH°; the rest compress
           into the remaining arc so nothing overlaps the fan */
        const mapped = Math.abs(dd) <= selHalf + 0.01 && inSel
          ? dd * (fanH / selHalf)
          : Math.sign(dd || 1) * ((fanH + 9) + (Math.max(0, Math.abs(dd) - selHalf)) * (180 - (fanH + 9)) / (180 - selHalf));
        m.tAng = d.center + mapped;
        m.tR = inSel
          ? (m.lvl === 1 ? L.r1 : m.lvl === 2 ? L.focusR2 : L.focusR3)
          : m.rBase * L.dimScale;
        m.tOp = inSel ? 1 : 0.15;
        m.tSc = m === n ? this.cfg.nodes.focusScale : 1;
      });

      this.lastAct = performance.now();
      this.hlSet = null;                   // focus clears any highlight
      this._syncChrome();
      this._emit('focusChange', this._payload(n));
      this._settle();
      return this;
    }

    /** Hub x while focused — clamped so the fan + labels clear the host
        panel (cfg.layout.reservedRight px) on narrow viewports. */
    _computeFocusCx() {
      const L = this.cfg.layout;
      const rb = this.svg.getBoundingClientRect();
      const sc = Math.min(rb.width / this.vw, rb.height / this.vh) || 1;
      const padVB = Math.max(0, (rb.width / sc - this.vw) / 2);
      const rightVB = this.vw + padVB - L.reservedRight / sc;
      /* 210 ≈ widest fanned L3 label + lead line, in viewBox units */
      this.gcx.t = Math.max(L.cxFocusMin, Math.min(L.cxFocus, rightVB - L.focusR3 - 210));
    }

    reset() {
      if (!this.focusId) return this;
      this.focusId = null;
      /* resume the idle spin seamlessly from the current angle */
      this.idleSpin = ((this.rot.c % 360) + 360) % 360;
      this.rot.t = this.idleSpin;
      this.gcx.t = this.cxIdle;
      this.nodes.forEach(m => { m.tAng = m.base; m.tR = m.rBase; m.tOp = 1; m.tSc = 1; });
      this._syncChrome();
      this._emit('focusChange', null);
      this._settle();
      return this;
    }

    focusDiscipline(indexOrKey) {
      const d = typeof indexOrKey === 'number'
        ? this.ds[indexOrKey]
        : this.ds.find(x => x.key === indexOrKey);
      if (d) this.focus('d:' + d.key);
      return this;
    }

    /** Light up the given node ids and dim everything else.
        With behaviour.expandHighlight (default) each id also lights its
        parent chain and children, so branches read as paths. */
    highlight(ids, opts) {
      const expand = opts && 'expand' in opts ? !!opts.expand : this.cfg.behaviour.expandHighlight;
      const set = new Set();
      (ids || []).forEach(id => {
        const n = this.byId[id];
        if (!n) return;
        set.add(n.id);
        if (expand) {
          if (n.parent) set.add(n.parent.id);         // L3 → its module
          if (n.parentL1) set.add(n.parentL1.id);     // L2 → its discipline
          if (n.disc.node) set.add(n.disc.node.id);   // always the discipline
          if (n.children) n.children.forEach(c => set.add(c.id));
        }
      });
      this.hlSet = set.size ? set : null;
      this._settle();
      return this;
    }

    clearHighlight() {
      this.hlSet = null;
      this._settle();
      return this;
    }

    pause() {
      if (this._paused) return this;
      this._paused = true;
      this._pausedAt = performance.now();
      cancelAnimationFrame(this._raf);
      this.container.classList.add('fsc-paused');   // CSS pauses the cloud drift
      return this;
    }

    resume() {
      if (!this._paused) return this;
      this._paused = false;
      if (this._introStart > 0 && this._pausedAt) {
        this._introStart += performance.now() - this._pausedAt;   // don't skip the intro
      }
      this._pt = null;
      this.container.classList.remove('fsc-paused');
      this._raf = requestAnimationFrame(this._loop);
      return this;
    }

    destroy() {
      this._destroyed = true;
      cancelAnimationFrame(this._raf);
      clearTimeout(this._chromeTO);
      ['pointermove', 'pointerdown', 'wheel', 'keydown'].forEach(ev =>
        window.removeEventListener(ev, this._act));
      window.removeEventListener('pointerdown', this._skipIntro);
      window.removeEventListener('keydown', this._esc);
      if (this._ro) this._ro.disconnect();
      this.container.classList.remove('fsc-root', 'fsc-paused');
      this.container.innerHTML = '';
      this._ev = {};
    }

    /* ------------------------------------------------------------------
       3.7 · Events
       ------------------------------------------------------------------ */
    on(ev, fn) { (this._ev[ev] || (this._ev[ev] = [])).push(fn); return this; }
    off(ev, fn) {
      if (this._ev[ev]) this._ev[ev] = this._ev[ev].filter(f => f !== fn);
      return this;
    }
    _emit(ev, arg) {
      const fns = this._ev[ev];
      if (fns) fns.slice().forEach(fn => { try { fn(arg); } catch (e) { console.error(e); } });
    }

    /* ------------------------------------------------------------------
       3.8 · Frame loop
       ------------------------------------------------------------------ */
    _loop(ts) {
      const dt = Math.min(60, this._pt == null ? 16 : ts - this._pt);
      this._pt = ts;
      this._lastRafTs = ts;

      if (this._introStart > 0 && !this._introTicked) {
        /* start the intro clock at the first REAL frame — background tabs
           defer rAF and the sequence should play when first seen */
        this._introTicked = true;
        this._introStart = ts;
        clearTimeout(this._chromeTO);
        this._chromeTO = setTimeout(() => this._revealChrome(), INTRO.chromeReveal);
      }

      /* hub mark spin — 360°/spinSeconds, wilder just after the burst */
      let mv = 360 / (this.cfg.mark.spinSeconds * 1000);
      if (this._introStart > 0) {
        const it = ts - this._introStart;
        if (it > INTRO.flash.start) mv += 0.3 * Math.exp(-(it - INTRO.flash.start) / 450);
      }
      this.markRot += dt * mv;

      /* the sky wheels slowly about its centre */
      if (!this.reduced) {
        this.starRot = (this.starRot + dt * this.cfg.motion.starWheelDegPerSec / 1000) % 360;
      }

      /* idle self-rotation + the decaying launch burst */
      if (!this.focusId) {
        let sv = this.cfg.motion.idleSpinDegPerSec / 1000;
        if (this._introStart > 0) {
          const it = ts - this._introStart;
          if (it > 900) sv += 0.16 * Math.exp(-(it - 900) / 520);
        }
        this.idleSpin = (this.idleSpin + dt * sv) % 360;
        this.rot.t = this.idleSpin;
      }

      const k = this.reduced ? 1 : 1 - Math.exp(-dt / this.cfg.motion.easeMs);

      /* inactivity snapback */
      const snapMs = this.cfg.motion.snapbackSeconds * 1000;
      if (this.focusId && ts - this.lastAct > snapMs) this.reset();

      this._renderFrame(ts, k);
      this._raf = requestAnimationFrame(this._loop);
    }

    /** Settle immediately after a target change so layout is correct even
        if rAF is throttled (background tab, first paint, resize). */
    _settle() {
      const now = performance.now();
      const stale = !this._lastRafTs || now - this._lastRafTs > 250;
      this._exT = 0;   // force exclusion-rect refresh
      this._renderFrame(now, stale ? 1 : 0.18);
    }

    /* ------------------------------------------------------------------
       3.9 · One full layout pass (k = 1 jumps straight to targets)
       ------------------------------------------------------------------ */
    _renderFrame(ts, k) {
      const cfg = this.cfg, vh = this.vh, RAD = Math.PI / 180;
      this.rot.c += (this.rot.t - this.rot.c) * k;
      this.gcx.c += (this.gcx.t - this.gcx.c) * k;
      const cx = this.gcx.c, cy = this.cy, rot = this.rot.c;

      /* ---- load-sequence clock: sky → milky way → supernova → tiers ---- */
      const IT = this._introStart > 0 ? ts - this._introStart : 1e9;
      const intro = IT < INTRO.total;
      const tierP = nn => {
        const t = INTRO.tiers[nn.lvl];
        return Math.max(0, Math.min(1, (IT - t[0]) / t[1]));
      };
      const skyK = Math.min(1, IT / INTRO.skyFade);
      const mwK = Math.max(0, Math.min(1, (IT - INTRO.mw.start) / INTRO.mw.dur));

      /* ---- axis tilt: elliptical projection, eases flat while focused ---- */
      this.tilt.t = this.focusId ? 0 : cfg.layout.axisTiltDeg;
      this.tilt.c += (this.tilt.t - this.tilt.c) * k;
      const tiltK = Math.cos(this.tilt.c * RAD);

      /* ---- orbit guide rings ---- */
      const ringK = Math.min(1, Math.max(0, (IT - INTRO.rings.start) / INTRO.rings.dur));
      this.rings.forEach(rc => {
        rc.setAttribute('cx', cx); rc.setAttribute('cy', cy);
        rc.setAttribute('rx', rc._r); rc.setAttribute('ry', (rc._r * tiltK).toFixed(1));
        rc.setAttribute('opacity', ((this.focusId ? 0.018 : 0.05) * ringK).toFixed(3));
      });

      /* ---- hub mark: seed-charge → pop-in with the flash → hover swell ---- */
      const M = cfg.mark;
      if (intro) {
        this.markSc.t = IT < INTRO.flash.start ? 0.3 : IT < 1300 ? M.scale * 1.3 : M.scale;
        if (IT < INTRO.flash.start) this.markSc.c = 0.3;
        this.gMark.setAttribute('opacity',
          IT < INTRO.seed.start ? '0'
            : IT < INTRO.flash.start ? ((IT - INTRO.seed.start) / INTRO.seed.dur * 0.3).toFixed(3)
            : Math.min(1, (IT - INTRO.flash.start) / 120).toFixed(3));
      } else {
        this.markSc.t = this._markHov ? M.hoverScale : M.scale;
        if (this.gMark.getAttribute('opacity') !== '1') this.gMark.setAttribute('opacity', '1');
      }
      this.markSc.c += (this.markSc.t - this.markSc.c) * k;
      this.gMark.setAttribute('transform',
        'translate(' + cx + ',' + cy + ') scale(' + this.markSc.c.toFixed(3) + ')');
      this.markHit.setAttribute('transform', 'translate(' + cx + ',' + cy + ')');
      this.gMarkSpin.setAttribute('transform', 'rotate(' + this.markRot.toFixed(2) + ')');

      /* blade focus-follow */
      const selDiscKey = this.focusId ? this.byId[this.focusId].disc.key : null;
      for (const p of this.petals) {
        const pt = selDiscKey ? (p.key === selDiscKey ? 1 : 0.08) : p.idle;
        p.o += (pt - p.o) * k;
        p.el.setAttribute('opacity', p.o.toFixed(3));
      }

      /* ---- the sky: wheeling starfield, breathing milky-way lane ---- */
      this.gStars.setAttribute('transform',
        'rotate(' + this.starRot.toFixed(2) + ' ' + (this.vw / 2) + ' ' + cy + ')');
      if (IT < 4000) for (const g of this.mwGlow) g.setAttribute('opacity', mwK.toFixed(3));
      if (!this.reduced) {
        const breath = 0.9 + 0.1 * Math.sin(ts * 0.00025);
        for (const s of this.stars) {
          s.el.setAttribute('opacity',
            (s.base * breath * (0.72 + 0.28 * Math.sin(ts * s.s + s.p)) * (s.lane ? mwK : skyK)).toFixed(3));
        }
      }

      /* ---- supernova: flash core, shock ring, fire-streak sparks ---- */
      if (intro) {
        const fp = (IT - INTRO.flash.start) / INTRO.flash.dur;
        if (fp > 0 && fp < 1) {
          this.flashEl.setAttribute('cx', cx); this.flashEl.setAttribute('cy', cy);
          this.flashEl.setAttribute('r', (50 + 470 * this._sf * (1 - Math.pow(1 - fp, 3))).toFixed(1));
          this.flashEl.setAttribute('opacity', (0.95 * Math.pow(1 - fp, 1.5)).toFixed(3));
        } else this.flashEl.setAttribute('opacity', 0);

        const sp = (IT - INTRO.shock.start) / INTRO.shock.dur;
        if (sp > 0 && sp < 1) {
          this.shockEl.setAttribute('cx', cx); this.shockEl.setAttribute('cy', cy);
          this.shockEl.setAttribute('r', (26 + (cfg.layout.r3 + 90) * (1 - Math.pow(1 - sp, 3))).toFixed(1));
          this.shockEl.setAttribute('opacity', (0.45 * (1 - sp)).toFixed(3));
        } else this.shockEl.setAttribute('opacity', 0);

        for (const sk of this.sparks) {
          const st = (IT - INTRO.sparks.start - sk.delay) / sk.life;
          if (st <= 0 || st >= 1) { sk.el.setAttribute('opacity', 0); continue; }
          const se = 1 - Math.pow(1 - st, 2.6);          // organic ease-out flight
          const sa = sk.ang + sk.curl * se;              // curling streak
          const d1 = sk.maxD * se;
          const d0 = Math.max(8, d1 - sk.len * (1 - st * 0.55));
          sk.el.setAttribute('x1', (cx + Math.cos(sa) * d0).toFixed(1));
          sk.el.setAttribute('y1', (cy + Math.sin(sa) * d0 * tiltK).toFixed(1));
          sk.el.setAttribute('x2', (cx + Math.cos(sa) * d1).toFixed(1));
          sk.el.setAttribute('y2', (cy + Math.sin(sa) * d1 * tiltK).toFixed(1));
          sk.el.setAttribute('opacity', (0.9 * Math.pow(1 - st, 1.25)).toFixed(3));
        }
      } else if (!this._burstDone) {
        this._burstDone = true;
        this.flashEl.setAttribute('opacity', 0);
        this.shockEl.setAttribute('opacity', 0);
        for (const sk of this.sparks) sk.el.setAttribute('opacity', 0);
      }

      /* ---- nodes ---- */
      const highlighting = !!this.hlSet;
      const labs3 = [], labs2 = [], labs1 = [];
      const LB = cfg.labels;

      for (const n of this.nodes) {
        n.cAng += (n.tAng - n.cAng) * k;
        n.cR += (n.tR - n.cR) * k;
        let top = n.tOp;
        if (highlighting) top = this.hlSet.has(n.id) ? 1 : 0.1;
        n.cOp += (top - n.cOp) * k;
        n.cSc += ((n.hovered && n.tSc < 1.4 ? cfg.nodes.hoverScale : n.tSc) - n.cSc) *
                 (this.reduced || k >= 1 ? 1 : Math.min(1, k * 2.1));
        if (intro) {
          /* tiered launch from the hub — easeOutBack overshoot, hot flare on arrival */
          const p = tierP(n);
          n.cR = n.rBase * (p <= 0 ? 0.02 : 1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2));
          n.cOp = Math.min(1, p * 2.4) * n.tOp;
          n.cSc = p <= 0 ? 0.2 : 1 + 1.1 * Math.exp(-p * 5);
        }

        const th = (n.cAng + rot) * RAD;
        n.x = cx + Math.cos(th) * n.cR;
        n.y = cy + Math.sin(th) * n.cR * tiltK;
        n.el.setAttribute('transform',
          'translate(' + n.x.toFixed(2) + ',' + n.y.toFixed(2) + ') scale(' + n.cSc.toFixed(3) + ')');
        n.el.setAttribute('opacity', n.cOp.toFixed(3));
        if (n.star && !this.reduced) {
          n.star.setAttribute('opacity', (0.76 + 0.24 * Math.sin(ts * n.twS + n.twP)).toFixed(3));
        }

        /* label targets */
        const inSel = this.focusId ? n.disc === this.byId[this.focusId].disc : true;
        let lop;
        if (n.lvl === 1) lop = (this.focusId && !inSel) ? 0.25 : 0.92;
        else lop = this.focusId ? (inSel ? 0.95 : 0) : (n.lvl === 2 ? 0.85 : 0.78);
        if (highlighting) lop = this.hlSet.has(n.id) ? 1 : 0.08;
        n.lop = n.lop == null ? lop * k : n.lop + (lop - n.lop) * k;
        if (intro) n.lop = Math.min(n.lop, Math.max(0, (tierP(n) - 0.7) * 3.4));

        const labR = n.cR + (n.lvl === 1 ? 28 : n.lvl === 2 ? 14 : 16);
        const right = Math.cos(th) >= 0;
        const fs = n.lvl === 1 ? LB.fsL1 : n.lvl === 2 ? LB.fsL2 : LB.fsL3;
        const tw = n.labW ?? ((n.lines
          ? Math.max.apply(null, n.lines.filter(Boolean).map(s => s.length))
          : n.name.length) * fs * 0.72);
        /* L1 + L2 hang centred just below their node; L3 projects outward */
        const ax = n.lvl === 3 ? cx + Math.cos(th) * labR : n.x;
        const lyD = n.lvl === 1 ? n.y + 38 : n.lvl === 2 ? n.y + 26 : cy + Math.sin(th) * labR * tiltK;
        const x0 = n.lvl === 3 ? (right ? ax : ax - tw) : ax - tw / 2;
        const x1 = n.lvl === 3 ? (right ? ax + tw : ax) : ax + tw / 2;
        const rec = { n, lx: ax, y: lyD, yD: lyD, right, x0, x1 };
        if (n.lvl === 3) labs3.push(rec); else if (n.lvl === 2) labs2.push(rec); else labs1.push(rec);
      }

      /* ---- label collision cascade ----
         ONE unified constraint system per frame over ALL visible labels
         (cross-tier), with the chrome cards as immovable bounds: header ⇒
         hard floor, legend ⇒ hard ceiling. When a clear band genuinely
         can't fit everything (tiny viewports), over-constrained labels are
         SHED — eased out at their natural spot — never stacked. */
      if (!this._exT || ts - this._exT > 400) {
        this._updateExclusions();
        this._exT = ts;
        if (!this._measured) this._measured = this._measureLabels();   // self-healing width cache
      }
      const all = labs3.concat(labs2, labs1);
      const BUF = LB.gapBuffer;
      for (const r of all) {
        r.half = r.n.lines && r.n.lines[1] ? (r.n.lvl === 1 ? 17 : 13) : r.n.lvl === 1 ? 10 : 8;
        r.flo = 14 + r.half;
        r.cei = (vh - 14) - r.half;
        for (const ex of (this.exRects || [])) {
          if (r.x1 > ex.x0 - 6 && ex.x1 + 6 > r.x0) {
            if (ex.dir === 'down') r.flo = Math.max(r.flo, ex.y1 + r.half + 4);
            else r.cei = Math.min(r.cei, ex.y0 - r.half - 4);
          }
        }
      }
      const xOv = (a, b) => a.x1 > b.x0 - 8 && b.x1 > a.x0 - 8;
      for (const r of all) { r.yInit = r.y; r.sup = false; }
      let col = all.filter(r => r.n.lop > 0.03).sort((a, b) => a.y - b.y);
      for (let pass = 0; pass < 3; pass++) {
        for (const r of col) r.y = r.yInit;
        for (let i = 0; i < col.length; i++) {
          const r = col[i];
          if (r.y < r.flo) r.y = r.flo;
          for (let j = 0; j < i; j++) {
            if (xOv(r, col[j])) r.y = Math.max(r.y, col[j].y + col[j].half + r.half + BUF);
          }
        }
        let shed = false;
        for (let i = col.length - 1; i >= 0; i--) {
          const r = col[i];
          if (r.y > r.cei) r.y = r.cei;
          for (let j = col.length - 1; j > i; j--) {
            if (xOv(r, col[j])) r.y = Math.min(r.y, col[j].y - col[j].half - r.half - BUF);
          }
          if (r.y < r.flo - 0.5) { r.sup = true; r.y = r.yInit; shed = true; }
        }
        if (!shed) break;
        col = col.filter(r => !r.sup);
      }

      for (const r of all) {
        const n = r.n;
        if (r.sup) n.lop += (0 - n.lop) * Math.min(1, k * 2.5);   // shed labels ease out
        n.lab.setAttribute('x', r.lx.toFixed(1));
        n.lab.setAttribute('y', r.y.toFixed(1));
        if (n.lvl === 3) {
          n.lab.setAttribute('text-anchor', r.right ? 'start' : 'end');
        } else {
          n.lab.setAttribute('text-anchor', 'middle');
          if (n.tsp) n.tsp.forEach(t2 => t2.setAttribute('x', r.lx.toFixed(1)));
        }
        n.lab.setAttribute('opacity', n.lop.toFixed(3));
        n.lab.setAttribute('font-weight', this.focusId === n.id ? 600 : n.lvl === 1 ? 600 : 400);
        if (n.lead) {
          /* lead line from star to displaced label */
          n.lead.setAttribute('x1', n.x.toFixed(1)); n.lead.setAttribute('y1', n.y.toFixed(1));
          n.lead.setAttribute('x2', (r.lx + (r.right ? -4 : 4)).toFixed(1));
          n.lead.setAttribute('y2', r.y.toFixed(1));
          const displaced = Math.abs(r.y - r.yD) > 7;
          n.lead.setAttribute('opacity', (n.lop * (displaced ? 0.3 : 0.14)).toFixed(3));
        }
      }

      /* ---- connections: curved, breathing with the morph ---- */
      const selNode = this.focusId ? this.byId[this.focusId] : null;
      for (const Lk of this.links) {
        const a = Lk.a, b = Lk.b;
        const midA = ((a.cAng + b.cAng) / 2 + rot) * RAD;
        const midR = (a.cR + b.cR) / 2 * 1.055;
        const mx = cx + Math.cos(midA) * midR, my = cy + Math.sin(midA) * midR * tiltK;
        Lk.el.setAttribute('d', 'M' + a.x.toFixed(1) + ',' + a.y.toFixed(1) +
          ' Q' + mx.toFixed(1) + ',' + my.toFixed(1) + ' ' + b.x.toFixed(1) + ',' + b.y.toFixed(1));
        let o, w = 1;
        const inSel = selNode && Lk.d === selNode.disc;
        if (selNode) {
          const onPath = inSel && (b === selNode || a === selNode ||
            (selNode.parent && (b === selNode.parent || a === selNode.parent)));
          o = inSel ? (onPath ? 0.7 : 0.4) : 0.05;
          w = onPath ? 1.6 : 1;
        } else {
          o = (a.hovered || b.hovered) ? 0.5 : 0.16;
        }
        if (highlighting) o = (this.hlSet.has(a.id) && this.hlSet.has(b.id)) ? 0.55 : 0.04;
        Lk.o = Lk.o == null ? o : Lk.o + (o - Lk.o) * k;
        let lo = Lk.o;
        if (intro) lo *= Math.max(0, (Math.min(tierP(Lk.a), tierP(Lk.b)) - 0.5) * 2);
        Lk.el.setAttribute('opacity', lo.toFixed(3));
        Lk.el.setAttribute('stroke-width', w);
      }
    }
  }

  /* ---------------------------------------------------------------------
     4 · Public facade — window.FSConstellation
         Single-mount: init() replaces any previous instance. Listeners
         attached before init() are buffered and flushed on mount.
     --------------------------------------------------------------------- */
  const pending = [];
  const api = {
    _inst: null,

    init(containerEl, opts) {
      if (this._inst) this._inst.destroy();
      this._inst = new Instance(containerEl, opts || {});
      pending.splice(0).forEach(([ev, fn]) => this._inst.on(ev, fn));
      return this;
    },

    on(ev, fn) {
      if (this._inst) this._inst.on(ev, fn); else pending.push([ev, fn]);
      return this;
    },
    off(ev, fn) {
      if (this._inst) this._inst.off(ev, fn);
      return this;
    },

    nodes() { const i = this._req(); return i.nodes.map(n => i._payload(n)); },
    highlight(ids, opts) { this._req().highlight(ids, opts); return this; },
    clearHighlight() { this._req().clearHighlight(); return this; },
    focus(id) { this._req().focus(id); return this; },
    focusDiscipline(i) { this._req().focusDiscipline(i); return this; },
    reset() { this._req().reset(); return this; },
    pause() { this._req().pause(); return this; },
    resume() { this._req().resume(); return this; },
    destroy() { if (this._inst) { this._inst.destroy(); this._inst = null; } },

    _req() {
      if (!this._inst) throw new Error('FSConstellation: call init(container, { taxonomy }) first');
      return this._inst;
    }
  };

  window.FSConstellation = api;
})();
