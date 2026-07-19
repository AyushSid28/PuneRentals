CREATE OR REPLACE VIEW public.society_intel AS

SELECT
    s.id,
    s.name,
    s.normalized_name,
    s.area_slug,
    s.lat,
    s.lng,
    s.status,
    s.created_at,

    COUNT(ro.id) FILTER (WHERE ro.status = 'active')
        AS total_observations,

    AVG(ro.rent_inr) FILTER (WHERE ro.status = 'active')
        AS avg_rent,

    PERCENTILE_CONT(0.5)
        WITHIN GROUP (ORDER BY ro.rent_inr)
        FILTER (WHERE ro.status = 'active')
        AS median_rent,

    MAX(ro.as_of_date) FILTER (WHERE ro.status = 'active')
        AS latest_observation_date

FROM public.societies s

LEFT JOIN public.rent_observations ro
ON ro.society_id = s.id

GROUP BY
    s.id,
    s.name,
    s.normalized_name,
    s.area_slug,
    s.lat,
    s.lng,
    s.status,
    s.created_at;