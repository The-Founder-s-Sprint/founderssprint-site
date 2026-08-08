'use strict';
/* Live cohort wiring: open_cohorts() feeds the directory + detail cohort
   panels; Reserve deep-links carry &cohort=<id>; loading + failure states
   degrade to the bare booking link. */
const fs=require('fs'); const {JSDOM}=require('jsdom');
const exp=process.argv[2];
const html=fs.readFileSync(exp+'/index.html','utf8');
const js=fs.readFileSync(exp+'/explore.js','utf8');
let fail=0; const ck=(l,c)=>{console.log((c?'✓ ':'✗ ')+l);if(!c)fail++;};

const LIVE=[
 {id:6,name:'Cohort 1 · September 2026',quarter:'Launch · 2026',dates:'Sep 7 – Oct 9, 2026',start_date:'2026-09-07',end_date:'2026-10-09',seats_total:12,seats_taken:0,seats_remaining:12,is_full:false},
 {id:7,name:'Cohort 2 · January 2027',quarter:'Q1 · 2027',dates:'Jan 11 – Feb 12, 2027',start_date:'2027-01-11',end_date:'2027-02-12',seats_total:12,seats_taken:12,seats_remaining:0,is_full:true},
 {id:8,name:'Cohort 3 · April 2027',quarter:'Q2 · 2027',dates:'Apr 12 – May 14, 2027',start_date:'2027-04-12',end_date:'2027-05-14',seats_total:12,seats_taken:3,seats_remaining:9,is_full:false},
 {id:9,name:'Cohort 4 · July 2027',quarter:'Q3 · 2027',dates:'Jul 12 – Aug 13, 2027',start_date:'2027-07-12',end_date:'2027-08-13',seats_total:12,seats_taken:0,seats_remaining:12,is_full:false},
 {id:10,name:'Cohort 5 · October 2027',quarter:'Q4 · 2027',dates:'Oct 11 – Nov 12, 2027',start_date:'2027-10-11',end_date:'2027-11-12',seats_total:12,seats_taken:0,seats_remaining:12,is_full:false},
];

function boot(fetchImpl){
  const dom=new JSDOM(html,{url:'https://founderssprint.co/beta/explore/',runScripts:'outside-only',pretendToBeVisual:true});
  const {window}=dom;
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  window.fetch=fetchImpl;
  try{ window.eval(fs.readFileSync(exp+'/../taxonomy.js','utf8')); }catch(e){}
  window.eval(js);
  return window;
}
const rpcOK=url=>{
  if(String(url).indexOf('/db/rest/v1/rpc/open_cohorts')===0)
    return Promise.resolve({ok:true,json:()=>Promise.resolve(LIVE)});
  return Promise.reject(new Error('offline'));   // testimonials etc — irrelevant here
};

// source-level: deep-link strings + no hardcoded cohorts left
ck('source: hardcoded Cohort A/B/C gone', !/Cohort A'|Cohort B'|Cohort C'/.test(js));
ck('source: detail Reserve carries &cohort=<id>', js.includes("'&cohort=' + cid"));
ck('source: directory Reserve carries &cohort=<id>', js.includes("cohort&cohort=' + c.id"));
ck('source: generic CTAs stay bare (picker route)',
   /d-bd-cta" href="\.\.\/book\/\?tier=cohort"/.test(js) && /md-cohort" href="\.\.\/book\/\?tier=cohort"/.test(js));
ck('source: fetches /db/rest/v1/rpc/open_cohorts', js.includes("'/db/rest/v1/rpc/open_cohorts'"));

// runtime: live payload path
const w=boot(rpcOK);
setTimeout(()=>{
  const doc=w.document;
  const rows=doc.querySelectorAll('.dir-item .dir-cohort')[0].querySelectorAll('.dir-avail-row');
  ck('directory: 5 live cohorts render', rows.length===5);
  ck('directory: names + dates from RPC', /Cohort 1 · September 2026/.test(rows[0].textContent) && /Sep 7 – Oct 9, 2026/.test(rows[0].textContent));
  ck('directory: seats from seats_remaining', /12 seats remaining/.test(rows[0].textContent) && /9 seats remaining/.test(rows[2].textContent));
  ck('directory: is_full → disabled Closed row', rows[1].disabled===true && /Closed/.test(rows[1].textContent) && /Full/.test(rows[1].textContent));
  // detail panel cohort format
  const node=doc.querySelector('[data-node-id="l3-1-0-0"]');
  node.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  setTimeout(()=>{
    const cohortRadio=doc.querySelector('input[name="d-format"][value="cohort"]');
    cohortRadio.checked=true; cohortRadio.dispatchEvent(new w.Event('change',{bubbles:true}));
    const slots=doc.querySelectorAll('.d-slots .slot');
    ck('detail: 5 live cohort slots', slots.length===5);
    ck('detail: first open pre-selected, full one disabled', slots[0].classList.contains('selected') && slots[1].disabled===true);
    {
    // Two-line CTA (no-widow rule): line 1 = action, line 2 = cohort + glued arrow
    const l1=doc.querySelector('.d-book .cta-l1'), l2=doc.querySelector('.d-book .cta-l2');
    const l2txt=(l2?l2.textContent:'').replace(/\u00a0/g,' ');
    ck('detail: book button = two-line "Reserve" / cohort label', !!l1 && /Reserve/.test(l1.textContent) && /Cohort 1 · September 2026 →/.test(l2txt));
  }

    // runtime: failure path → honest fallback links
    const wf=boot(()=>Promise.reject(new Error('down')));
    setTimeout(()=>{
      const fb=wf.document.querySelectorAll('.dir-item .dir-cohort')[0].querySelector('.dir-avail-note');
      ck('failure: directory shows "see dates in booking" link', !!fb && fb.tagName==='A' && fb.getAttribute('href')==='../book/?tier=cohort');
      console.log(fail?fail+' FAILURE(S)':'ALL PASS'); process.exit(fail?1:0);
    },250);
  },300);
},400);
