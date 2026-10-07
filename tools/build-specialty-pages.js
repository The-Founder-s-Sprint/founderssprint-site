#!/usr/bin/env node
/* =============================================================================
   The Founder's Sprint — specialty landing page generator
   -----------------------------------------------------------------------------
   Emits one static page per L3 specialty at  /s/<slug>/index.html

   WHY GENERATED STATIC FILES AND NOT ONE JS TEMPLATE (decided 6 Oct 2026)
   ----------------------------------------------------------------------
   A single page reading ?spec=<slug> would be a smaller build. It was rejected
   for two reasons that are the whole point of this feature:

     1. WhatsApp, TikTok, iMessage and LinkedIn read Open Graph tags out of the
        RAW HTML. They do not run JavaScript. One template means all 49 links
        share one identical preview card — which destroys the WhatsApp/email
        use case these links exist for.
     2. One URL is one indexed page. 49 URLs are 49 topical anchors, which is
        the AI-discoverability play already committed to in CLAUDE.md.

   Single source of truth is preserved by GENERATING from beta/taxonomy.js
   rather than by hand-authoring. Change the taxonomy, re-run this, done.
   Never hand-edit a file under /s/ — it will be overwritten.

   USAGE
     node tools/build-specialty-pages.js                  # pilot slugs only
     node tools/build-specialty-pages.js --all            # all 49
     node tools/build-specialty-pages.js --slug a,b,c     # explicit list
     node tools/build-specialty-pages.js --check          # dry run, no writes

   ENV
     FS_MEDIA_BASE   where <slug>.mp4 / <slug>.jpg are served from.
                     Defaults to /media/specialty (local, pre-R2).
                     Set to the R2 custom domain once the bucket is live, e.g.
                     FS_MEDIA_BASE=https://media.founderssprint.co/specialty
   ============================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TAXONOMY_FILE = path.join(ROOT, 'beta', 'taxonomy.js');
const COPY_FILE = path.join(__dirname, 'specialty-copy.json');
const OUT_DIR = path.join(ROOT, 's');
const LOCAL_MEDIA_DIR = path.join(ROOT, 'media', 'specialty');

const SITE = 'https://founderssprint.co';
const MEDIA_BASE = (process.env.FS_MEDIA_BASE || '/media/specialty').replace(/\/+$/, '');

// og:image MUST be an absolute URL — WhatsApp, TikTok and LinkedIn do not
// resolve a relative path, they just render no image. Before this was added,
// the default MEDIA_BASE of '/media/specialty' produced a relative og:image
// and the link preview came up blank, silently defeating the whole point of
// generating these pages. The <video> poster can stay relative; only the
// social tags need absolutising.
const absolute = (u) => (/^https?:\/\//i.test(u) ? u : SITE + (u.startsWith('/') ? '' : '/') + u);

const SB_URL = 'https://ivedeivyotwevjxvcuoe.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZWRlaXZ5b3R3ZXZqeHZjdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk1OTIsImV4cCI6MjA5MDc3NTU5Mn0.qMqjTMDRcvuuSy0yXLPH-yZpWFZdUv63enAsEWxzsss';

// The five pilot specialties — one per discipline, highest-intent in each.
// Swap freely; the generator does not care which slugs it is given.
const PILOT = [
  'brand-positioning',        // Marketing & Branding  · Teddy
  'burn-rate-and-runway',     // Financial Modelling   · Barry
  'pitch-deck-structure',     // Investment Readiness  · Joseph
  'hiring-strategy',          // Strategy & Team       · Moses
  'value-based-pricing',      // Product Dev & Pricing · Patrick
];

// Prices are NEVER hardcoded — track_pricing is the source of truth (CLAUDE.md).
// The generator reads the live 'single' row at BUILD time and bakes it into the
// HTML, so the number a visitor sees before JS runs is already authoritative
// rather than a constant someone has to remember to update. The page then
// re-reads it on load, which only matters for a cached page served after a
// price change.
//
// These two values are the last-resort floor if the build machine is offline.
// If they are ever what renders, the build log says so loudly.
let FEE = 500000;
let DEPOSIT_PCT = 10;

// A truncated anon key is the nastiest possible bug here, because EVERY failure
// path it causes is silent: the price fetch 401s and keeps the baked fallback,
// and the attribution beacon 401s into a .catch(){} — so the pages look fine and
// collect nothing. It has happened once already (6 Oct 2026): a key copied via a
// `cut -c1-200` lost 27 characters of its signature and shipped.
// Structure is cheap to verify, so verify it rather than trusting the paste.
function assertAnonKeyWellFormed() {
  const parts = SB_ANON.split('.');
  const problems = [];
  if (parts.length !== 3) problems.push(`expected 3 dot-separated segments, found ${parts.length}`);
  if (!/^eyJ/.test(SB_ANON)) problems.push('does not begin with the base64 of a JWT header');
  // HS256 over base64url is always 43 chars, unpadded. Anything shorter is truncation.
  if (parts[2] && parts[2].length !== 43) problems.push(`signature is ${parts[2].length} chars, expected 43`);
  try {
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (claims.role !== 'anon') problems.push(`role claim is "${claims.role}", expected "anon" — never ship a service key to a public page`);
    if (claims.exp && claims.exp * 1000 < Date.now()) problems.push('key has expired');
  } catch (e) { problems.push('payload segment is not decodable JSON'); }

  if (problems.length) {
    console.error('FATAL: the Supabase anon key is malformed — refusing to generate pages.');
    problems.forEach((p) => console.error('  · ' + p));
    console.error('  Copy it whole from mentors.html; do not pipe it through head/cut.');
    process.exit(1);
  }
}

async function loadLivePrice() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/track_pricing?track_key=eq.single&is_active=is.true&select=full_fee,deposit_pct`,
      { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` } }
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rows = await res.json();
    if (!rows || !rows.length) throw new Error('no active "single" row in track_pricing');
    const fee = Number(rows[0].full_fee);
    const dep = Number(rows[0].deposit_pct);
    if (!isFinite(fee) || fee <= 0) throw new Error('implausible full_fee: ' + rows[0].full_fee);
    FEE = fee;
    if (isFinite(dep) && dep > 0) DEPOSIT_PCT = dep;
    console.log(`price: UGX ${FEE.toLocaleString('en-GB')} · ${DEPOSIT_PCT}% deposit  (live from track_pricing)`);
  } catch (e) {
    console.warn(`WARNING: could not read track_pricing (${e.message}).`);
    console.warn(`         Baking the fallback UGX ${FEE.toLocaleString('en-GB')} / ${DEPOSIT_PCT}%.`);
    console.warn(`         Verify against track_pricing before deploying these pages.`);
  }
}

/* ── load taxonomy.js (an IIFE that assigns to `window`) ───────────────────── */
function loadTaxonomy() {
  const src = fs.readFileSync(TAXONOMY_FILE, 'utf8');
  const win = {};
  // taxonomy.js ends with `})(window)`, so supply a window and evaluate it.
  new Function('window', src)(win);
  if (!win.FS_TAXONOMY) throw new Error('taxonomy.js did not define FS_TAXONOMY');
  return win.FS_TAXONOMY;
}

