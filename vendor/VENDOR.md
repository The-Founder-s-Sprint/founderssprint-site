# /vendor — self-hosted third-party libraries

Libraries are vendored (served from our own origin) instead of a public CDN so a
third-party CDN outage cannot take the site's data pages down. On 19 Jul 2026 a
Cloudflare incident made jsdelivr return 503, which broke every Supabase-backed
page (directory, mentors, testimonials, dashboards) — this removes that risk.

| File | Library | Version | Source | sha256 |
|------|---------|---------|--------|--------|
| supabase-js.min.js | @supabase/supabase-js (UMD) | 2.110.7 | npm `@supabase/supabase-js@2.110.7` → dist/umd/supabase.js | 2697f51bb3efa5f10b5b0bca2a39b3772b1b8f810e6885e3bb8d69c3242d5e07 |

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
