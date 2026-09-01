/**
 * The Founder's Sprint — same-origin Supabase proxy (Cloudflare Worker)
 * ---------------------------------------------------------------------------
 * WHY: On Ugandan mobile networks the browser's CROSS-ORIGIN, CORS-preflighted
 * fetch to <project>.supabase.co intermittently fails on the path to Supabase's
 * edge (server-side + plain navigation still work). A SAME-ORIGIN request never
 * triggers a CORS preflight, so routing through founderssprint.co/{db,sb}/*
 * sidesteps the leg that fails; the Worker then reaches Supabase edge-to-edge.
 *
 * TWO ROUTES on this one Worker (add BOTH on the founderssprint.co zone):
 *   founderssprint.co/db/*  → ANON reads for public pages. Injects the anon key,
 *                             GET/HEAD + a POST allowlist, edge-cached 60s.
 *   founderssprint.co/sb/*  → AUTHENTICATED passthrough for the admin dashboards.
 *                             FORWARDS the caller's Authorization (user JWT) as-is
 *                             so Supabase RLS runs in the user's context; never
 *                             cached; rest+auth+storage; all methods.
 *
 * SECURITY:
 *   - Anon key only (public). NEVER the service_role key. RLS is the boundary.
 *   - /sb forwards the *caller's own* JWT → it can do exactly what that user could
 *     already do calling Supabase directly. No privilege escalation, no secret held.
 *   - Cookies never forwarded. Authed responses never cached.
 *   - Only /rest, /auth, /storage v1 surfaces are proxied; everything else → 404.
 *   - Follow-up: add edge rate-limiting on both routes.
 */

const SUPABASE_ORIGIN = 'https://ivedeivyotwevjxvcuoe.supabase.co';
const API_ORIGIN = 'https://api.founderssprint.co';   // Express API (Vercel)

// Public anon key — safe to expose (RLS is the real boundary).
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZWRlaXZ5b3R3ZXZqeHZjdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk1OTIsImV4cCI6MjA5MDc3NTU5Mn0.qMqjTMDRcvuuSy0yXLPH-yZpWFZdUv63enAsEWxzsss';

// /db POST allowlist (anon impression logging + read-only RPCs). Real anon writes
// go through the Express API, not this proxy.
const POST_ALLOW = new Set([
  '/rest/v1/provider_impressions',
  '/rest/v1/search_log',
  '/rest/v1/page_views',            // first-party, cookieless pageview beacon (RLS: constrained insert, no read)
  '/rest/v1/rpc/pv_dwell',          // time-on-page: set-once, clamped dwell writer (SECURITY DEFINER)
  '/rest/v1/rpc/coach_ratings',
  '/rest/v1/rpc/mentor_ratings',
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return apiProxy(request, url);
    if (url.pathname.startsWith('/sb/') || url.pathname === '/sb') return authedProxy(request, url);
    return anonProxy(request, url); // /db/*
  },
};

// ── /api — same-origin passthrough to the Express API (Vercel) ────────────────
// WHY: same reason as /db and /sb — the browser's cross-origin request to
// api.founderssprint.co fails on Ugandan networks, so form submits (mentor apply,
// registration/booking, RSVP, directory, bug reports…) never land. founderssprint.co
// is on Cloudflare's edge (reachable), and the Worker reaches the API edge-to-edge.
// The API does its own auth/validation/rate-limiting; we hold no secret here.
async function apiProxy(request, url) {
  const method = request.method.toUpperCase();
  if (method === 'OPTIONS') return cors(new Response(null, { status: 204 }), request);

  const h = new Headers();
  const ct = request.headers.get('content-type'); if (ct) h.set('content-type', ct);
  h.set('Accept', request.headers.get('accept') || 'application/json');
  const auth = request.headers.get('Authorization'); if (auth) h.set('Authorization', auth); // some endpoints validate a user JWT
  // Preserve the real client IP so the API's per-IP rate limiter still works.
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) { h.set('X-Forwarded-For', ip); h.set('CF-Connecting-IP', ip); }

  const bodyless = method === 'GET' || method === 'HEAD';
  let resp;
  try { resp = await fetch(API_ORIGIN + url.pathname + url.search, { method, headers: h, body: bodyless ? undefined : request.body }); }
  catch (e) { return cors(json({ error: 'upstream_unreachable' }, 502), request); }

  const out = new Response(resp.body, { status: resp.status, headers: new Headers(resp.headers) });
  out.headers.delete('set-cookie');
  out.headers.set('Cache-Control', 'no-store');
  return cors(out, request);
}