/* ── helpers ──────────────────────────────────────────────────────────────── */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Open Graph / JSON-LD values sit inside attributes and JSON strings. Collapse
// whitespace and strip the characters that break either container.
const attr = (s) => esc(String(s == null ? '' : s).replace(/\s+/g, ' ').trim());

const money = (n) => 'UGX ' + Number(n || 0).toLocaleString('en-GB');

// DESIGN.md: never leave a lone word or a trailing arrow on its own line.
const glue = (s) => String(s).replace(/ (\S+)$/, ' $1');

const V6_PETALS = [
  { c: '#C8531F', o: 0.85 }, { c: '#C9923A', o: 0.80 }, { c: '#8AAB5C', o: 0.78 },
  { c: '#3D4A2E', o: 0.82 }, { c: '#777770', o: 0.75 },
];
function v6Mark(onDark, hiIdx) {
  const hi = typeof hiIdx === 'number' ? hiIdx : -1;
  const petals = V6_PETALS.map((p, i) => {
    const op = hi < 0 ? p.o : (i === hi ? 1 : 0.08);
    return `<polygon points="50,8 57,50 50,92 43,50" fill="${p.c}" opacity="${op}" transform="rotate(${i * 72} 50 50)"/>`;
  }).join('');
  const ring = onDark ? '#EFE7D8' : '#1A1A1A';
  const dot = onDark ? '#1A1A1A' : '#EFE7D8';
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${petals}`
    + `<circle cx="50" cy="50" r="4.5" fill="${ring}"/><circle cx="50" cy="50" r="2" fill="${dot}"/></svg>`;
}

const DISCIPLINE_PAGE = {
  marketing: '/method/marketing.html', finance: '/method/finance.html',
  investment: '/method/investment.html', strategy: '/method/strategy.html',
  product: '/method/product.html',
};

/* ── the template ─────────────────────────────────────────────────────────── */
function render(spec, copy, ctx) {
  const { siblings, hasVideo, discIdx } = ctx;

  const headline = copy.headline || spec.name;
  const lede = copy.lede || spec.desc || '';
  const outcomes = Array.isArray(copy.outcomes) ? copy.outcomes : [];
  const forYou = Array.isArray(copy.forYou) ? copy.forYou : [];
  const blurb = copy.ogBlurb || lede || `${spec.name} — a two-hour 1:1 deep-dive with ${spec.coach}.`;

  const url = `${SITE}/s/${spec.slug}`;
  const bookUrl = `/book/?tier=single&spec=${encodeURIComponent(spec.slug)}`;
  const ogImage = hasVideo
    ? absolute(`${MEDIA_BASE}/${spec.slug}.jpg`)
    : `${SITE}/images/og-default.jpg`;
  const title = `${spec.name} · 1:1 with ${spec.coach} · The Founder's Sprint`;

  // Course schema. Named, priced, attributed to a real instructor — the
  // structured signal that lets an AI answer "who teaches pitch decks in
  // Kampala" with this page rather than a guess.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: spec.name,
    description: blurb,
    url,
    inLanguage: 'en',
    courseCode: spec.slug,
    about: spec.l2,
    teaches: outcomes.length ? outcomes : undefined,
    provider: {
      '@type': 'Organization', name: "The Founder's Sprint", url: SITE,
      address: { '@type': 'PostalAddress', addressLocality: 'Kampala', addressCountry: 'UG' },
    },
    instructor: { '@type': 'Person', name: spec.coach },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'PT2H',
      instructor: { '@type': 'Person', name: spec.coach },
    },
    offers: {
      '@type': 'Offer', price: FEE, priceCurrency: 'UGX',
      availability: 'https://schema.org/InStock', url: SITE + bookUrl,
    },
  };

  const videoBlock = hasVideo ? `
      <!-- Poster-first, preload="none": a visitor who never taps pays for a
           ~40 KB JPEG and nothing else. The source is only attached on play,
           so there is no background fetch on a metered connection. -->
      <section class="card vid-card" aria-label="${attr(spec.name)} explained">
        <div class="vid-wrap" id="vid-wrap">
          <video id="spec-video" playsinline controls preload="none"
                 poster="${attr(MEDIA_BASE + '/' + spec.slug + '.jpg')}"
                 data-src="${attr(MEDIA_BASE + '/' + spec.slug + '.mp4')}"></video>
          <button class="vid-play" id="vid-play" type="button"
                  aria-label="Play — ${attr(spec.name)} explained in two minutes">
            <span class="vid-tri" aria-hidden="true"></span>
          </button>
        </div>
        <p class="vid-cap">${esc(spec.coach)} on ${esc(spec.name.toLowerCase())}.</p>
      </section>` : '';

  const outcomesBlock = outcomes.length ? `
      <section class="card">
        <div class="eb">What you leave with</div>
        <ul class="out">
          ${outcomes.map((o) => `<li>${esc(o)}</li>`).join('\n          ')}
        </ul>
      </section>` : '';

  const forYouBlock = forYou.length ? `
      <section class="card">
        <div class="eb">Book this if</div>
        <ul class="fy">
          ${forYou.map((o) => `<li>${esc(o)}</li>`).join('\n          ')}
        </ul>
      </section>` : '';

  // Pick-3 nudge. L2 is a grouping and a "complete the track" prompt only —
  // never a SKU of its own (the guardrail in CLAUDE.md). So this offers the
  // sibling L3s individually and points at pick3 for the set.
  const siblingBlock = siblings.length ? `
      <section class="card">
        <div class="eb">The rest of ${esc(spec.l2)}</div>
        <p class="muted">Each is its own two-hour session. Take all three as a Pick&nbsp;3 bundle and the third is effectively free.</p>
        <div class="sibs">
          ${siblings.map((s) => `<a class="sib" href="/s/${esc(s.slug)}">
            <span class="sib-n">${esc(s.name)}</span>
            <span class="sib-d">${esc(s.desc || '')}</span>
          </a>`).join('\n          ')}
        </div>
        <a class="btn btn-ghost" href="/book/?tier=pick3&amp;spec=${encodeURIComponent([spec.slug].concat(siblings.map((s) => s.slug)).join(','))}">${glue('Take all three — Pick 3')}</a>
      </section>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(title)}</title>
<meta name="description" content="${attr(blurb)}">
<link rel="canonical" href="${attr(url)}">
<meta name="robots" content="index, follow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">

<!-- Social preview. These are read from the raw HTML by WhatsApp, TikTok and
     LinkedIn, which never run JS — the reason these pages are generated. -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Founder's Sprint">
<meta property="og:title" content="${attr(spec.name + ' · 1:1 with ' + spec.coach)}">
<meta property="og:description" content="${attr(blurb)}">
<meta property="og:url" content="${attr(url)}">
<meta property="og:image" content="${attr(ogImage)}">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(spec.name + ' · 1:1 with ' + spec.coach)}">
<meta name="twitter:description" content="${attr(blurb)}">
<meta name="twitter:image" content="${attr(ogImage)}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="${SB_URL}" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>

<style>
  :root{
    --ink:#1A1A1A;--ink-soft:#22242B;--paper:#EFE7D8;--paper-deep:#E6DCC7;
    --muted:#5A564F;--paper-dim:#A09888;
    --terra:#C8531F;--terra-deep:#9A3E16;--ochre:#C9923A;--moss:#3D4A2E;
    --sage:#8AAB5C;--stone:#777770;
    --border:rgba(26,26,26,0.16);--border-hi:rgba(26,26,26,0.32);
    --sans:'Josefin Sans',system-ui,sans-serif;
    --display:'Cormorant Garamond',Georgia,serif;
    --font:'Inter',system-ui,sans-serif;
    --radius-card:0 0 24px 0;
    /* One dominant accent per surface. On a specialty page that accent is the
       parent discipline's identity colour — this page IS a reference to that
       discipline, which is the condition DESIGN.md sets for using it. */
    --disc:${spec.color};
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--paper);color:var(--ink);font-family:var(--font);
       font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;}
  /* .fsx-hero .shell sets no width by design — each page supplies its own. */
  .shell{max-width:1120px;margin:0 auto;padding:0 24px;}
  .wrap{max-width:1120px;margin:0 auto;padding:44px 24px 90px;
        display:grid;grid-template-columns:1fr 360px;gap:28px;align-items:start;}
  .col-main{display:flex;flex-direction:column;gap:22px;min-width:0;}
  .col-side{display:flex;flex-direction:column;gap:22px;position:sticky;top:24px;}

  .card{background:var(--paper-deep);border:1px solid var(--border);
        border-top:3px solid var(--disc);border-radius:var(--radius-card);
        padding:26px 26px 30px;overflow:hidden;}
  .eb{font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.18em;
      text-transform:uppercase;color:var(--muted);margin-bottom:14px;}
  .muted{color:var(--muted);font-size:15px;}

  .out{list-style:none;display:flex;flex-direction:column;gap:14px;}
  .out li{position:relative;padding-left:22px;font-size:16px;line-height:1.6;}
  .out li::before{content:'';position:absolute;left:0;top:9px;width:8px;height:8px;
                  background:var(--disc);transform:rotate(45deg);}
  .fy{list-style:none;display:flex;flex-direction:column;gap:12px;}
  .fy li{font-family:var(--display);font-size:19px;font-style:italic;
         line-height:1.45;color:var(--ink);}

  /* Price card. DESIGN.md stat-card rules: currency is a unit on the same
     baseline, never at display size, so the numeral cannot wrap. */
  .price-card{background:var(--ink);border:none;border-top:3px solid var(--disc);
              color:var(--paper);border-radius:var(--radius-card);padding:28px 26px;}
  .price-card .eb{color:rgba(239,231,216,.45);}
  .price-row{display:flex;align-items:baseline;gap:8px;margin-bottom:4px;}
  .price-cur{font-family:var(--sans);font-size:11px;font-weight:600;letter-spacing:1.2px;
             color:rgba(239,231,216,.55);}
  .price-val{font-family:var(--display);font-weight:300;font-size:40px;line-height:1;
             letter-spacing:-.02em;font-variant-numeric:lining-nums tabular-nums;}
  .price-sub{font-size:13.5px;color:rgba(239,231,216,.6);margin-top:10px;line-height:1.5;}
  .meta{list-style:none;margin-top:20px;padding-top:18px;
        border-top:1px solid rgba(239,231,216,.14);
        display:flex;flex-direction:column;gap:9px;}
  .meta li{display:flex;justify-content:space-between;gap:14px;font-size:13.5px;
           color:rgba(239,231,216,.72);}
  .meta li b{font-weight:500;color:var(--paper);text-align:right;}

  .btn{display:inline-flex;align-items:center;justify-content:center;
       min-height:48px;padding:15px 30px;font-family:var(--sans);font-size:11px;
       font-weight:700;letter-spacing:4px;text-transform:uppercase;
       text-decoration:none;border:none;cursor:pointer;
       transition:opacity .2s,transform .15s,border-color .2s,color .2s;}
  .btn-primary{background:var(--terra);color:var(--paper);}
  .btn-primary:hover{opacity:.88;}
  .btn-primary:active{transform:scale(.985);}
  .btn-ghost{background:transparent;color:var(--ink);border:1px solid var(--border-hi);}
  .btn-ghost:hover{border-color:var(--terra);color:var(--terra);}
  .btn-block{width:100%;margin-top:22px;}
  .btn-on-dark{background:var(--terra);color:var(--paper);}

  /* Video. 9:16 is the shot ratio, so cap the height rather than letting a
     vertical clip run the full column width and push the CTA off-screen. */
  .vid-card{padding:0;background:var(--ink);border-top-color:var(--disc);}
  .vid-wrap{position:relative;background:var(--ink);display:flex;justify-content:center;}
  .vid-wrap video{display:block;width:100%;max-width:338px;max-height:600px;
                  background:var(--ink);}
  .vid-play{position:absolute;inset:0;width:100%;height:100%;border:none;
            background:rgba(26,26,26,.28);cursor:pointer;display:flex;
            align-items:center;justify-content:center;transition:background .2s;}
  .vid-play:hover{background:rgba(26,26,26,.12);}
  .vid-play.is-hidden{display:none;}
  .vid-tri{width:58px;height:58px;border-radius:50%;background:var(--terra);
           position:relative;box-shadow:0 0 0 1px rgba(239,231,216,.25);}
  .vid-tri::after{content:'';position:absolute;top:50%;left:54%;
                  transform:translate(-50%,-50%);
                  border-left:17px solid var(--paper);
                  border-top:11px solid transparent;border-bottom:11px solid transparent;}
  .vid-cap{font-family:var(--display);font-style:italic;font-size:15px;
           color:rgba(239,231,216,.6);padding:14px 22px 18px;}

  .sibs{display:flex;flex-direction:column;gap:2px;margin:16px 0 20px;}
  .sib{display:block;padding:14px 16px;background:rgba(26,26,26,.03);
       text-decoration:none;color:var(--ink);border-left:2px solid transparent;
       transition:border-color .2s,background .2s;}
  .sib:hover{border-left-color:var(--disc);background:rgba(26,26,26,.06);}
  .sib-n{display:block;font-family:var(--sans);font-size:13px;font-weight:600;
         letter-spacing:.04em;}
  .sib-d{display:block;font-size:14px;color:var(--muted);margin-top:3px;}

  .crumb{font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.16em;
         text-transform:uppercase;color:rgba(239,231,216,.42);margin-bottom:20px;}
  .crumb a{color:rgba(239,231,216,.42);text-decoration:none;}
  .crumb a:hover{color:var(--terra);}
  .crumb span{opacity:.5;margin:0 7px;}

  .hero-price{display:flex;align-items:baseline;gap:9px;margin-top:26px;}
  .hero-price .p{font-family:var(--display);font-weight:300;font-size:34px;
                 line-height:1;color:var(--paper);
                 font-variant-numeric:lining-nums tabular-nums;}
  .hero-price .u{font-family:var(--sans);font-size:11px;font-weight:600;
                 letter-spacing:1.2px;color:rgba(239,231,216,.55);}
  .hero-price .n{font-size:13.5px;color:rgba(239,231,216,.5);margin-left:4px;}

  @media (max-width:980px){
    .wrap{grid-template-columns:1fr;padding:32px 20px 70px;}
    .col-side{position:static;}
    /* Bottom-anchored primary action on mobile, reachable by thumb. */
    .col-side{order:-1;}
  }
  @media (max-width:768px){
    body{font-size:15.5px;}
    .shell{padding:0 20px;}
    .card{padding:22px 20px 26px;}
    .price-val{font-size:34px;}
    .btn{width:100%;letter-spacing:3px;}
    .vid-wrap video{max-width:100%;max-height:72vh;}
  }
  @media (prefers-reduced-motion:reduce){
    .btn,.sib,.vid-play{transition:none;}
  }
</style>
</head>
<body>

<div id="fs-nav"></div>

<section class="fsx-hero">
  <div class="hero-constellation" aria-hidden="true"></div>
  <div class="shell">
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span>/</span><a href="${esc(DISCIPLINE_PAGE[spec.disciplineKey] || '/')}">${esc(spec.disciplineLabel)}</a><span>/</span>${esc(spec.l2)}
    </nav>
    <div class="eyebrow section-eb">
      <span class="v6-mark">${v6Mark(true, discIdx)}</span>
      ${esc(spec.disciplineLabel)}
    </div>
    <h1 class="h-section">${esc(headline)}</h1>
    <p class="h-sub">${esc(lede)}</p>
    <div class="hero-rule"></div>
    <div class="hero-price">
      <span class="u">UGX</span>
      <span class="p" id="hero-fee">${esc(Number(FEE).toLocaleString('en-GB'))}</span>
      <span class="n">· one 2-hour 1:1 session</span>
    </div>
    <div class="cta-row">
      <a class="btn btn-on-dark" id="cta-hero" href="${esc(bookUrl)}">${glue('Book this session')}</a>
    </div>
  </div>
</section>

<main class="wrap">
  <div class="col-main">
${videoBlock}
${outcomesBlock}
${forYouBlock}
    <section class="card">
      <div class="eb">How the session runs</div>
      <ul class="out">
        <li>Two hours, one-to-one with ${esc(spec.coach)} — not a group webinar and not a recording</li>
        <li>Online over Google Meet, or in person in Kampala by arrangement</li>
        <li>You bring your actual business. The work is done on your numbers, not a case study</li>
        <li>A ${esc(DEPOSIT_PCT)}% deposit reserves the slot; the balance is due 48 hours before it starts</li>
      </ul>
    </section>
${siblingBlock}
  </div>

  <aside class="col-side">
    <div class="price-card">
      <div class="eb">One session</div>
      <div class="price-row">
        <span class="price-cur">UGX</span>
        <span class="price-val" id="fee-val">${esc(Number(FEE).toLocaleString('en-GB'))}</span>
      </div>
      <p class="price-sub" id="fee-sub">${esc(DEPOSIT_PCT)}% deposit reserves your place. Pay the balance in instalments up to 48 hours before.</p>
      <ul class="meta">
        <li><span>Coach</span><b>${esc(spec.coach)}</b></li>
        <li><span>Discipline</span><b>${esc(spec.disciplineLabel)}</b></li>
        <li><span>Track</span><b>${esc(spec.l2)}</b></li>
        <li><span>Length</span><b>2 hours</b></li>
        <li><span>Format</span><b>1:1 · Meet or Kampala</b></li>
      </ul>
      <a class="btn btn-primary btn-block" id="cta-side" href="${esc(bookUrl)}">${glue('Book this session')}</a>
    </div>
  </aside>
</main>

<div id="fs-footer"></div>
<script src="/site-chrome.js" defer></script>

<script>
(function () {
  'use strict';
  var SLUG = ${JSON.stringify(spec.slug)};
  var SB = ${JSON.stringify(SB_URL)};
  var ANON = ${JSON.stringify(SB_ANON)};

  /* ── Source attribution ─────────────────────────────────────────────────
     ?src= is appended to the link when it is posted. Whitelisted here AND by
     a CHECK constraint on the table, so an arbitrary value is dropped rather
     than stored. Referrer is truncated to its origin — never the full URL,
     which can carry identifiers in a query string. No IP, no user agent, no
     cookie: the log holds no personal data at all, by design. */
  var ALLOWED = ['tiktok','instagram','whatsapp','email','linkedin','x',
                 'facebook','youtube','qr','direct','other'];
  function source() {
    var q = new URLSearchParams(location.search).get('src');
    if (q && ALLOWED.indexOf(q.toLowerCase()) !== -1) return q.toLowerCase();
    var r = document.referrer || '';
    if (!r) return 'direct';
    if (/tiktok/i.test(r)) return 'tiktok';
    if (/instagram/i.test(r)) return 'instagram';
    if (/(wa\\.me|whatsapp)/i.test(r)) return 'whatsapp';
    if (/linkedin/i.test(r)) return 'linkedin';
    if (/(twitter|t\\.co|\\bx\\.com)/i.test(r)) return 'x';
    if (/facebook/i.test(r)) return 'facebook';
    if (/youtu/i.test(r)) return 'youtube';
    return 'other';
  }
  function origin(u) { try { return new URL(u).origin.slice(0, 300); } catch (e) { return null; } }

  function logHit() {
    try {
      fetch(SB + '/rest/v1/share_link_hits', {
        method: 'POST', keepalive: true,
        headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON,
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ slug: SLUG, src: source(),
                               referrer: document.referrer ? origin(document.referrer) : null }),
      }).catch(function () {});
    } catch (e) {}
  }

  /* ── Live price ──────────────────────────────────────────────────────────
     track_pricing is the source of truth (CLAUDE.md) and is public-read, so
     the page never hardcodes the fee. The number rendered server-side is a
     fallback that only survives if this request fails — a visitor must never
     see a blank or zero price. */
  function money(n) { return Number(n || 0).toLocaleString('en-GB'); }
  function loadPrice() {
    fetch(SB + '/rest/v1/track_pricing?track_key=eq.single&is_active=is.true&select=full_fee,deposit_pct',
          { headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (!rows || !rows.length) return;
        var fee = Number(rows[0].full_fee), dep = Number(rows[0].deposit_pct);
        if (!isFinite(fee) || fee <= 0) return;
        var a = document.getElementById('fee-val'); if (a) a.textContent = money(fee);
        var b = document.getElementById('hero-fee'); if (b) b.textContent = money(fee);
        if (isFinite(dep) && dep > 0) {
          var s = document.getElementById('fee-sub');
          if (s) s.textContent = dep + '% deposit reserves your place. Pay the balance in '
            + 'instalments up to 48 hours before.';
        }
      })
      .catch(function () {});
  }

  /* ── Video: attach the source only on tap ───────────────────────────────
     preload="none" plus a deferred src means a visitor who scrolls past pays
     for the poster JPEG and nothing more. On a metered 3G connection that is
     the difference between ~40 KB and ~4.6 MB. */
  function wireVideo() {
    var v = document.getElementById('spec-video');
    var btn = document.getElementById('vid-play');
    if (!v || !btn) return;

    /* Self-heal a missing video. Build-time presence is decided from the local
       encode directory, which is a proxy for what is on R2 — not proof. A bad
       upload, a typo'd filename or an R2 blip would otherwise leave a dead
       player with a broken poster on a page being actively promoted. Probing
       the poster (a ~40 KB JPEG, already being fetched) is enough to tell, and
       removing the whole card is a better failure than an unplayable one. */
    var card = v.closest ? v.closest('.vid-card') : null;
    var probe = new Image();
    probe.onerror = function () { if (card) card.style.display = 'none'; };
    probe.src = v.getAttribute('poster');

    /* Same treatment if the mp4 itself 404s after a tap: put the play button
       back rather than leaving a frozen frame the visitor keeps tapping. */
    v.addEventListener('error', function () {
      btn.classList.remove('is-hidden');
      if (card) card.style.display = 'none';
    });
    btn.addEventListener('click', function () {
      if (!v.src) v.src = v.getAttribute('data-src');
      btn.classList.add('is-hidden');
      var p = v.play();
      if (p && p.catch) p.catch(function () { btn.classList.remove('is-hidden'); });
    });
    v.addEventListener('pause', function () { if (v.currentTime === 0) btn.classList.remove('is-hidden'); });
  }

  /* Carry ?src= through to booking so a conversion keeps its attribution. */
  function propagateSource() {
    var s = source();
    ['cta-hero', 'cta-side'].forEach(function (id) {
      var a = document.getElementById(id);
      if (a) a.href += (a.href.indexOf('?') === -1 ? '?' : '&') + 'src=' + encodeURIComponent(s);
    });
  }

  logHit(); loadPrice(); wireVideo(); propagateSource();
})();
</script>
</body>
</html>
`;
}

