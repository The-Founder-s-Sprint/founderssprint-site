#!/usr/bin/env node
/* Search persistence — "remember once, then forget":
   type → close → reopen restores ONCE → close without typing →
   reopen starts clean. Fresh typing re-arms a single restore. */
'use strict';
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const dir = process.argv[2];
const dom = new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'), { url:'https://founderssprint.co/beta/explore/', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
window.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
window.fetch = () => Promise.reject(new Error('offline'));
const src = fs.readFileSync(path.join(dir,'explore.js'),'utf8');
window.eval(src);
const doc = window.document;
let fail = 0; const check = (l,c)=>{ console.log((c?'✓ ':'✗ ')+l); if(!c) fail++; };
const hit = doc.querySelector('.center-hit');
const input = doc.getElementById('search-input');
const open = () => hit.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const close = () => doc.getElementById('search-close').click();
const type = (q) => { input.value = q; input.dispatchEvent(new window.Event('input')); };

// Session 1: type and close
open(); type('pitch deck');
check('1: results render for typed query', doc.querySelectorAll('#search-list .s-item').length > 0);
close();
check('1: match-dim cleared on close', window.__constellation.state.searchQuery === '');
// Session 2: restored once
open();
check('2: last query restored on FIRST reopen', input.value === 'pitch deck');
check('2: results re-rendered', doc.querySelectorAll('#search-list .s-item').length > 0);
close();   // nothing typed this session
// Session 3: forgotten
open();
check('3: reopen WITHOUT new typing starts clean', input.value === '');
close();
// Session 4: fresh typing re-arms a single restore
open(); type('runway'); close();
open();
check('4: fresh typing re-arms one restore', input.value === 'runway');
close();
open();
check('5: …which is again spent after one use', input.value === '');
check('source: idle close is 30s', /setTimeout\(closeSearch, 30000\)/.test(src));
check('source: auto-reset guarded by searchOpen', /&& !searchOpen\)/.test(src));
console.log(fail ? fail + ' FAILURE(S)' : 'ALL PASS');
process.exit(fail ? 1 : 0);
