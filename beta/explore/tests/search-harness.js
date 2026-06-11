#!/usr/bin/env node
/* ============================================================
   Search-matcher test harness for explore.js
   Extracts TAXONOMY / DISCIPLINE_KEYWORDS / L3_KEYWORDS / L3_DESC /
   COACHES from the engine source, replicates buildSearchHaystack +
   scoreNode + searchMatches exactly, and runs a battery of realistic
   founder queries asserting the expected node lands top-1 / top-3.
   Usage: node search-harness.js /path/to/explore.js [--verbose]
   ============================================================ */
'use strict';
const fs = require('fs');
const vm = require('vm');

const srcPath = process.argv[2];
const verbose = process.argv.includes('--verbose');
if (!srcPath) { console.error('usage: node search-harness.js <explore.js> [--verbose]'); process.exit(2); }
const src = fs.readFileSync(srcPath, 'utf8');

// ---- Extract top-level const blocks (file uses 2-space indent; blocks close with "  ];" or "  };") ----
function extractBlock(name) {
  const startRe = new RegExp('^  const ' + name + '\\s*=\\s*[\\[{]', 'm');
  const m = src.match(startRe);
  if (!m) throw new Error('Could not find const ' + name);
  const start = m.index;
  const closeRe = /^  [\]}];/m;
  const rest = src.slice(start);
  const close = rest.match(closeRe);
  if (!close) throw new Error('Could not find end of const ' + name);
  return rest.slice(0, close.index + close[0].length);
}

const ctx = {};
vm.createContext(ctx);
for (const name of ['COACHES', 'TAXONOMY', 'L3_DESC', 'DISCIPLINE_KEYWORDS', 'L3_KEYWORDS']) {
  vm.runInContext(extractBlock(name).replace('const ', 'globalThis.'), ctx);
}
const { COACHES, TAXONOMY, L3_DESC, DISCIPLINE_KEYWORDS, L3_KEYWORDS } = ctx;

// ---- Replicate resolveCoach (verbatim contract) ----
function resolveCoach(l1Idx, l2Idx, l3Idx) {
  let bestCoach = null, bestSpecificity = -1;
  for (const c of COACHES) {
    const cov = c.covers;
    if (cov.l3 && cov.l3.some(t => t[0] === l1Idx && t[1] === l2Idx && t[2] === l3Idx)) {
      if (3 > bestSpecificity) { bestCoach = c; bestSpecificity = 3; }
    }
    if (cov.l2 && cov.l2.some(t => t[0] === l1Idx && t[1] === l2Idx)) {
      if (2 > bestSpecificity) { bestCoach = c; bestSpecificity = 2; }
    }
    if (cov.l1 && cov.l1.includes(l1Idx)) {
      if (1 > bestSpecificity) { bestCoach = c; bestSpecificity = 1; }
    }
  }
  return bestCoach;
}

// ---- Replicate buildNodes (search-relevant fields only) ----
const NODES = [];
TAXONOMY.forEach((d, i) => {
  const c1 = resolveCoach(i);
  NODES.push({ id: `l1-${i}`, level: 1, l1Idx: i, name: d.l1,
    coach: c1 ? c1.name : '', coachRole: c1 ? c1.role : '' });
  d.l2.forEach((sub, j) => {
    const c2 = resolveCoach(i, j);
    NODES.push({ id: `l2-${i}-${j}`, level: 2, l1Idx: i, l2Idx: j, name: sub.name,
      parentName: d.l1, coach: c2 ? c2.name : '', coachRole: c2 ? c2.role : '' });
    sub.l3.forEach((spec, k) => {
      const c3 = resolveCoach(i, j, k);
      NODES.push({ id: `l3-${i}-${j}-${k}`, level: 3, l1Idx: i, l2Idx: j, l3Idx: k, name: spec,
        parentName: sub.name, grandparentName: d.l1, coach: c3 ? c3.name : '', coachRole: c3 ? c3.role : '' });
    });
  });
});

