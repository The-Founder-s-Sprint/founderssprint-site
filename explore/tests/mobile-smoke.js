#!/usr/bin/env node
/* Mobile discovery smoke test — boots index.html + explore.js in jsdom
   with a phone matchMedia, walks the card stack, search, and deep links. */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dir = process.argv[2];
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'explore.js'), 'utf8');

const dom = new JSDOM(html, { url: 'https://founderssprint.co/beta/explore/', runScripts: 'outside-only', pretendToBeVisual: true });
const { window } = dom;
window.matchMedia = (q) => ({
  matches: q.includes('max-width: 768px'),     // phone; reduced-motion=false
  addEventListener() {}, removeEventListener() {},
});
window.fetch = () => Promise.reject(new Error('offline'));

let failures = 0;
function check(label, cond) {
  console.log((cond ? '✓ ' : '✗ ') + label);
  if (!cond) failures++;
}
function fireHash(hash) {
  window.location.hash = hash;
  window.dispatchEvent(new window.Event('hashchange'));
}

window.eval(js);
const doc = window.document;
const md = doc.getElementById('m-discover');

// --- Home view ---
check('home: 5 discipline cards', md.querySelectorAll('.md-card').length === 5);
check('home: search input present (16px iOS rule is CSS)', !!doc.getElementById('md-input'));
check('home: popular chips rendered', md.querySelectorAll('.md-chip').length === 6);
check('home: constellation render loop NOT started', window.__constellation.state.loadStarted === 0);
const card = md.querySelector('.md-card[data-l1="3"]');
check('home: strategy card shows coach + 11 specialties', card && /Moses/.test(card.textContent) && /11 specialties/.test(card.textContent));

// --- L1 → L2 (discipline view) ---
fireHash('#strategy');
check('discipline: 3 L2 groups for Strategy', md.querySelectorAll('.md-group').length === 3);
check('discipline: 11 specialty rows (variable branch sizes honoured)', md.querySelectorAll('.md-row').length === 11);
check('discipline: coach strip shows Moses', /Moses Engwau Okudu/.test(md.querySelector('.md-coach-strip').textContent));
const legalRow = Array.from(md.querySelectorAll('.md-row')).find(r => /Legal & Registration/.test(r.textContent));
check('discipline: Legal & Registration row present', !!legalRow);

// --- L2 → L3 (specialty/coach view) via tap ---
legalRow.click();
window.dispatchEvent(new window.Event('hashchange'));
check('specialty: hash deep link is #strategy/legal-registration', window.location.hash === '#strategy/legal-registration');
check('specialty: title + desc rendered', /Legal & Registration/.test(md.querySelector('.md-title').textContent) && /URSB/.test(md.querySelector('.md-desc').textContent));
check('specialty: resolved coach card (Moses via L1 coverage)', /Moses Engwau Okudu/.test(md.querySelector('.md-cc-name').textContent));
check('specialty: book CTA → ../book/?tier=single&disc=strategy', md.querySelector('.md-book').getAttribute('href') === '../book/?tier=single&disc=strategy');
check('specialty: cohort CTA present', !!md.querySelector('.md-cohort'));
const wa = md.querySelector('.md-share').getAttribute('href');
check('specialty: WhatsApp share carries deep link', wa.startsWith('https://wa.me/?text=') && decodeURIComponent(wa).includes('#strategy/legal-registration'));
check('specialty: testimonial empty state (offline fetch caught)', /No founder testimonials yet/.test(md.querySelector('#md-quotes').textContent));
check('specialty: pre-targeted testify CTA', md.querySelector('.md-testify').getAttribute('href') === '/share-testimonial.html?for=moses-okudu');

// --- Back navigation ---
md.querySelector('.md-back').click();
window.dispatchEvent(new window.Event('hashchange'));
check('back: returns to discipline view', md.querySelectorAll('.md-group').length === 3);

// --- Search flow (home) ---
fireHash('');
const input = doc.getElementById('md-input');
input.value = 'mtn momo integration';
input.dispatchEvent(new window.Event('input'));
const first = md.querySelector('.md-result');
check('search: top result is Payments & Mobile Money', first && /Payments & Mobile Money/.test(first.textContent));
first.click();
window.dispatchEvent(new window.Event('hashchange'));
check('search: tap lands on specialty deep link', window.location.hash === '#product/payments-mobile-money');
check('search: coach card is Patrick', /Patrick Ngolobe/.test(md.querySelector('.md-cc-name').textContent));

// --- Direct deep-link load (WhatsApp recipient path) ---
fireHash('#finance/tax-compliance');
check('deep link: #finance/tax-compliance renders Tax & Compliance', /Tax & Compliance/.test(md.querySelector('.md-title').textContent));
check('deep link: URA in description', /URA/.test(md.querySelector('.md-desc').textContent));

// --- Unknown hash falls back to home ---
fireHash('#nonsense');
check('fallback: unknown hash renders home', md.querySelectorAll('.md-card').length === 5);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS');
process.exit(failures ? 1 : 0);
