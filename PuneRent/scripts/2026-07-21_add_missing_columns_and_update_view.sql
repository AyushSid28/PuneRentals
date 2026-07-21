-- 2026-07-21_add_missing_columns_and_update_view.sql
-- Migration to synchronize production schema with development definitions

-- 1. Add missing `source` column to `societies`
ALTER TABLE public.societies
  ADD COLUMN IF NOT EXISTS source text NOT NULL
    DEFAULT 'community'
    CHECK (source IN ('community', 'admin'));

-- 2. Ensure `updated_at` column exists on `societies`
ALTER TABLE public.societies
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL
    DEFAULT now();

-- 3. Add missing `source` column to `rent_observations`
ALTER TABLE public.rent_observations
  ADD COLUMN IF NOT EXISTS source text NOT NULL
    DEFAULT 'community'
    CHECK (source IN ('community', 'admin'));

-- 4. Re‑create `society_intel` view to match expected columns
DROP VIEW IF EXISTS public.society_intel;
CREATE VIEW public.society_intel AS
SELECT
  s.id,
  s.name,
  s.normalized_name,
  s.area_slug,
  s.lat,
  s.lng,
  s.status,
  s.created_at,
  COUNT(o.id) AS total_observations,
  AVG(o.rent_inr)::numeric AS avg_rent,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.rent_inr) AS median_rent,
  MAX(o.as_of_date) AS latest_observation_date
FROM public.societies s
LEFT JOIN public.rent_observations o ON o.society_id = s.id
GROUP BY s.id, s.name, s.normalized_name, s.area_slug, s.lat, s.lng, s.status, s.created_at;
