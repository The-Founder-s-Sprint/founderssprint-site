# Handoff → Constellation session: add the launch promo banner to Explore

**From:** main session · **Date:** 21 Jul 2026 · **Complements:** `docs/Constellation_Handoff_Prompt.md`

## Why this is a handoff (not done directly)
The dev boundary (CLAUDE.md) says the main session must **not** edit `beta/explore/explore.js`, `explore.css`, or `explore/index.html`. The founding **15% launch promo** was built everywhere else; **Explore is the one taxonomy/booking surface still missing its banner.** This note is the whole task.

## What already exists (do NOT rebuild)
- **`/promo.js`** (root, owned by the main session) is the single source of truth. It is date-gated: nothing renders before **1 Aug 2026** or after **30 Sep 2026** (EAT); it auto-switches on/off with no code change.
- It does two things: (1) rewrites any element tagged `data-promo-tier="single|pick3|cohort|vip1on1"` into struck-list → 15%-off; (2) renders a dismissible banner into a `<div id="fs-promo">` mount.
- Public API `window.FS_PROMO` = `{ active(), discount(n), compact(n), full(n), base }`.
- **QA:** append `?promo=preview` to any URL to force it ON now (this-viewer-only); `?promo=off` forces OFF.

Reference implementation to mirror: the 5 `beta/method/*.html` pages (banner) and `beta/index.html` (banner + tagged prices).

## The task — two edits to `beta/explore/index.html`

### 1. Load promo.js (before site-chrome, like the method pages)
Find (~L373):
```html
<script src="/site-chrome.js?v=9" defer></script>
```
Add immediately above it:
```html
<script src="/promo.js?v=1" defer></script>
```

### 2. Add ONE banner mount
```html
<div id="fs-promo" data-promo-cta="/beta/book/?tier=single"></div>
```
**Placement is your call — and it needs care because Explore's nav is `<div id="fs-nav" data-fixed></div>` (fixed over the full-screen constellation hero).** Do **not** drop the mount at the very top of `<body>` — it will collide with / sit under the fixed nav and obscure the immersive hero. Recommended options:
- **Preferred:** top of the `#directory` section (`<section class="directory" id="directory">`, ~L342) — a natural content break below the constellation, where booking intent already lives.
- **Or:** just inside the mobile discovery section (`#m-discover`) for the phone-first stack.
Pick whichever reads best in your layout; the banner is a normal-flow full-width strip (ink bg, terracotta top-rule), so it pushes content rather than overlaying.

## Optional (only if Explore shows a coaching tier PRICE)
If any Explore surface renders a tier price (e.g. a coach/detail panel showing "UGX 500K"), make it promo-aware so the discount shows there too. Since those are built in `explore.js`, either:
- wrap the price number your JS emits in `<span data-promo-tier="single">500K</span>` (promo.js rewrites it on load), **or**
- in your render, if `window.FS_PROMO && FS_PROMO.active()`, show `FS_PROMO.compact(FS_PROMO.discount(base))` with the list price struck.
Mentor prices and corporate/sponsor prices must **not** be tagged (coaching only).

## Shared contracts — unchanged, do not touch
Coach slugs, the L1/L2/L3 taxonomy node ids, the anon reads, `search_log`, and `coach_ratings()` are all stable (per the boundary note). This task adds only a script include + a mount div — no contract changes.

---

# SECOND ITEM → also for the constellation session: correct Barry's bio in `explore.js`

We now have Barry Wojega's **real** bio. The hardcoded coach data in `beta/explore/explore.js` (the `barry-wojega` object, ~L56) currently carries a **fabricated** bio that must be corrected (it's a co-founder's public reputation, and violates our "no unsourced claims" rule):

**Current (fabricated — remove):**
> "Spent a decade in M&A and venture finance across East Africa before turning to founder coaching. Built models behind eight venture rounds totalling >$60M. Patient with first-time founders; ruthless with assumptions."

**Replace the `bio:` value with (accurate):**
> "Barry is a business and finance development consultant working across Uganda's enterprise-support ecosystem — donor-funded programmes, business support organisations, and growing firms. He tests whether an idea holds up financially, then builds the case that gets it funded, and mentors founders on their financial and business models. Ruthless with assumptions, patient with first-time founders."

Source of truth is now the `coaches` table (`slug='barry-wojega'`, `bio` + `headline='Business & Finance Development Consultant'`) — updated 21 Jul 2026. The `role: 'Lead Financial Modelling Coach'` line stays.

Also set his **constellation photo** — line ~60 is `photo: null`. Change it to `photo: '../images/coach-barry-square.jpg'` (relative, matching the other coaches, e.g. `photo: '../images/coach-teddy.jpg'`). Use the **square** file (800×800 face crop) — the portrait `coach-barry.jpg` had an upload/cache issue, and the square is what the homepage card, coaches-table `avatar_url`, and Finance medallion all use now. All optimised (~90 KB).

**Also flag (your call, not prescribed here):** the three testimonial `quotes` on that same object ("Hanan K. · Cohort 6", "Geoffrey N. · Cohort 8", "Lulu R. · Cohort 10") are **fictional placeholders attributed to named people** — same class as the other placeholder testimonials, but worth confirming they're clearly-labelled or swapped for real/consented quotes before launch, since fake quotes on named individuals carry more risk than anonymous stats.

---

## Done when
- Load `…/beta/explore/index.html?promo=preview` → banner shows, no overlap with the fixed nav, "Book now" → `/beta/book/?tier=single`.
- Load without the param (today) → nothing renders (correct: it auto-appears 1 Aug).
- Deploy: Bluehost (Transmit) upload `beta/explore/index.html`, then Cloudflare purge.
