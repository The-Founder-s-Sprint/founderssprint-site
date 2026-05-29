# The Founder's Sprint — Site Structure

> Last updated: 27 May 2026

## Hosting

| Location | Host | Purpose |
|----------|------|---------|
| `founderssprint.co/` | Bluehost (root) | Waitlist holding page, admin dashboard, coach application |
| `founderssprint.co/beta/` | Bluehost (subfolder) | Full marketing site — homepage, registration, explore, directory, legal pages |
| `api.founderssprint.co` | Vercel | Express API (registration, payments, coach applications, waitlist) |
| `learn.founderssprint.co` | Vercel (future) | Next.js authenticated hub (curriculum, dashboards) |

## File Map

```
founderssprint-site/
│
│── ROOT (founderssprint.co/)
│   index.html                 Waitlist / holding page
│   dashboard.html             Admin + coach dashboard (Supabase auth)
│   favicon.svg                V6 diamond mark
│   bg-poster.jpg              Waitlist hero poster frame
│   bg-loop.mp4 … bg-loop-5.mp4   Waitlist background videos
│   coach/
│     index.html               Coach application form (public intake)
│     test-submit.html         Test harness (dev only)
│     IMG_0987.jpeg … image001.jpg   Uploaded coach photos
│
└── beta/ (founderssprint.co/beta/)
    │
    │── Core
    │   index.html             Homepage (hero, method, coaches, data room, pricing, FAQ)
    │   homepage.css            Homepage styles
    │   homepage.js             Homepage carousel + scroll animations
    │   favicon.svg             V6 diamond mark (copy)
    │
    │── Registration & Events
    │   register.html           Cohort registration + deposit payment
    │   launch-event-rsvp.html  1 July soft launch RSVP
    │   coach-onboarding.html   Coach onboarding (detailed, post-approval)
    │
    │── Discovery
    │   explore/
    │     index.html            Constellation explorer (5-discipline taxonomy)
    │     explore.css
    │     explore.js
    │   directory.html          Service provider directory (public)
    │   apply-directory.html    Provider application form
    │
    │── Utility
    │   contact.html            Contact form
    │   send-contact.php        Contact form handler (server-side)
    │   policy.css              Shared CSS for legal + contact pages
    │
    │── Legal
    │   privacy.html            Privacy policy
    │   terms.html              Terms of service
    │   cookies.html            Cookie notice
    │
    │── Assets
    │   assets/
    │     hero.mp4 … hero-12.mp4   Hero carousel videos (13 clips)
    │     hero-poster.jpg          Hero video poster frame
    │   Photos/                    Site photography (32 images)
```

## Page Status

### ROOT — founderssprint.co/

| Page | Status | Form Backend | Notes |
|------|--------|-------------|-------|
| **index.html** (waitlist) | BUILT | ✗ NOT WIRED | Form submit is a `setTimeout` stub. API endpoint exists at `api.founderssprint.co/api/waitlist` (saves to Supabase) — needs wiring. |
| **dashboard.html** | BUILT | ✓ Supabase | Fully functional SPA. Tabs: Overview, Registrations, Coaches, Sessions, Cohorts, Pricing, Profiles. Logs in via Supabase Auth. |
| **coach/index.html** | BUILT | ✓ API | Submits to `api.founderssprint.co/api/coach-application`. Uploads photos to Supabase Storage. |

### BETA — founderssprint.co/beta/

| Page | Status | Form Backend | Notes |
|------|--------|-------------|-------|
| **index.html** (homepage) | BUILT | — | All sections complete: hero carousel, method, coaches, data room (animated), pricing (animated), FAQ. Nav links to explore/, directory, and anchor sections. |
| **register.html** | BUILT | ✓ API | Submits to `api.founderssprint.co/api/register` then `/api/payment-request`. ioTec Pay integration pending company registration. |
| **launch-event-rsvp.html** | BUILT | ✓ API | Submits to `api.founderssprint.co/api/rsvp`. |
| **coach-onboarding.html** | BUILT | ✓ API | Submits to `api.founderssprint.co/api/coach-application`. Post-approval detailed onboarding (bio, expertise, availability, documents). |
| **explore/index.html** | BUILT | — | Interactive constellation with 5-discipline taxonomy, coach slide-out panel, snap-to-node hover. |
| **directory.html** | BUILT | ✓ API | Loads providers from `api.founderssprint.co/api/directory`. Filterable by category. |
| **apply-directory.html** | BUILT | ✓ API | Submits provider applications to API. Three tiers: Basic (free), Verified, Featured. |
| **contact.html** | BUILT | ⚠ PHP | Form action is `send-contact.php` — server-side PHP. Works on Bluehost but not independently testable. |
| **privacy.html** | BUILT | — | Static legal page. |
| **terms.html** | BUILT | — | Static legal page. |
| **cookies.html** | BUILT | — | Static legal page. |