/* ── the index at /s/ ─────────────────────────────────────────────────────── */
// Two jobs: the landing place for a mistyped slug (see the .htaccess rule),
// and the hub of the topical cluster — one page linking all 49 leaves, which
// is what makes the cluster legible to a crawler rather than 49 orphans.
function renderIndex(TAX, built) {
  const groups = TAX.disciplines.map((d) => ({
    key: d.key, label: d.label, coach: d.coach, color: d.color,
    l2: d.l2.map((m) => ({
      name: m.name,
      items: m.l3.map((n) => TAX.get(TAX.slugify(n))).filter(Boolean),
    })),
  }));

  const body = groups.map((d, i) => `
      <section class="disc" style="--disc:${d.color}">
        <div class="disc-head">
          <span class="v6">${v6Mark(false, i)}</span>
          <div>
            <h2>${esc(d.label)}</h2>
            <p class="muted">${esc(d.coach)} · <a href="${esc(DISCIPLINE_PAGE[d.key] || '/')}">How this discipline works</a></p>
          </div>
        </div>
        ${d.l2.map((m) => `<div class="l2">
          <div class="l2-n">${esc(m.name)}</div>
          <div class="l3s">
            ${m.items.map((s) => {
              // A slug with a generated page gets the landing page. One without
              // goes straight to booking — never to /s/<slug>, which would
              // bounce back here and read as a broken link.
              const href = built.has(s.slug)
                ? `/s/${s.slug}`
                : `/book/?tier=single&amp;spec=${encodeURIComponent(s.slug)}`;
              return `<a class="l3${built.has(s.slug) ? ' has-page' : ''}" href="${href}">
              <span class="l3-n">${esc(s.name)}</span>
              <span class="l3-d">${esc(s.desc || '')}</span>
            </a>`;
            }).join('\n            ')}
          </div>
        </div>`).join('\n        ')}
      </section>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Every specialty · ${TAX.count} two-hour deep-dives · The Founder's Sprint</title>
<meta name="description" content="All ${TAX.count} coaching specialties across five disciplines. Each one is a two-hour 1:1 session you can book on its own, three as a bundle, or all of them as the cohort.">
<link rel="canonical" href="${SITE}/s/">
<meta name="robots" content="index, follow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Founder's Sprint">
<meta property="og:title" content="Every specialty · ${TAX.count} two-hour deep-dives">
<meta property="og:description" content="Five disciplines, ${TAX.count} bookable specialties. Pick the one that matches the problem you have this week.">
<meta property="og:url" content="${SITE}/s/">
<meta property="og:image" content="${SITE}/images/og-default.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--ink:#1A1A1A;--paper:#EFE7D8;--paper-deep:#E6DCC7;--muted:#5A564F;
    --terra:#C8531F;--border:rgba(26,26,26,0.16);--border-hi:rgba(26,26,26,0.32);
    --sans:'Josefin Sans',system-ui,sans-serif;--display:'Cormorant Garamond',Georgia,serif;
    --font:'Inter',system-ui,sans-serif;--radius-card:0 0 24px 0;}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--paper);color:var(--ink);font-family:var(--font);font-size:16px;
       line-height:1.55;-webkit-font-smoothing:antialiased;}
  .shell{max-width:1120px;margin:0 auto;padding:0 24px;}
  .wrap{max-width:1120px;margin:0 auto;padding:44px 24px 90px;
        display:flex;flex-direction:column;gap:34px;}
  .disc{background:var(--paper-deep);border:1px solid var(--border);
        border-top:3px solid var(--disc);border-radius:var(--radius-card);
        padding:26px 26px 30px;overflow:hidden;}
  .disc-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:22px;}
  .disc-head .v6{width:30px;height:30px;flex-shrink:0;margin-top:2px;}
  .disc-head .v6 svg{width:100%;height:100%;}
  .disc h2{font-family:var(--sans);font-weight:300;font-size:25px;letter-spacing:-.02em;}
  .muted{color:var(--muted);font-size:14.5px;}
  .muted a{color:var(--terra);text-decoration:none;}
  .muted a:hover{text-decoration:underline;}
  .l2{margin-top:18px;}
  .l2-n{font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.18em;
        text-transform:uppercase;color:var(--muted);margin-bottom:9px;}
  .l3s{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;}
  .l3{display:block;padding:14px 16px;background:rgba(26,26,26,.03);text-decoration:none;
      color:var(--ink);border-left:2px solid transparent;min-height:44px;
      transition:border-color .2s,background .2s;}
  .l3:hover{border-left-color:var(--disc);background:rgba(26,26,26,.06);}
  .l3.has-page{background:rgba(26,26,26,.06);border-left-color:rgba(26,26,26,.12);}
  .l3-n{display:block;font-family:var(--sans);font-size:13px;font-weight:600;letter-spacing:.04em;}
  .l3-d{display:block;font-size:14px;color:var(--muted);margin-top:3px;line-height:1.45;}
  @media (max-width:900px){.l3s{grid-template-columns:repeat(2,1fr);}}
  @media (max-width:768px){
    body{font-size:15.5px;}
    .shell,.wrap{padding-left:20px;padding-right:20px;}
    .l3s{grid-template-columns:1fr;}
    .disc{padding:22px 20px 26px;}
  }
</style>
</head>
<body>
<div id="fs-nav"></div>

<section class="fsx-hero">
  <div class="hero-constellation" aria-hidden="true"></div>
  <div class="shell">
    <div class="eyebrow section-eb"><span class="v6-mark">${v6Mark(true, -1)}</span>The catalogue</div>
    <h1 class="h-section">Every specialty, and the <em>one</em> you need this week</h1>
    <p class="h-sub">Five disciplines. ${TAX.count} specialties. Each one is a single two-hour
      session with the coach who owns that ground — book one, pick three, or take all of
      them as the cohort.</p>
    <div class="hero-rule"></div>
    <p class="tag">Build with direction.</p>
  </div>
</section>

<main class="wrap">
${body}
</main>

<div id="fs-footer"></div>
<script src="/site-chrome.js" defer></script>
</body>
</html>
`;
}

/* ── build ────────────────────────────────────────────────────────────────── */
async function main() {
  assertAnonKeyWellFormed();
  await loadLivePrice();

  const argv = process.argv.slice(2);
  const check = argv.includes('--check');
  const all = argv.includes('--all');
  const slugArg = (() => {
    const i = argv.indexOf('--slug');
    return i !== -1 && argv[i + 1] ? argv[i + 1].split(',').map((s) => s.trim()).filter(Boolean) : null;
  })();

  const TAX = loadTaxonomy();
  const copyAll = JSON.parse(fs.readFileSync(COPY_FILE, 'utf8'));
  const discKeys = TAX.disciplines.map((d) => d.key);

  let targets = slugArg || (all ? TAX.specialties.map((s) => s.slug) : PILOT);

  // Fail loudly on an unknown slug. Silently skipping it is how a typo ends up
  // in a TikTok comment pointing at a 404.
  const unknown = targets.filter((s) => !TAX.get(s));
  if (unknown.length) {
    console.error('error: not in taxonomy.js → ' + unknown.join(', '));
    process.exit(1);
  }

  const haveMedia = fs.existsSync(LOCAL_MEDIA_DIR)
    ? new Set(fs.readdirSync(LOCAL_MEDIA_DIR).filter((f) => /\.mp4$/i.test(f)).map((f) => f.replace(/\.mp4$/i, '')))
    : new Set();

  console.log(`taxonomy: ${TAX.count} specialties · building ${targets.length}`);
  console.log(`media base: ${MEDIA_BASE}  (local encodes found: ${haveMedia.size})`);
  if (check) console.log('--check: no files will be written\n');

  let written = 0, noCopy = [], noVid = [];

  for (const slug of targets) {
    const spec = TAX.get(slug);
    const copy = copyAll[slug] || {};
    if (!copyAll[slug]) noCopy.push(slug);

    // Media presence is decided at BUILD time from the local encode directory,
    // not by a runtime probe. He encodes locally then uploads the same files,
    // so local presence is a reliable proxy for what is on R2 — and a slug
    // with no video simply omits the block rather than rendering a dead player.
    const hasVideo = haveMedia.has(slug);
    if (!hasVideo) noVid.push(slug);

    const siblings = TAX.specialties.filter(
      (s) => s.disciplineKey === spec.disciplineKey && s.l2 === spec.l2 && s.slug !== slug
    );

    const html = render(spec, copy, {
      siblings,
      hasVideo,
      discIdx: discKeys.indexOf(spec.disciplineKey),
    });

    const dir = path.join(OUT_DIR, slug);
    const file = path.join(dir, 'index.html');
    if (!check) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, html, 'utf8');
    }
    written++;
    console.log(`  ${check ? 'would write' : 'wrote'}  /s/${slug}/  ${(html.length / 1024).toFixed(1)} KB`
      + `${hasVideo ? ' +video' : ''}${copyAll[slug] ? '' : '  (taxonomy copy only)'}`);
  }

  // The index lists all 49 but only links to pages that exist. It is rebuilt
  // every run so "which slugs have a page" never drifts from reality — a stale
  // index linking to an ungenerated page would bounce the visitor straight
  // back here via the .htaccess fallback and read as a broken site.
  const builtNow = new Set(
    fs.existsSync(OUT_DIR)
      ? fs.readdirSync(OUT_DIR, { withFileTypes: true })
          .filter((e) => e.isDirectory() && fs.existsSync(path.join(OUT_DIR, e.name, 'index.html')))
          .map((e) => e.name)
      : []
  );
  targets.forEach((s) => builtNow.add(s));   // include this run's output in --check
  const idx = renderIndex(TAX, builtNow);
  if (!check) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'index.html'), idx, 'utf8');
  }
  console.log(`  ${check ? 'would write' : 'wrote'}  /s/  index of ${TAX.count}`
    + ` (${builtNow.size} with a landing page)  ${(idx.length / 1024).toFixed(1)} KB`);

  console.log(`\n${check ? 'checked' : 'generated'} ${written} page${written === 1 ? '' : 's'} + index`);
  if (noCopy.length) console.log(`no copy yet (fell back to the taxonomy one-liner): ${noCopy.join(', ')}`);
  if (noVid.length) console.log(`no video yet (block omitted): ${noVid.join(', ')}`);
}

main().catch(function (e) { console.error(e); process.exit(1); });
