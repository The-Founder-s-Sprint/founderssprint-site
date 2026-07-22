'use strict';
/* Explore promo banner: renders via ?promo=preview into #fs-promo (below the
   hero, never over the fixed nav), CTA → /beta/book/?tier=single; renders
   NOTHING without the param before 1 Aug. */
const fs=require('fs'); const {JSDOM}=require('jsdom');
const site=process.argv[2];
const html=fs.readFileSync(site+'/beta/explore/index.html','utf8');
const promoJs=fs.readFileSync(site+'/promo.js','utf8');
let fail=0; const ck=(l,c)=>{console.log((c?'✓ ':'✗ ')+l);if(!c)fail++;};

function boot(qs){
  const dom=new JSDOM(html,{url:'https://founderssprint.co/beta/explore/'+qs,runScripts:'outside-only',pretendToBeVisual:true});
  const {window}=dom;
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  window.fetch=()=>Promise.reject(new Error('offline'));
  window.eval(promoJs);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded',{bubbles:true}));
  return window;
}

// source: include order + single mount below the hero
ck('source: promo.js loads before site-chrome.js',
   html.indexOf('/promo.js?v=1') !== -1 && html.indexOf('/promo.js?v=1') < html.indexOf('/site-chrome.js?v=9'));
ck('source: ONE #fs-promo mount', (html.match(/id="fs-promo"/g)||[]).length === 1);
ck('source: mount sits below the constellation hero (not top of body)',
   html.indexOf('id="fs-promo"') > html.indexOf('constellation-hero') &&
   html.indexOf('id="fs-promo"') < html.indexOf('<section class="directory"'));
ck('source: CTA → /beta/book/?tier=single', /data-promo-cta="\/beta\/book\/\?tier=single"/.test(html));
ck('source: no coaching price on Explore → no data-promo-tier tags (correct)', !/data-promo-tier/.test(html));

// runtime: preview forces ON
const on=boot('?promo=preview');
const mount=on.document.getElementById('fs-promo');
ck('preview: banner rendered into mount', mount.innerHTML.length > 40);
ck('preview: FS_PROMO.active() === true', on.eval('window.FS_PROMO.active()') === true);
const cta=mount.querySelector('a[href*="book"]');
ck('preview: Book CTA present → /beta/book/?tier=single', !!cta && cta.getAttribute('href').indexOf('/beta/book/?tier=single') === 0);
ck('preview: mount is in normal flow after the hero (no nav overlap)',
   mount.compareDocumentPosition(on.document.getElementById('constellation-hero')) & 2 /* hero precedes mount */);

// runtime: today (pre-1 Aug), no param → nothing
const off=boot('');
ck('today: nothing renders without ?promo=preview', off.document.getElementById('fs-promo').innerHTML === '');
ck('today: API still exists (FS_PROMO defined)', off.eval('typeof window.FS_PROMO') === 'object');
// runtime: explicit off
const forced=boot('?promo=off');
ck('?promo=off: forces nothing', forced.document.getElementById('fs-promo').innerHTML === '');

console.log(fail?fail+' FAILURE(S)':'ALL PASS'); process.exit(fail?1:0);