## Navigation

### Top Nav (homepage)
Method (#method) · Coaches (#coaches) · Explore (explore/) · Pricing (#pricing) · Directory (directory.html) · FAQ (#faq) · Log in (/login) · Create Account (/login?intent=signup)

### Footer (all beta pages)
Five-column grid: Brand + socials, Programme, For Institutions, Resources, Company.
All links relative within /beta/. Explore page uses `../` prefix.

### Cross-page links
- Homepage → Explore, Directory, Contact, all legal pages
- Explore → all beta pages via `../` prefix
- Legal pages → each other, Contact
- Register, RSVP, Coach Onboarding → standalone (no full nav, link back to homepage)

## What's Done

- [x] Homepage — all 10 sections built, animated (data room checkmarks, pricing table)
- [x] Footer standardised across all 14 pages (V6 diamond mark, 5-column grid)
- [x] Explore constellation — interactive, snap-to-node, coach slide-out
- [x] Directory + provider application flow
- [x] Registration form with ioTec payment flow (pending ioTec onboarding)
- [x] Launch event RSVP page
- [x] Coach application + detailed onboarding forms
- [x] Contact form (PHP handler)
- [x] Legal pages (privacy, terms, cookies)
- [x] Admin dashboard (full SPA — registrations, coaches, sessions, cohorts, pricing, profiles)
- [x] API deployed to Vercel (register, payment-request, rsvp, coach-application, directory, waitlist)
- [x] Supabase schema, auth, RLS policies
- [x] Hero video carousel (13 clips, poster frame, lazy-load)
- [x] Section scroll animations (IntersectionObserver)
- [x] Production folder organised to match Bluehost structure

## What's Remaining (Pre-Launch)

### Launch Blockers

1. **Wire waitlist form to API** — `index.html` form needs `fetch('https://api.founderssprint.co/api/waitlist', ...)` instead of the current `setTimeout` stub. The API endpoint exists and works.

2. **Mandrill email testing** — Subscription is active and paid. Need to test transactional email delivery: payment confirmations, curriculum links, session reminders, coach application notifications. These templates exist in `founders-sprint-api/templates/`.

3. **ioTec Pay onboarding** — Blocked by company registration (expected ~31 May). Once ioTec is live, test the full payment flow: register → deposit → balance → webhook confirms → materials access email.

4. **Upload site to Bluehost** — Clean upload of this folder structure. Root files to `/`, beta contents to `/beta/`.

5. **Test all links and forms on live site** — After upload, walk through every page and form submission.

### Pre-Cohort 1 (by 6 July)

6. **Waitlist drip email sequence** — 5 emails built (`waitlist-welcome-email.html` through `waitlist-email-5-framework.html`). Need to be loaded into Mailchimp/Mandrill as automated sequences.

7. **Social media accounts + content** — @founderssprint on LinkedIn, Instagram, X. Buffer for scheduling. Content starts with build-in-public posts.

8. **API security hardening** — Rate limiting (`express-rate-limit`) and security headers (`helmet`) still not installed on the API. Known vulnerability: no rate limiting on public endpoints.

9. **DNS for api.founderssprint.co** — Verify CNAME/A record pointing to Vercel deployment. Currently works but confirm production setup.

### Post-Launch / Phase 2

10. Next.js authenticated hub (`founders-sprint-learn/`) — curriculum delivery, role-based dashboards
11. Google Calendar + Meet integration for session booking
12. Coach content management system (branded template builder)
13. Mobile-first discovery engine
14. Investor pipeline dashboard
