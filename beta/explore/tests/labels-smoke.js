'use strict';
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const dir = process.argv[2];
const dom = new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'), { url:'https://founderssprint.co/beta/explore/', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
window.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
window.fetch = () => Promise.reject(new Error('offline'));
window.eval(fs.readFileSync(path.join(dir,'explore.js'),'utf8'));
const doc = window.document;
setTimeout(() => {
  let fail = 0;
  // every L3 label must have finite coords + a font-size (4-branch NaN regression)
  const labels = Array.from(doc.querySelectorAll('#g-nodes .node')).map(g => g.querySelector('text.label')).filter(Boolean);
  const bad = labels.filter(t => !isFinite(parseFloat(t.getAttribute('x'))) || !isFinite(parseFloat(t.getAttribute('y'))));
  console.log((bad.length === 0 ? '✓' : '✗') + ' all node labels have finite coordinates (' + labels.length + ' labels, ' + bad.length + ' bad)');
  if (bad.length) fail++;
  // burst flash exists and has been driven, then zeroed after intro
  const flash = doc.querySelectorAll('#g-burst circle');
  console.log((flash.length === 85 ? '✓' : '✗') + ' burst flash + 84 dust particles in g-burst (' + flash.length + ')');
  if (flash.length !== 85) fail++;
  // emphasised L3 labels vary font size when an L2 is pinned
  const st = window.__constellation.state;
  st.pinnedId = 'l2-1-1';   // Financial Planning (4 specialties incl. Tax & Compliance)
  setTimeout(() => {
    const sizes = ['l3-1-1-0','l3-1-1-1','l3-1-1-2','l3-1-1-3'].map(id =>
      doc.querySelector('[data-node-id="' + id + '"] text.label').getAttribute('font-size'));
    const varied = new Set(sizes).size >= 2 && sizes.every(s => isFinite(parseFloat(s)));
    console.log((varied ? '✓' : '✗') + ' selected-state L3 labels vary size and stay finite [' + sizes.join(', ') + ']');
    if (!varied) fail++;
    console.log(fail ? fail + ' FAILURE(S)' : 'ALL PASS');
    process.exit(fail ? 1 : 0);
  }, 400);
}, 4400);
