#!/usr/bin/env node
/* Parity: explore.js fallback TAXONOMY must mirror beta/taxonomy.js exactly
   (discipline order+label, L2 names+order, L3 names+order) and every L3 slug
   must equal FS_TAXONOMY.slugify(name). Names are the shared booking contract. */
'use strict';
const fs = require('fs');
const vm = require('vm');

const site = process.argv[2] || '/sessions/fervent-determined-lovelace/mnt/founderssprint-site';
const exploreSrc = fs.readFileSync(site + '/beta/explore/explore.js', 'utf8');

// shared taxonomy
const g = { window: {} };
vm.createContext(g);
vm.runInContext(fs.readFileSync(site + '/beta/taxonomy.js', 'utf8'), g);
const T = g.window.FS_TAXONOMY;

// extract explore.js fallback TAXONOMY const block
function extractBlock(name, src) {
  const m = src.match(new RegExp('^  const ' + name + '\\s*=\\s*\\[', 'm'));
  const start = m.index;
  const rest = src.slice(start);
  const close = rest.match(/^  \];/m);
  return rest.slice(0, close.index + close[0].length);
}
const ctx = {};
vm.createContext(ctx);
vm.runInContext(extractBlock('TAXONOMY_FALLBACK', exploreSrc).replace('const ', 'globalThis.'), ctx);
const EX = ctx.TAXONOMY_FALLBACK;

let fail = 0;
const check = (l, c) => { console.log((c ? '✓ ' : '✗ ') + l); if (!c) fail++; };

check('discipline count 5', EX.length === 5 && T.disciplines.length === 5);
EX.forEach((d, i) => {
  const td = T.disciplines[i];
  check(`L1[${i}] label "${d.l1}" == "${td.label}"`, d.l1 === td.label);
  check(`L1[${i}] color ${d.color} == ${td.color}`, d.color.toLowerCase() === td.color.toLowerCase());
  check(`L1[${i}] L2 count`, d.l2.length === td.l2.length);
  d.l2.forEach((m, j) => {
    const tm = td.l2[j];
    check(`  L2[${i}.${j}] name "${m.name}" == "${tm.name}"`, m.name === tm.name);
    check(`  L2[${i}.${j}] L3 names exact`, JSON.stringify(m.l3) === JSON.stringify(tm.l3));
  });
});

// every L3 in explore → valid slug in shared catalogue
const exNames = [];
EX.forEach(d => d.l2.forEach(m => m.l3.forEach(n => exNames.push(n))));
check('explore L3 count == 49', exNames.length === 49);
let slugMiss = [];
exNames.forEach(n => { if (!T.get(T.slugify(n))) slugMiss.push(n); });
check('every explore L3 resolves via taxonomy.js slug+get', slugMiss.length === 0);
if (slugMiss.length) console.log('  unresolved:', slugMiss.join(' | '));

console.log(fail ? `\n${fail} FAILURE(S)` : '\nALL PASS — explore fallback mirrors the shared contract');
process.exit(fail ? 1 : 0);
