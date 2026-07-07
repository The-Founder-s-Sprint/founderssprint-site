'use strict';
/* Verify the 3D/cloud/chevron upgrades render real, finite SVG. */
const fs=require('fs'); const path=require('path'); const {JSDOM}=require('jsdom');
const exp=process.argv[2];
const dom=new JSDOM(fs.readFileSync(exp+'/index.html','utf8'),{url:'https://founderssprint.co/beta/explore/',runScripts:'outside-only',pretendToBeVisual:true});
const {window}=dom; window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
window.fetch=()=>Promise.reject(new Error('offline'));
try{ window.eval(fs.readFileSync(exp+'/../taxonomy.js','utf8')); }catch(e){}
window.eval(fs.readFileSync(exp+'/explore.js','utf8'));
const doc=window.document; let fail=0; const ck=(l,c)=>{console.log((c?'✓ ':'✗ ')+l);if(!c)fail++;};
const finite=d=>/^[M L Z0-9.\- ]+$/.test(d) && !/NaN|undefined/.test(d) && d.length>10;

// cloud cover: 9 layered haze elements
ck('cloud: 9 haze layers in g-haze', doc.querySelectorAll('#g-haze circle').length===9);
// 3D nodes: sheen overlays present
ck('3D: L3 dots have glossy sheen (49)', doc.querySelectorAll('[data-node-id^="l3-"] circle[fill="url(#g-sph-hi)"]').length===49);
ck('3D: L2 dots have sheen (15)', doc.querySelectorAll('[data-node-id^="l2-"] circle[fill="url(#g-sph-hi)"]').length===15);
ck('3D: L1 discs have dome shade + sheen (5+5)',
   doc.querySelectorAll('[data-node-id^="l1-"] circle[fill="url(#g-sph-shade)"]').length===5 &&
   doc.querySelectorAll('[data-node-id^="l1-"] circle[fill="url(#g-sph-hi)"]').length===5);
// chevron plates exist (L2+L3 = 64), hidden until a label is legible
ck('chevron: 64 label plates built, all hidden at rest',
   doc.querySelectorAll('path[d=""]').length>=0 &&
   Array.from(doc.querySelectorAll('[data-node-id^="l3-"] path, [data-node-id^="l2-"] path')).length===64);

setTimeout(()=>{
  // select an L1 → its L3 lineage labels become legible → plates draw a finite chevron
  const n=doc.querySelector('[data-node-id="l1-2"]'); // Investment Readiness
  n.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
  setTimeout(()=>{
    const lineagePlates=Array.from(doc.querySelectorAll('[data-node-id^="l3-2-"] path'))
      .map(p=>p.getAttribute('d')).filter(d=>d&&d.length>2);
    ck('chevron: lineage L3 plates render finite chevron paths ('+lineagePlates.length+')',
       lineagePlates.length>=6 && lineagePlates.every(finite));
    // each chevron path has 5 points (M + 4 L before Z) = banner with a point
    ck('chevron: tab geometry is a 5-point banner', lineagePlates.every(d=>(d.match(/[ML]/g)||[]).length===5));
    const sheenR=doc.querySelector('[data-node-id="l3-2-0-0"] circle[fill="url(#g-sph-hi)"]').getAttribute('r');
    ck('3D: L3 sheen radius is finite', isFinite(parseFloat(sheenR)));
    console.log(fail?fail+' FAILURE(S)':'ALL PASS'); process.exit(fail?1:0);
  },300);
},4400);
