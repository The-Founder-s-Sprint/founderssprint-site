#!/usr/bin/env node
/* Convergence + L3 booking: load taxonomy.js then explore.js in JSDOM,
   confirm the explorer built from window.FS_TAXONOMY and that detail/mobile
   booking links use ?tier=single&spec=<taxonomy.js slug>, never ?disc=. */
'use strict';
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const site = process.argv[2] || '/sessions/fervent-determined-lovelace/mnt/founderssprint-site';
const exp = site + '/beta/explore';
const taxJs = fs.readFileSync(site + '/beta/taxonomy.js', 'utf8');
const html = fs.readFileSync(exp + '/index.html', 'utf8');
const js = fs.readFileSync(exp + '/explore.js', 'utf8');

function boot(mobile) {
  const dom = new JSDOM(html, { url: 'https://founderssprint.co/beta/explore/', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  window.matchMedia = (q) => ({ matches: mobile && q.includes('max-width: 768px'), addEventListener(){}, removeEventListener(){} });
  window.fetch = () => Promise.reject(new Error('offline'));
  window.eval(taxJs);     // sets window.FS_TAXONOMY (the include)
  window.eval(js);
  return window;
}
let fail = 0; const check = (l,c)=>{ console.log((c?'✓ ':'✗ ')+l); if(!c) fail++; };

// shared slug fn for expectations
const shared = { window: {} }; require('vm').runInNewContext(taxJs, shared);
const T = shared.window.FS_TAXONOMY;

// --- source-level: no ?disc= anywhere; include present ---
check('source: no ?disc= booking links remain', !/\?tier=single&disc=/.test(js) && !/[?&]disc=/.test(js));
check('source: builds from window.FS_TAXONOMY', /window\.FS_TAXONOMY/.test(js) && /buildTaxonomyFromShared/.test(js));
check('index.html includes taxonomy.js before explore.js',
  html.indexOf('taxonomy.js') !== -1 && html.indexOf('taxonomy.js') < html.indexOf('explore.js?v='));

// --- runtime: explorer taxonomy == shared (built from the include) ---
const wd = boot(false);
const exposed = wd.eval('window.__constellation.TAXONOMY');
check('runtime: 5 disciplines built', exposed.length === 5);
const exNames = []; exposed.forEach(d => d.l2.forEach(m => m.l3.forEach(n => exNames.push(n))));
check('runtime: 49 L3 from shared file', exNames.length === 49);
check('runtime: L3 names match shared exactly',
  JSON.stringify(exNames.sort()) === JSON.stringify(T.specialties.map(s=>s.name).sort()));

// --- desktop detail booking: source asserts the L3 spec handler ---
check('desktop: d-book uses ?tier=single&spec=' + 'specSlug(detailCurrentNode.name)',
  /\.\.\/book\/\?tier=single&spec=' \+ specSlug\(detailCurrentNode\.name\)/.test(js));
check('desktop: cohort format → ?tier=cohort', /detailSelectedFormat === 'cohort'[\s\S]{0,80}\?tier=cohort/.test(js));
check('desktop: detail spec-note framing present', /d-spec-note[\s\S]{0,120}deep-dive/.test(js));

setTimeout(() => {
  {
    // --- mobile specialty link uses spec slug with &→and ---
    const wm = boot(true);
    wm.location.hash = '#finance/cash-flow-management';
    wm.dispatchEvent(new wm.Event('hashchange'));
    const md = wm.document.getElementById('m-discover');
    const book = md.querySelector('.md-book').getAttribute('href');
    check('mobile: Cash Flow Mgmt → ?tier=single&spec=cash-flow-management (' + book + ')',
      book === '../book/?tier=single&spec=' + T.slugify('Cash Flow Management'));
    check('mobile: cohort link = ?tier=cohort', md.querySelector('.md-cohort').getAttribute('href') === '../book/?tier=cohort');
    check('mobile: spec-note framing present', /md-spec-note/.test(md.innerHTML) && /deep-dive/.test(md.innerHTML));

    // ampersand specialty: nav uses the internal HASH slug (no &→and),
    // but the booking link must use the &→and spec slug — proves the two
    // slug domains stay distinct and correct end-to-end.
    const hashSlug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    wm.location.hash = '#marketing/' + hashSlug('SEO & Discoverability');   // seo-discoverability
    wm.dispatchEvent(new wm.Event('hashchange'));
    const md2 = wm.document.getElementById('m-discover');
    const seo = md2.querySelector('.md-book') ? md2.querySelector('.md-book').getAttribute('href') : '(no specialty)';
    check('mobile: SEO & Discoverability — hash nav → booking spec slug (' + seo + ')',
      seo === '../book/?tier=single&spec=' + T.slugify('SEO & Discoverability'));   // seo-and-discoverability

    console.log(fail ? `\n${fail} FAILURE(S)` : '\nALL PASS');
    process.exit(fail ? 1 : 0);
  }
}, 4600);
