'use strict';
/* Search spotlight regression — multi-word queries must keep matching
   L3 nodes lit and only dim the non-matches (old verbatim-substring
   check hid every label for phrases like "south african"). */
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const dir = process.argv[2];
const dom = new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'), { url:'https://founderssprint.co/beta/explore/', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
window.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
window.fetch = () => Promise.reject(new Error('offline'));
window.eval(fs.readFileSync(path.join(dir,'explore.js'),'utf8'));
const doc = window.document;
let fail = 0; const check = (l,c)=>{ console.log((c?'✓ ':'✗ ')+l); if(!c) fail++; };
const opacity = id => parseFloat(doc.querySelector('[data-node-id="'+id+'"]').style.opacity);
setTimeout(() => {
  doc.querySelector('.center-hit').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const input = doc.getElementById('search-input');
  input.value = 'marketing to south african customers';
  input.dispatchEvent(new window.Event('input'));
  setTimeout(() => {
    // Market Entry = l3-0-1-0 (Marketing & Branding → Go-to-Market → Market Entry)
    check('matched node stays lit (Market Entry ≥ 0.5)', opacity('l3-0-1-0') >= 0.5);
    check('non-matching node dims (Term Sheet Analysis ≤ 0.1)', opacity('l3-1-2-2') <= 0.1);
    const lit = Array.from(doc.querySelectorAll('#g-nodes .node')).filter(g => parseFloat(g.style.opacity) >= 0.5).length;
    check('only a focused subset stays lit (not all 69, not 0) — ' + lit, lit > 0 && lit < 30);
    doc.getElementById('search-close').click();
    setTimeout(() => {
      check('closing search restores the field (Term Sheet back ≥ 0.3)', opacity('l3-1-2-2') >= 0.3);
      console.log(fail ? fail + ' FAILURE(S)' : 'ALL PASS');
      process.exit(fail ? 1 : 0);
    }, 300);
  }, 300);
}, 4200);
