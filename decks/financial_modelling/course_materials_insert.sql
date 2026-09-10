-- ─────────────────────────────────────────────────────────────────────────────
-- Financial Modelling — Week 1 (Orientation & Financial Planning)
-- course_materials seed row for Barry Wojega · Financial Modelling
--
-- Run in the Supabase SQL Editor AFTER the deck is deployed to Bluehost at
--   /decks/financial-modelling/Week-1-Financial-Planning.html
-- (publishing a row whose source_url 404s would surface a dead link in the
--  founder/coach dashboards).
--
-- First Financial Modelling deck on the platform (Barry previously had none),
-- so sort_order starts at 1. Conventions mirror the live Investment Readiness
-- WEEK rows (ids 13–18): week_number set, session_code NULL, module_type/format
-- 'Slides', status 'published', access_type 'both'.
--   coach_id  c71048f9-f13f-437d-bd50-5e1e93135240   (Barry Wojega)
--
-- Idempotent: inserts only if the source_url is not already present.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO course_materials
  (coach_id, title, discipline, module_type, week_number, session_code,
   sort_order, duration_minutes, source_url, format, status, access_type, is_active)
SELECT v.coach_id, v.title, v.discipline, v.module_type, v.week_number, v.session_code,
       v.sort_order, v.duration_minutes, v.source_url, v.format, v.status, v.access_type, v.is_active
FROM (VALUES
  ('c71048f9-f13f-437d-bd50-5e1e93135240'::uuid,
   'Week 1 — Orientation & Financial Planning',
   'Financial Modelling', 'Slides', 1, NULL::text,
   1, 120, '/decks/financial-modelling/Week-1-Financial-Planning.html',
   'Slides', 'published', 'both', true)
) AS v(coach_id, title, discipline, module_type, week_number, session_code,
       sort_order, duration_minutes, source_url, format, status, access_type, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM course_materials cm WHERE cm.source_url = v.source_url
);

-- Verify:
SELECT id, title, week_number, sort_order, source_url, status
FROM course_materials
WHERE discipline = 'Financial Modelling'
ORDER BY sort_order;
