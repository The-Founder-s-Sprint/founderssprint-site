'use strict';
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const dir = process.argv[2];
const html = fs.readFileSync(path.join(dir,'index.html'),'utf8');
const js = fs.readFileSync(path.join(dir,'explore.js'),'utf8');
const dom = new JSDOM(html, { url:'https://founderssprint.co/beta/explore/#marketing/brand-positioning', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
window.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
window.fetch = () => Promise.reject(new Error('offline'));
window.eval(js);
const doc = window.document;
let fail = 0; const check = (l,c)=>{ console.log((c?'✓ ':'✗ ')+l); if(!c) fail++; };
check('desktop: 69 constellation nodes built', doc.querySelectorAll('#g-nodes .node').length === 69);
check('desktop: connection lines built', doc.querySelectorAll('#g-conns line').length > 60);
check('desktop: mobile section stays empty', doc.getElementById('m-discover').innerHTML === '');
check('desktop: coach directory built (5 items)', doc.querySelectorAll('.dir-item').length === 5);
check('desktop: legend says 50', /50 coaching areas/.test(doc.body.textContent));
// let the intro + deep link play out (LOAD_DURATION_MS=3600 + openDetail delay)
setTimeout(() => {
  const detail = doc.getElementById('detail');
  check('desktop: L3 slug deep link opens detail panel', detail.classList.contains('show'));
  check('desktop: detail shows Brand Positioning', /Brand Positioning/.test(detail.querySelector('.d-name').textContent));
  check('desktop: detail coach is Teddy', /Teddy Ruge/.test(detail.querySelector('.coach-name').textContent));
  console.log(fail ? `\n${fail} FAILURE(S)` : '\nALL PASS');
  process.exit(fail ? 1 : 0);
}, 5200);
