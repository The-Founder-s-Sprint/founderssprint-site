/* ============================================================
   constellation-wire.js — bridges the FSConstellation module (the refined CD
   build, desktop-only visual) to explore.js's real matcher + coach panel.

   Load order: taxonomy.js → constellation.js → explore.js → THIS.
   - FSConstellation  (window)  ... the renderer + events
   - window.__fsExplore         ... { NODES, TAXONOMY, search(q)->NODE[], openDetail(node) }
   - window.FS_TAXONOMY         ... the shared taxonomy the module renders
   Nodes are matched across the two by (level · discipline key · name), since the
   module renders our real taxonomy so names/keys are identical on both sides.
   ============================================================ */
(function () {
  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return; // mobile keeps the card-stack
  var host = window.__fsExplore;
  var el = document.getElementById('constellation');
  if (!window.FSConstellation || !host || !el || !window.FS_TAXONOMY) return;

  FSConstellation.init(el, {
    taxonomy: window.FS_TAXONOMY,
    config: {
      // Idle map stays at default size; only the FANNED branch is enlarged (~22%) to fill the screen.
      layout: { fanSpreadDeg: 44, focusR2: 410, focusR3: 685 },
      // Clouds dimmed 25% (0.14 → 0.105): the lane now carries real star detail, so the
      // haze can recede and the title/labels gain presence against it.
      atmosphere: { cloudIntensity: 0.105 }
    }
  });

  // ---- id map: module node id  <->  our NODE, keyed by (level|disciplineKey|name) ----
  var mod = FSConstellation.nodes();
  var k = function (dk, level, name) { return level + '|' + dk + '|' + name; };
  var discKeyOf = function (n) { var d = host.TAXONOMY[n.l1Idx]; return d ? d.key : null; };

  var ourByKey = {};
  host.NODES.forEach(function (n) { var dk = discKeyOf(n); if (dk != null) ourByKey[k(dk, n.level, n.name)] = n; });

  var idToOur = {};                 // module id -> our NODE
  var ourKeyToId = {};              // (our) key -> module id
  mod.forEach(function (m) {
    var key = k(m.disciplineKey, m.level, m.name);
    if (ourByKey[key]) idToOur[m.id] = ourByKey[key];
    ourKeyToId[key] = m.id;
  });
  var ourIdsFor = function (nodes) {
    var out = [];
    nodes.forEach(function (n) { var id = ourKeyToId[k(discKeyOf(n), n.level, n.name)]; if (id) out.push(id); });
    return out;
  };

  // ---- events ----
  // Type in the module's field → run our real matcher → light the matches.
  FSConstellation.on('search', function (q) {
    if (!q || !q.trim()) { FSConstellation.clearHighlight(); return; }
    FSConstellation.highlight(ourIdsFor(host.search(q)));
  });

  // Click any node → fan the branch (handled inside the module) AND open our
  // slide-out: L3 → coach + booking; L2 → module breakdown; L1 → discipline breakdown.
  var l1IdxOf = function (dk) {
    for (var i = 0; i < host.TAXONOMY.length; i++) { if (host.TAXONOMY[i].key === dk) return i; }
    return -1;
  };
  FSConstellation.on('nodeClick', function (node) {
    if (!node) return;
    if (node.level === 3) { var our = idToOur[node.id]; if (our) host.openDetail(our); return; }
    var l1 = l1IdxOf(node.disciplineKey);
    if (l1 < 0) return;
    if (node.level === 1) { host.openDiscipline(l1); return; }
    if (node.level === 2) {
      var l2 = -1, mods = host.TAXONOMY[l1].l2;
      for (var j = 0; j < mods.length; j++) { if (mods[j].name === node.name) { l2 = j; break; } }
      if (l2 >= 0) host.openModule(l1, l2);
    }
  });

  // Branch collapsed / Escape / sky click / inactivity → close our panel.
  FSConstellation.on('focusChange', function (node) {
    if (!node) { var c = document.querySelector('#detail .d-close'); if (c) c.click(); }
  });

  // ---- idle reset: a query left sitting for 30s clears itself ----
  // Keeps the map from being stranded in a highlighted state after someone
  // searches and walks away. Clearing the field re-uses the module's own
  // 'input' path, so the 'search' handler above drops the highlight for us.
  var IDLE_MS = 30000;
  var idleTO = null;
  var searchInput = el.querySelector('.fsc-search-input');

  function clearSearchField() {
    idleTO = null;
    if (!searchInput || !searchInput.value) return;
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));  // → 'search' '' → clearHighlight()
  }
  function armIdle() {
    if (idleTO) { clearTimeout(idleTO); idleTO = null; }
    if (!searchInput || !searchInput.value.trim()) return;   // nothing to reset — don't arm
    idleTO = setTimeout(clearSearchField, IDLE_MS);
  }

  if (searchInput) {
    searchInput.addEventListener('input', armIdle);
    // Any interaction with the map counts as activity and restarts the clock.
    ['pointerdown', 'pointermove', 'wheel', 'keydown'].forEach(function (evt) {
      el.addEventListener(evt, armIdle, { passive: true });
    });
  }
})();
