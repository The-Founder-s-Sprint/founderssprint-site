'use strict';
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const dir = process.argv[2];
function boot(mobile) {
  const dom = new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'), { url:'https://founderssprint.co/beta/explore/', runScripts:'outside-only', pretendToBeVisual:true });
  const { window } = dom;
  window.matchMedia = (q) => ({ matches: mobile && q.includes('max-width: 768px'), addEventListener(){}, removeEventListener(){} });
  window.fetch = () => Promise.reject(new Error('offline'));
  window.eval(fs.readFileSync(path.join(dir,'explore.js'),'utf8'));
  return window;
}
let fail = 0; const check = (l,c)=>{ console.log((c?'✓ ':'✗ ')+l); if(!c) fail++; };

// Mobile: geo strip + coverage annotation
const wm = boot(true);
const md = wm.document.getElementById('m-discover');
const input = wm.document.getElementById('md-input');
input.value = 'best marketing strategy for reaching customers in lusaka zambia';
input.dispatchEvent(new wm.Event('input'));
const strip = md.querySelector('.md-geo');
check('mobile: geo strip names Zambia · SADC', strip && /Zambia/.test(strip.textContent) && /SADC/.test(strip.textContent));
check('mobile: fallback note (no SADC coach yet)', strip && /joining as we expand/.test(strip.textContent));
const names = Array.from(md.querySelectorAll('.md-result-name')).map(e => e.textContent);
check('mobile: Market Entry surfaced for Lusaka query (geo boost)', names.slice(0,5).includes('Market Entry'));

input.value = 'cash flow help in kampala';
input.dispatchEvent(new wm.Event('input'));
const sub = md.querySelector('.md-result-sub');
check('mobile: EAC coverage annotated for Kampala query', sub && /covers (Uganda|East Africa)/.test(sub.textContent));

// Desktop: s-geo strip + coverage note in rows
const wd = boot(false);
const dd = wd.document;
dd.querySelector('.center-hit').dispatchEvent(new wd.MouseEvent('click', { bubbles: true }));
const di = dd.getElementById('search-input');
di.value = 'expand to lusaka';
di.dispatchEvent(new wd.Event('input'));
const sgeo = dd.querySelector('#search-list .s-geo');
check('desktop: geo strip rendered for Lusaka', sgeo && /Zambia/.test(sgeo.textContent));
di.value = 'expand to kampala';
di.dispatchEvent(new wd.Event('input'));
const ssub = dd.querySelector('#search-list .s-item .s-sub');
check('desktop: EAC coverage note for Kampala', ssub && /covers (Uganda|East Africa)/.test(ssub.textContent));

// --- THE EXPANSION CONTRACT: add a future Zambian coach (data only,
//     zero engine changes) and verify geo resolution picks her up. ---
const wz = boot(false);
const COACHES_LIVE = wz.eval('window.__constellation.COACHES');
COACHES_LIVE.push({
  id: 'chipo-mwansa', name: 'Chipo Mwansa', role: 'Marketing & Branding Coach (Lusaka)',
  photo: null, color: '#c8531f', rating: 4.6, sessions: 12, years: 9, bio: 'Test coach', quotes: [],
  covers: { l1: [0] },                                  // same coverage model
  geo: { base: 'zambia', covers: ['zambia', 'sadc'] },  // the ONLY new-market data needed
});
const dz = wz.document;
dz.querySelector('.center-hit').dispatchEvent(new wz.MouseEvent('click', { bubbles: true }));
const zi = dz.getElementById('search-input');
zi.value = 'reaching customers in lusaka';
zi.dispatchEvent(new wz.Event('input'));
const marketing = Array.from(dz.querySelectorAll('#search-list .s-item .s-sub')).find(s => /Chipo/.test(s.textContent));
check('expansion: new Zambian coach auto-resolved for Lusaka query', !!marketing && /covers Zambia/.test(marketing.textContent));
const zgeo = dz.querySelector('#search-list .s-geo');
check('expansion: fallback note gone once the market is covered', zgeo && !/joining as we expand/.test(zgeo.textContent));
console.log(fail ? fail + ' FAILURE(S)' : 'ALL PASS');
process.exit(fail ? 1 : 0);
