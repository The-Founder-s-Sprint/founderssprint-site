'use strict';
/* No-widow rule (DESIGN.md): dynamic CTAs/links glue " →" with nbsp; the
   book button + track CTAs are two-line; prose blocks glue the last pair. */
const fs=require('fs'); const {JSDOM}=require('jsdom');
const exp=process.argv[2];
const js=fs.readFileSync(exp+'/explore.js','utf8');
let fail=0; const ck=(l,c)=>{console.log((c?'✓ ':'✗ ')+l);if(!c)fail++;};

ck('source: zero breakable " →" left in explore.js', !/ →/.test(js));
ck('source: noWidow glues last word pair (nbsp)', /function noWidow/.test(js) && / /.test(js));
ck('source: track CTA is two-line (cta-l1 title / cta-l2 "Pick 3")', /cta-l1">' \+ noWidow\('Take the '/.test(js) && /cta-l2">Pick 3 →/.test(js));
ck('source: cohort CTA is two-line', /cta-l1">Take the whole discipline<\/span><span class="cta-l2">Full Cohort →/.test(js));
ck('source: prose blocks pass through noWidow (desc/bios/quotes)',
   /noWidow\(desc\)/.test(js) && /noWidow\(coach\.bio\)/.test(js) && /noWidow\(escH\(t\.testimonial\)\)/.test(js));

const dom=new JSDOM(fs.readFileSync(exp+'/index.html','utf8'),{url:'https://founderssprint.co/beta/explore/',runScripts:'outside-only',pretendToBeVisual:true});
const {window}=dom;
window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
window.fetch=()=>Promise.reject(new Error('offline'));
try{ window.eval(fs.readFileSync(exp+'/../taxonomy.js','utf8')); }catch(e){}
window.eval(js);
setTimeout(()=>{
  const doc=window.document;
  const node=doc.querySelector('[data-node-id="l3-1-0-0"]');
  node.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
  setTimeout(()=>{
    const btn=doc.querySelector('.d-book');
    ck('runtime: 1:1 book button is two-line, arrow glued',
       !!btn.querySelector('.cta-l1') && / →$/.test(btn.querySelector('.cta-l2').textContent));
    const desc=doc.querySelector('.d-desc').textContent;
    ck('runtime: d-desc last word pair glued', / [^ ]+$/.test(desc));
    console.log(fail?fail+' FAILURE(S)':'ALL PASS'); process.exit(fail?1:0);
  },800);
},4400);
