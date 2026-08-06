# Cloudflare Worker — first-party Supabase read proxy

## What it fixes
Founders on Ugandan mobile networks saw blank data pages (directory, mentors,
testimonials, dashboards) while server-side calls to Supabase worked fine. The
cause is the browser's **cross-origin, CORS-preflighted** `fetch()` to
`ivedeivyotwevjxvcuoe.supabase.co` intermittently failing on the network path to
Supabase's edge. A **same-origin** request never triggers a CORS preflight, so
routing reads through `founderssprint.co/db/*` sidesteps the leg that fails. The
Worker fetches Supabase edge-to-edge (reliable) and edge-caches reads, so a blip
still serves recent data.

## Deploy (one-time, ~3 minutes, no CLI needed)
1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Create Worker**.
2. Name it e.g. `fs-db-proxy`. Replace the starter code with the contents of
   [`db-proxy.worker.js`](./db-proxy.worker.js). Click **Deploy**.
3. Open the Worker → **Settings → Triggers → Routes → Add route**:
   - Route: `founderssprint.co/db/*`
   - Zone: `founderssprint.co`
   Add a second route `www.founderssprint.co/db/*` if you serve the www host.
4. Done. Test: open `https://founderssprint.co/db/rest/v1/mentors?select=name&limit=1`
   in a browser — it should return JSON (e.g. `[{"name":"..."}]`).

> Note: during the 19 Jul 2026 Cloudflare incident, Worker **deploys** may be
> delayed ("stuck initializing"). If so, deploy once the incident clears — the
> site keeps working in the meantime because pages fall back to calling Supabase
> directly until the `/db` route answers.

## How the pages use it
`directory.html`, `mentors.html`, and `testimonials.html` call a helper that
tries the same-origin proxy first and falls back to direct Supabase:

```js
var DATA_BASE = '/db';                    // same-origin Cloudflare Worker → Supabase
async function fetchData(path, opts, ms){ // path = '/rest/v1/...'
  try {
    var r = await fetchT(DATA_BASE + path, opts, ms);
    var ct = r.headers.get('content-type') || '';
    if (r.ok && ct.indexOf('json') !== -1) return r;   // proxy answered
    throw new Error('proxy miss');
  } catch (e) {
    return fetchT('https://ivedeivyotwevjxvcuoe.supabase.co' + path, opts, ms); // fallback
  }
}
```

So the client change is safe to ship **before** the Worker exists: until the
`/db` route is live it 404s → the helper falls back to direct Supabase (today's
behaviour). Once the Worker is deployed, the robust same-origin path wins.

## Security
- **Anon key only** — never `service_role`. Row-Level Security stays the boundary;
  the proxy can read exactly what an anonymous browser already could.
- Only `/rest/v1/*` is proxied. `GET`/`HEAD` allowed (RLS-limited); `POST`
  restricted to an allowlist (impression logging + read-only RPCs). All real anon
  writes (registrations, applications, bug reports, testimonials) still go through
  the Express API, not this proxy.
- Cookies are never forwarded. Only anon-visible data is returned, so edge-caching
  is safe.

## To roll more pages onto the proxy later
Any page doing anon reads can adopt the same `DATA_BASE` + `fetchData` helper and
change `SUPABASE_URL + '/rest/v1/...'` → `fetchData('/rest/v1/...', ...)`.
Do **not** route authenticated/user-specific reads through the cached proxy.
