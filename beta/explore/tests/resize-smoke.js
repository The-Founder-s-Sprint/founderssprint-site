#!/usr/bin/env node
/* Breakpoint-crossing smoke test — loads at a phone width, then
   "resizes" to desktop (MQL change) and asserts the constellation
   boots without a reload; then crosses back and asserts the mobile
   card stack still works. Regression test for the frozen-hero bug. */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dir = process.argv[2];
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'explore.js'), 'utf8');

const dom = new JSDOM(html, { url: 'https://founderssprint.co/beta/explore/', runScripts: 'outside-only', pretendToBeVisual: true });
const { window } = dom;

let mobileNow = true;                     // start as a phone
const listeners = [];
window.matchMedia = (q) => {
  const isBp = q.includes('max-width: 768px');
  return {
    get matches() { return isBp ? mobileNow : false; },
    addEventListener(ev, fn) { if (isBp && ev === 'change') listeners.push(fn); },
    addListener(fn) { if (isBp) listeners.push(fn); },
    removeEventListener() {},
  };
};
window.fetch = () => Promise.reject(new Error('offline'));

let failures = 0;
const check = (l, c) => { console.log((c ? '✓ ' : '✗ ') + l); if (!c) failures++; };

window.eval(js);
const doc = window.document;
const md = doc.getElementById('m-discover');
const st = window.__constellation.state;

check('phone load: card stack rendered', md.querySelectorAll('.md-card').length === 5);
check('phone load: constellation NOT booted (loadStarted=0)', st.loadStarted === 0);
check('phone load: breakpoint listener registered', listeners.length >= 1);

// --- "resize" to desktop ---
mobileNow = false;
listeners.forEach(fn => fn());

setTimeout(() => {
  check('cross to desktop: intro started (loadStarted set)', st.loadStarted > 0);
  check('cross to desktop: load progress advancing', st.loadProgress > 0);
  // frame() positions node groups via style.transform (explore.js ~1522), not the SVG attribute
  const anyTransform = Array.from(doc.querySelectorAll('#g-nodes .node')).some(g => (g.style.transform || '').includes('translate'));
  check('cross to desktop: nodes receiving transforms (render loop live)', anyTransform);
}, 600);

setTimeout(() => {
  check('cross to desktop: intro completes (no frozen hero)', st.loadProgress >= 1);

  // --- cross back to phone ---
  mobileNow = true;
  listeners.forEach(fn => fn());
  window.location.hash = '#finance/cash-flow-management';
  window.dispatchEvent(new window.Event('hashchange'));
  check('cross back to phone: deep link renders specialty', /Cash Flow Management/.test(md.querySelector('.md-title').textContent));
  check('cross back to phone: coach card is Barry', /Barry Wojega/.test(md.querySelector('.md-cc-name').textContent));

  // --- and forward to desktop once more (boot is idempotent) ---
  mobileNow = false;
  listeners.forEach(fn => fn());
  setTimeout(() => {
    check('second crossing: render loop resumes without re-intro', st.loadProgress >= 1);
    console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS');
    process.exit(failures ? 1 : 0);
  }, 400);
}, 4600);
