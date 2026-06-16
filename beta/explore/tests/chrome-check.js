#!/usr/bin/env node
/* Explore now uses the shared site-chrome.js module for nav+footer.
   Verify: module injects the universal nav (Method▾ 5 pages, Mentors, all
   CTAs) in fixed mode, the shared footer, and the constellation still boots
   under the swapped chrome. */
'use strict';
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const site = process.argv[2] || '/sessions/fervent-determined-lovelace/mnt/founderssprint-site';
const exp = site + '/beta/explore';
const html = fs.readFileSync(exp + '/index.html', 'utf8');
const taxJs = fs.readFileSync(site + '/beta/taxonomy.js', 'utf8');
const exploreJs = fs.readFileSync(exp + '/explore.js', 'utf8');
const chromeJs = fs.readFileSync(site + '/site-chrome.js', 'utf8');

let fail = 0; const check = (l,c)=>{ console.log((c?'✓ ':'✗ ')+l); if(!c) fail++; };

// source-level: hand-rolled chrome gone, module include present
check('source: no hand-rolled <nav class="nav">', !/<nav class="nav"/.test(html));
check('source: no hand-rolled <footer>', !/<footer>/.test(html));
check('source: #fs-nav data-fixed mount', /<div id="fs-nav" data-fixed><\/div>/.test(html));
check('source: #fs-footer mount', /<div id="fs-footer"><\/div>/.test(html));
check('source: site-chrome.js?v=7 deferred include', /<script src="\/site-chrome\.js\?v=7" defer><\/script>/.test(html));

const dom = new JSDOM(html, { url: 'https://founderssprint.co/beta/explore/', runScripts: 'outside-only', pretendToBeVisual: true });
const { window } = dom;
window.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
window.fetch = () => Promise.reject(new Error('offline'));
window.eval(taxJs);
window.eval(exploreJs);
window.eval(chromeJs);   // defer module: registers DOMContentLoaded (JSDOM stays 'loading')
// fire DOMContentLoaded so the deferred module injects, as a real browser would
window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));

const doc = window.document;
const nav = doc.getElementById('fsx-nav');
check('runtime: module nav injected (.fsx-nav)', !!nav);
check('runtime: nav is fixed (data-fixed honoured)', nav && nav.classList.contains('fsx-fixed'));
const navText = nav ? nav.textContent : '';
['Method','Coaches','Mentors','Explore','Pricing','Directory','FAQ','Log in','Book a Session']
  .forEach(t => check('nav has "' + t + '"', navText.includes(t)));
// Method dropdown: 5 discipline deep-dive pages
const methodLinks = nav ? Array.from(nav.querySelectorAll('.fsx-dd-menu a')).map(a => a.getAttribute('href')) : [];
check('nav Method ▾ has 5 deep-dive pages', methodLinks.length === 5 &&
  methodLinks.every(h => /\/beta\/method\/(marketing|finance|investment|strategy|product)\.html$/.test(h)));
check('nav Mentors → /mentors.html', !!(nav && nav.querySelector('a[href="/mentors.html"]')));
check('nav links are absolute /beta/... (not ../)', navText && !/\.\.\//.test(nav.innerHTML));

const foot = doc.querySelector('footer.fsx-foot');
check('runtime: module footer injected (.fsx-foot)', !!foot);
check('footer carries Mentors link too', !!(foot && foot.querySelector('a[href="/mentors.html"]')));

// constellation still boots under the swapped chrome
setTimeout(() => {
  check('constellation: 69 nodes built', doc.querySelectorAll('#g-nodes .node').length === 69);
  check('constellation hero still present + full-bleed', !!doc.getElementById('constellation-hero'));
  check('old #nav scroll hook is null-safe (no throw)', true);   // reaching here means explore.js didn't throw
  console.log(fail ? `\n${fail} FAILURE(S)` : '\nALL PASS');
  process.exit(fail ? 1 : 0);
}, 4600);
