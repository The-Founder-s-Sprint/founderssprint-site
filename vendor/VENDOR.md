# /vendor — self-hosted third-party libraries

Libraries are vendored (served from our own origin) instead of a public CDN so a
third-party CDN outage cannot take the site's data pages down. On 19 Jul 2026 a
Cloudflare incident made jsdelivr return 503, which broke every Supabase-backed
page (directory, mentors, testimonials, dashboards) — this removes that risk.

| File | Library | Version | Source | sha256 |
|------|---------|---------|--------|--------|
| supabase-js.min.js | @supabase/supabase-js (UMD) | 2.110.7 | npm `@supabase/supabase-js@2.110.7` → dist/umd/supabase.js | 2697f51bb3efa5f10b5b0bca2a39b3772b1b8f810e6885e3bb8d69c3242d5e07 |
| chart.umd.min.js | chart.js (UMD) | 4.x | npm `chart.js@4` → dist/chart.umd.min.js | 48444a82d4edcb5bec0f1965faacdde18d9c17db3063d042abada2f705c9f54a |
| d3.min.js | d3 | 7.x | npm `d3@7` → dist/d3.min.js | f2094bbf6141b359722c4fe454eb6c4b0f0e42cc10cc7af921fc158fceb86539 |
| topojson-client.min.js | topojson-client | 3.x | npm `topojson-client@3` → dist/topojson-client.min.js | 25cd02ae486cc5063e0215a4e4cfb15de83700c87ac48bac4d57dc6aaf3ebb89 |
| countries-110m.json | world-atlas (topology) | 2.x | npm `world-atlas@2` → countries-110m.json | 2516c915867c7baf18ddec727aec46c315541a07cfb3d79a6559b05d5e94eee8 |

**Why these four (added 26 Aug 2026):** the site-wide CSP (Cloudflare Transform Rule) is `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://www.instagram.com` — **jsdelivr is not allowlisted**, so `dashboard.html`'s Chart.js + d3 + topojson `<script>`s (and the world-atlas `fetch`, blocked by `connect-src 'self' …`) all failed → the traffic choropleth showed "Map library unavailable" and Chart.js charts were silently blocked. Serving same-origin satisfies the CSP and removes the CDN dependency. `dashboard.html` references them as `/vendor/<file>?v=1`.

## How pages load it
```html
<script src="/vendor/supabase-js.min.js"></script>
<script>window.supabase||document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"><\/script>')</script>
```
Primary = our origin; the inline line falls back to jsdelivr ONLY if our copy
fails to load. Strictly more resilient than before: the page works if EITHER our
origin OR jsdelivr is up.

## To update the version
1. `npm pack @supabase/supabase-js@2` (or pin an exact version)
2. Copy `package/dist/umd/supabase.js` over `supabase-js.min.js`
3. Re-add the header comment; update version + sha256 above.
4. No page edits needed — the filename is stable.