// ---- Replicate matcher (verbatim from explore.js) ----
const HAYSTACK_CACHE = new Map();
function buildSearchHaystack(n) {
  if (HAYSTACK_CACHE.has(n.id)) return HAYSTACK_CACHE.get(n.id);
  const parts = [
    n.name, n.parentName || '', n.grandparentName || '',
    n.coach || '', n.coachRole || '', DISCIPLINE_KEYWORDS[n.l1Idx] || '',
  ];
  if (n.level === 3 && L3_DESC[n.name]) parts.push(L3_DESC[n.name]);
  if (n.level === 3 && L3_KEYWORDS[n.name]) parts.push(L3_KEYWORDS[n.name]);
  const hay = parts.join(' ').toLowerCase();
  HAYSTACK_CACHE.set(n.id, hay);
  return hay;
}
const STOP = new Set("a an the of for to in into onto from out up down off no not as so if then than there here this that these those it its is are be been being am im i we us you your my me our my mine can could should would will shall do does did done how what when where which who whom why whose need needs want wants help about please very most some any all just like with without and or but".split(/\s+/));
function tokenize(str){ return (String(str).toLowerCase().match(/[a-z0-9&+]+/g) || []); }
const TOKENSET_CACHE = new Map();
function nodeTokens(n){
  if (TOKENSET_CACHE.has(n.id)) return TOKENSET_CACHE.get(n.id);
  const set = new Set(tokenize(buildSearchHaystack(n)));
  TOKENSET_CACHE.set(n.id, set);
  return set;
}
function scoreNode(n, qTokens, rawQ){
  const name = n.name.toLowerCase();
  const hay  = buildSearchHaystack(n);
  const toks = nodeTokens(n);
  let score = 0, hits = 0;
  for (const t of qTokens){
    let s = 0;
    if (name.includes(t)) s = 6;
    else if (toks.has(t)) s = 3;
    else if (t.length >= 3){
      let pref = false;
      for (const tok of toks){ if (tok.startsWith(t)){ pref = true; break; } }
      if (pref) s = 1.6;
      else if (hay.includes(t)) s = 1.0;
    }
    if (s > 0){ score += s; hits++; }
  }
  if (hits === 0) return 0;
  if (rawQ.length >= 4 && hay.includes(rawQ)) score += 5;
  if (qTokens.length >= 2 && hay.includes(qTokens.join(' '))) score += 4;
  score += hits * 0.6;
  score += (n.level === 3 ? 0.7 : n.level === 2 ? 0.3 : 0);
  return score;
}
function searchMatches(query) {
  const rawQ = String(query).trim().toLowerCase();   // mirrors searchInpt handler
  if (!rawQ) return [];
  let qTokens = tokenize(rawQ).filter(t => t.length >= 2 && !STOP.has(t));
  if (qTokens.length === 0) qTokens = tokenize(rawQ).filter(t => t.length >= 2);
  if (qTokens.length === 0) return [];
  const scored = [];
  NODES.forEach(n => { const sc = scoreNode(n, qTokens, rawQ); if (sc > 0) scored.push({ n, sc }); });
  scored.sort((a, b) => b.sc - a.sc || (b.n.level - a.n.level) || a.n.name.localeCompare(b.n.name));
  return scored.slice(0, 8).map(x => x.n);
}

