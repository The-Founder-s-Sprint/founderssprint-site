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
      atmosphere: { cloudIntensity: 0.14 }   // ease the clouds back so the discipline colour fields read
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

  // Click a specialty → open our coach slide-out (ratings + booking). Discipline/
  // module clicks just fan the branch (handled inside the module).
  FSConstellation.on('nodeClick', function (node) {
    if (node && node.level === 3) { var our = idToOur[node.id]; if (our) host.openDetail(our); }
  });

  // Branch collapsed / Escape / sky click / inactivity → close our panel.
  FSConstellation.on('focusChange', function (node) {
    if (!node) { var c = document.querySelector('#detail .d-close'); if (c) c.click(); }
  });
})();
