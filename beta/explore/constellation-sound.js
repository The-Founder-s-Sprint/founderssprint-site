/* ============================================================
   constellation-sound.js — celestial-glass voice for the explorer.

   Design constraints (see the brief):
     · ZERO audio files. Everything is synthesised with Web Audio at runtime:
       no HTTP request, no decode, no cache-bust. ~3KB of JS instead of ~60KB
       of sprites — which matters on metered East African mobile data.
     · Cannot affect animation smoothness. Web Audio runs on its own audio
       thread; the only main-thread risk is ALLOCATING too many nodes, so we
       throttle hover and cap concurrent voices.
     · Zero edits to constellation.js. This is a bridge, like constellation-wire.js:
       it only subscribes to events the module already emits.
     · Autoplay policy: an AudioContext cannot start before a user gesture.
       We create it lazily on the first pointerdown/keydown, then reuse it.

   Musical idea: the constellation is playable. Every star is locked to a
   MINOR PENTATONIC scale, so no two nodes can ever clash. Each discipline owns
   a scale degree (its "root"), and pitch rises with depth — L1 low, L3 two
   octaves up. Sweeping a branch becomes an arpeggio rather than noise.

   Load AFTER constellation.js (needs FSConstellation). Desktop only.
   ============================================================ */
(function () {
  'use strict';

  if (!window.FSConstellation) return;
  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return; // mobile keeps the card-stack
  if (!(window.AudioContext || window.webkitAudioContext)) return;                  // fail silent, never break the page

  var el = document.getElementById('constellation');
  if (!el) return;

  /* ---- tuning ------------------------------------------------------ */
  var LS_KEY   = 'fs_constellation_sound';
  var MASTER   = 0.11;   // ceiling — subtle, but present
  var HOVER_G  = 0.050;
  var CLICK_G  = 0.085;
  var SWEEP_G  = 0.055;
  var THROTTLE = 55;     // ms between hover blips — a fast sweep becomes an arpeggio, not a machine-gun
  var MAX_VOICES = 6;    // hard cap on simultaneous oscillator pairs

  var BASE = 220;                                   // A3
  var PENTA = { marketing: 0, finance: 3, investment: 5, strategy: 7, product: 10 };  // minor-pentatonic degrees
  function freqFor(node) {
    var root = PENTA[node && node.disciplineKey];
    if (root == null) root = 0;
    var lvl = (node && node.level) || 1;            // L1 low → L3 two octaves up
    return BASE * Math.pow(2, (root + 12 * (lvl - 1)) / 12);
  }

  /* ---- audio graph (built lazily, once) ----------------------------- */
  var ctx = null, master = null, voices = 0, lastHover = 0;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var stored = null;
  try { stored = localStorage.getItem(LS_KEY); } catch (e) {}
  // ON by default — unless the visitor asked for reduced motion, or muted it before.
  var enabled = stored ? (stored === 'on') : !reduced;

  function ensureCtx() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = enabled ? MASTER : 0;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  // Browsers block audio until a real gesture. pointermove does NOT count.
  // CAPTURE phase is required: constellation.js calls e.stopPropagation() on node
  // pointerdown, so a bubble-phase listener would never see the very first click —
  // which is exactly the gesture we need to unlock audio.
  function unlock() { ensureCtx(); }
  document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  document.addEventListener('keydown', unlock, { capture: true, passive: true });

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem(LS_KEY, on ? 'on' : 'off'); } catch (e) {}
    if (master && ctx) {
      // ramp, never a hard cut — a step change in gain is an audible click
      var t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(on ? MASTER : 0, t + 0.08);
    }
    paintToggle();
  }

  /* ---- voices ------------------------------------------------------- */
  function canPlay() { return enabled && ctx && ctx.state === 'running' && voices < MAX_VOICES; }

  // A glass bell: two detuned sines through a lowpass, fast attack, long shimmer.
  function bell(freq, gain, dur, detune) {
    if (!canPlay()) return;
    voices++;
    var t = ctx.currentTime;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(7000, freq * 5);
    lp.Q.value = 0.6;
    lp.connect(g); g.connect(master);

    [0, detune].forEach(function (cents) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.detune.value = cents;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.02);
    });

    setTimeout(function () { voices = Math.max(0, voices - 1); }, (dur + 0.06) * 1000);
  }

  function hoverBlip(node) {
    var now = Date.now();
    if (now - lastHover < THROTTLE) return;
    lastHover = now;
    bell(freqFor(node), HOVER_G, 0.34, 7);
  }

  // Click: the star plus its fifth — a small, warm confirmation.
  function clickChime(node) {
    var f = freqFor(node);
    bell(f, CLICK_G, 0.55, 5);
    bell(f * Math.pow(2, 7 / 12), CLICK_G * 0.55, 0.7, -6);
  }

  // Snapback: a subtle whoosh — the map exhaling.
  // Filtered noise, not a tone: a bandpass sweeping downward reads as air moving
  // rather than a synth glide. The noise buffer is built ONCE and reused, so a
  // snapback allocates nothing but a few graph nodes.
  var noiseBuf = null;
  function getNoise() {
    if (noiseBuf) return noiseBuf;
    var len = Math.floor(ctx.sampleRate * 0.8);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len); // decaying white noise
    return noiseBuf;
  }

  function sweep() {
    if (!canPlay()) return;
    voices++;
    var t = ctx.currentTime;

    var src = ctx.createBufferSource();
    src.buffer = getNoise();

    // the "air": a bandpass falling from bright to dark
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(1900, t);
    bp.frequency.exponentialRampToValueAtTime(260, t + 0.50);

    // shave the hiss so it reads soft, not sibilant
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(SWEEP_G, t + 0.06);   // gentle swell, no click
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);

    src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(master);
    src.start(t); src.stop(t + 0.62);
    setTimeout(function () { voices = Math.max(0, voices - 1); }, 680);
  }

  /* ---- events (the module already emits these) ---------------------- */
  FSConstellation.on('nodeHover', function (node) { if (node) hoverBlip(node); });
  FSConstellation.on('nodeClick', function (node) { if (node) { ensureCtx(); clickChime(node); } });
  FSConstellation.on('focusChange', function (node) { if (!node) sweep(); });   // branch collapsed → snapback

  /* ---- toggle -------------------------------------------------------- */
  var btn;
  function paintToggle() {
    if (!btn) return;
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.setAttribute('aria-label', enabled ? 'Mute constellation sound' : 'Unmute constellation sound');
    btn.title = enabled ? 'Sound on' : 'Sound off';
    btn.innerHTML = enabled
      ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a9 9 0 0 1 0 12"/></svg>'
      : '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m17 9 5 6M22 9l-5 6"/></svg>';
  }

  function mountToggle() {
    // Sits directly ABOVE the module's stat strip (.fsc-meta is right:34px/bottom:32px),
    // right-aligned to the same edge so it reads as part of that chrome cluster.
    // z-index 7 clears .fsc-legend (6) and .fsc-meta (5).
    var css = '#fsc-sound{position:absolute;right:34px;bottom:72px;z-index:7;width:32px;height:32px;'
      + 'display:flex;align-items:center;justify-content:center;cursor:pointer;'
      + 'background:rgba(239,231,216,.06);border:1px solid rgba(239,231,216,.22);border-radius:50%;'
      + 'color:rgba(239,231,216,.55);transition:color .2s ease,border-color .2s ease,background .2s ease;}'
      + '#fsc-sound:hover{color:#C9923A;border-color:rgba(201,146,58,.55);background:rgba(201,146,58,.10);}'
      + '#fsc-sound[aria-pressed="false"]{color:rgba(239,231,216,.32);}'
      + '@media(max-width:768px){#fsc-sound{display:none;}}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

    btn = document.createElement('button');
    btn.id = 'fsc-sound';
    btn.type = 'button';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();          // don't let the sky-click collapse the branch
      ensureCtx();
      setEnabled(!enabled);
      if (enabled) bell(freqFor({ disciplineKey: 'investment', level: 2 }), HOVER_G, 0.4, 7); // a small "hello"
    });
    el.appendChild(btn);
    paintToggle();
  }

  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  mountToggle();
})();