// ---- Query battery: [query, acceptable expected node name(s)] ----
// Mix: natural language, EA-specific (URA/NSSF/URSB/MoMo), acronyms, tool names, plain topics.
const QUERIES = [
  // Marketing & Branding
  ['how do we stand out from competitors', ['Brand Positioning']],
  ['tagline for my startup', ['Messaging Architecture']],
  ['nobody understands what we do', ['Messaging Architecture']],
  ['need a new logo', ['Visual Identity']],
  ['brand guidelines', ['Visual Identity']],
  ['expand to kenya', ['Market Entry']],
  ['which channels should i use to get customers', ['Channel Mix']],
  ['whatsapp marketing', ['Channel Mix']],
  ['launch plan for my product', ['Launch Sequencing']],
  ['what should i post on social media', ['Content Strategy']],
  ['rank higher on google', ['SEO & Discoverability']],
  ['get cited by chatgpt', ['SEO & Discoverability']],
  ['customer interviews', ['Customer Research']],
  ['mom test', ['Customer Research', 'Problem Validation']],
  // Financial Modelling
  ['cac', ['CAC & LTV']],
  ['ltv to cac ratio', ['CAC & LTV']],
  ['how long until i break even', ['Payback Period']],
  ['gross margin per unit', ['Contribution Margin']],
  ['losing money on every sale', ['Contribution Margin']],
  ['revenue forecast', ['Revenue Forecasting']],
  ['running out of money', ['Burn Rate & Runway']],
  ['how many months of runway', ['Burn Rate & Runway']],
  ['clients not paying invoices', ['Cash Flow Management']],
  ['how much is my company worth', ['Valuation Methods']],
  ['cap table', ['Cap Table Design']],
  ['liquidation preference', ['Term Sheet Analysis']],
  ['ura vat returns', ['Tax & Compliance']],
  ['do i need to register for vat', ['Tax & Compliance']],
  ['efris', ['Tax & Compliance']],
  // Investment Readiness
  ['pitch deck', ['Pitch Deck Structure']],
  ['my deck is too long', ['Pitch Deck Structure']],
  ['why now slide', ['Investor Narrative']],
  ['one pager for investors', ['Executive Summary']],
  ['which investors should i target', ['Investor Targeting']],
  ['angel investors in uganda', ['Investor Targeting']],
  ['due diligence checklist', ['Due Diligence Prep']],
  ['set up a data room', ['Data Room']],
  ['friends and family round', ['Pre-seed Rounds']],
  ['raising a seed round', ['Seed Rounds']],
  ['non dilutive funding', ['Grants & DFIs']],
  ['mastercard foundation grant', ['Grants & DFIs']],
  // Strategy & Team Building
  ['tam sam som', ['Market Analysis']],
  ['who are my competitors', ['Market Analysis']],
  ['competitive moat', ['Positioning & Moats']],
  ['what if it all goes wrong', ['Scenario Planning']],
  ['who should i hire first', ['Hiring Strategy']],
  ['people keep quitting', ['Culture Design']],
  ['org chart', ['Org Structure']],
  ['write an sop', ['Process Design']],
  ['okrs', ['OKRs & KPIs']],
  ['north star metric', ['OKRs & KPIs']],
  ['analysis paralysis', ['Decision Frameworks']],
  ['register a company in uganda', ['Legal & Registration']],
  ['ursb', ['Legal & Registration']],
  ['nssf registration', ['Payroll & HR Compliance']],
  ['how to run payroll', ['Payroll & HR Compliance']],
  ['paye', ['Tax & Compliance', 'Payroll & HR Compliance']],
  // Product Dev & Pricing
  ['is this a real problem', ['Problem Validation']],
  ['nobody wants my product', ['Problem Validation']],
  ['test my prototype with users', ['Solution Testing']],
  ['do i have product market fit', ['PMF Signals']],
  ['mvp', ['MVP Design']],
  ['what to build first', ['MVP Design', 'Roadmapping']],
  ['product roadmap', ['Roadmapping']],
  ['ship faster', ['Iteration Cycles']],
  ['how much should i charge', ['Value-Based Pricing']],
  ['saas pricing tiers', ['Value-Based Pricing']],
  ['competitors are cheaper than us', ['Competitive Pricing']],
  ['test a price increase', ['Price Testing']],
  ['mtn momo integration', ['Payments & Mobile Money']],
  ['accept mobile money payments', ['Payments & Mobile Money']],
  ['flutterwave', ['Payments & Mobile Money']],
];

// ---- Run ----
let top1 = 0, top3 = 0, miss = [];
for (const [q, accept] of QUERIES) {
  const res = searchMatches(q).map(n => n.name);
  const i = res.findIndex(name => accept.includes(name));
  if (i === 0) top1++;
  if (i >= 0 && i < 3) top3++;
  else miss.push({ q, accept, got: res.slice(0, 3) });
  if (verbose) console.log(`${i === 0 ? '✓' : i > 0 && i < 3 ? '~' : '✗'} "${q}" → [${res.slice(0,3).join(' | ')}] (want ${accept.join('/')})`);
}
const n = QUERIES.length;
console.log('\n========================================');
console.log(`Queries: ${n}`);
console.log(`Top-1:   ${top1}/${n}  (${(100*top1/n).toFixed(1)}%)`);
console.log(`Top-3:   ${top3}/${n}  (${(100*top3/n).toFixed(1)}%)`);
console.log(`Nodes:   ${NODES.length} (L3: ${NODES.filter(x=>x.level===3).length})`);
if (miss.length) {
  console.log('\nTop-3 misses:');
  miss.forEach(m => console.log(`  ✗ "${m.q}" want ${m.accept.join('/')} got [${m.got.join(' | ')}]`));
}
process.exit(miss.length ? 1 : 0);
