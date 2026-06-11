'use strict';
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const dir = process.argv[2];
const dom = new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'), { url:'https://founderssprint.co/beta/explore/', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
window.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
window.fetch = () => Promise.reject(new Error('offline'));
window.eval(fs.readFileSync(path.join(dir,'explore.js'),'utf8'));
const doc = window.document;
let midSparks = 0, midEmbers = 0;
setTimeout(() => {   // sample mid-burst (~lp 0.2): rays + embers must be alight
  midSparks = Array.from(doc.querySelectorAll('#g-burst line')).filter(l => parseFloat(l.getAttribute('opacity')) > 0.1).length;
  midEmbers = Array.from(doc.querySelectorAll('#g-burst circle')).filter(c => parseFloat(c.getAttribute('opacity')) > 0.3).length;
}, 750);
setTimeout(() => {
  console.log((midSparks >= 10 ? '✓' : '✗') + ' mid-intro: spark rays alight (' + midSparks + ')');
  if (midSparks < 10) fail++;
  console.log((midEmbers >= 10 ? '✓' : '✗') + ' mid-intro: ember heads burning (' + midEmbers + ')');
  if (midEmbers < 10) fail++;
  let fail = 0;
  // every L3 label must have finite coords + a font-size (4-branch NaN regression)
  const labels = Array.from(doc.querySelectorAll('#g-nodes .node')).map(g => g.querySelector('text.label')).filter(Boolean);
  const bad = labels.filter(t => !isFinite(parseFloat(t.getAttribute('x'))) || !isFinite(parseFloat(t.getAttribute('y'))));
  console.log((bad.length === 0 ? '✓' : '✗') + ' all node labels have finite coordinates (' + labels.length + ' labels, ' + bad.length + ' bad)');
  if (bad.length) fail++;
  // firecracker burst anatomy: flash + 84 dust + ≥30 ember heads + ≥30 spark rays
  const circles = doc.querySelectorAll('#g-burst circle').length;
  const rays = doc.querySelectorAll('#g-burst line').length;
  console.log((circles >= 115 && rays >= 30 ? '✓' : '✗') + ' firecracker anatomy (' + circles + ' circles, ' + rays + ' spark rays)');
  if (!(circles >= 115 && rays >= 30)) fail++;
  // after the intro every spark + ember is zeroed (no lingering glow / cost)
  const lit = Array.from(doc.querySelectorAll('#g-burst line')).filter(l => parseFloat(l.getAttribute('opacity')) > 0).length;
  console.log((lit === 0 ? '✓' : '✗') + ' all spark rays extinguished post-intro (' + lit + ' lit)');
  if (lit !== 0) fail++;
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