// ── /db — anonymous, anon-key injected, cached ────────────────────────────────
async function anonProxy(request, url) {
  const method = request.method.toUpperCase();
  const sbPath = url.pathname.replace(/^\/db/, '');
  if (method === 'OPTIONS') return cors(new Response(null, { status: 204 }), request);
  if (!sbPath.startsWith('/rest/v1/')) return cors(json({ error: 'not_found' }, 404), request);

  const isRead = method === 'GET' || method === 'HEAD';
  const postOk = method === 'POST' && POST_ALLOW.has(sbPath);
  if (!isRead && !postOk) return cors(json({ error: 'method_not_allowed' }, 405), request);

  const h = new Headers();
  h.set('apikey', ANON_KEY);
  h.set('Authorization', 'Bearer ' + ANON_KEY);
  h.set('Accept', request.headers.get('accept') || 'application/json');
  const ct = request.headers.get('content-type'); if (ct) h.set('content-type', ct);
  const prefer = request.headers.get('prefer'); if (prefer) h.set('Prefer', prefer);
  const range = request.headers.get('range'); if (range) h.set('Range', range);

  // Server-side geo tagging for the pageview beacon: stamp country + continent from Cloudflare's
  // edge (request.cf). Country-level ONLY — we never store the IP (privacy/DPA-safe). Overrides any
  // client-supplied value (anti-spoof). Every other POST body is forwarded untouched.
  let body = isRead ? undefined : request.body;
  if (postOk && sbPath === '/rest/v1/page_views') {
    const raw = await request.text();
    try {
      const obj = raw ? JSON.parse(raw) : {};
      const cf = request.cf || {};
      const geo = {};
      if (cf.country)   geo.country   = String(cf.country).slice(0, 3).toUpperCase();
      if (cf.continent) geo.continent = String(cf.continent).slice(0, 3).toUpperCase();
      if (Array.isArray(obj)) obj.forEach(o => Object.assign(o, geo)); else Object.assign(obj, geo);
      body = JSON.stringify(obj);
    } catch (e) { body = raw; }   // not JSON — forward the original text unchanged
  }
  const init = { method, headers: h, body };
  if (isRead) init.cf = { cacheTtl: 60, cacheEverything: true };

  let resp;
  try { resp = await fetch(SUPABASE_ORIGIN + sbPath + url.search, init); }
  catch (e) { return cors(json({ error: 'upstream_unreachable' }, 502), request); }

  const out = new Response(resp.body, { status: resp.status, headers: new Headers(resp.headers) });
  out.headers.delete('set-cookie');
  out.headers.set('Cache-Control', isRead && resp.ok
    ? 'public, max-age=60, stale-while-revalidate=300' : 'no-store');
  return cors(out, request);
}

// ── /sb — authenticated passthrough, forwards the caller's JWT, never cached ──
async function authedProxy(request, url) {
  const method = request.method.toUpperCase();
  const sbPath = url.pathname.replace(/^\/sb/, '');
  if (method === 'OPTIONS') return cors(new Response(null, { status: 204 }), request);
  // Only the Supabase API surfaces the dashboards use.
  if (!/^\/(rest|auth|storage)\/v1\//.test(sbPath)) return cors(json({ error: 'not_found' }, 404), request);

  const h = new Headers();
  h.set('apikey', ANON_KEY);                                   // project public key
  const auth = request.headers.get('Authorization');
  h.set('Authorization', auth || ('Bearer ' + ANON_KEY));      // forward the USER's JWT as-is
  const ct = request.headers.get('content-type'); if (ct) h.set('content-type', ct);
  const prefer = request.headers.get('prefer'); if (prefer) h.set('Prefer', prefer);
  h.set('Accept', request.headers.get('accept') || 'application/json');
  const range = request.headers.get('range'); if (range) h.set('Range', range);
  const xup = request.headers.get('x-upsert'); if (xup) h.set('x-upsert', xup);

  const bodyless = method === 'GET' || method === 'HEAD';
  let resp;
  try { resp = await fetch(SUPABASE_ORIGIN + sbPath + url.search, { method, headers: h, body: bodyless ? undefined : request.body }); }
  catch (e) { return cors(json({ error: 'upstream_unreachable' }, 502), request); }

  const out = new Response(resp.body, { status: resp.status, headers: new Headers(resp.headers) });
  out.headers.delete('set-cookie');
  // Cache only PUBLIC storage objects; authed rest/auth/private-storage are never cached.
  if (bodyless && resp.ok && sbPath.startsWith('/storage/v1/object/public/')) {
    out.headers.set('Cache-Control', 'public, max-age=300');
  } else {
    out.headers.set('Cache-Control', 'no-store');
  }
  return cors(out, request);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}

function cors(resp, request) {
  const origin = request.headers.get('Origin') || '';
  const allow = /^https:\/\/(www\.)?founderssprint\.co$/.test(origin) ? origin : 'https://founderssprint.co';
  resp.headers.set('Access-Control-Allow-Origin', allow);
  resp.headers.set('Access-Control-Allow-Headers', 'apikey, authorization, content-type, prefer, accept, range, x-upsert, x-client-info');
  resp.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  resp.headers.set('Vary', 'Origin');
  return resp;
}
