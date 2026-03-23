-- ============================================================
-- STARC — Analytical Queries
-- Run against starc.duckdb using DBeaver or duckdb CLI
-- ============================================================

-- 1. Total count of confirmed exoplanets
SELECT COUNT(*) AS total_exoplanets FROM exoplanets;

-- 2. Discovery methods and their counts (ranked)
SELECT
    discoverymethod,
    COUNT(*) AS count
FROM exoplanets
WHERE discoverymethod IS NOT NULL
GROUP BY discoverymethod
ORDER BY count DESC;

-- 3. Exoplanets discovered per year (trend)
SELECT
    disc_year,
    COUNT(*) AS discoveries
FROM exoplanets
WHERE disc_year IS NOT NULL
GROUP BY disc_year
ORDER BY disc_year;

-- 4. Average planet radius and mass by discovery method
SELECT
    discoverymethod,
    ROUND(AVG(pl_rade), 3)  AS avg_radius_earth,
    ROUND(AVG(pl_masse), 3) AS avg_mass_earth
FROM exoplanets
WHERE pl_rade IS NOT NULL AND pl_masse IS NOT NULL
GROUP BY discoverymethod
ORDER BY avg_radius_earth DESC;

-- 5. Top 10 most massive planets
SELECT
    pl_name,
    hostname,
    ROUND(pl_masse, 2) AS mass_earth,
    disc_year,
    discoverymethod
FROM exoplanets
WHERE pl_masse IS NOT NULL
ORDER BY pl_masse DESC
LIMIT 10;

-- 6. Potentially habitable zone candidates
-- Rough filter: equilibrium temp 200–350 K, radius < 2 Earth radii
SELECT
    pl_name,
    hostname,
    ROUND(pl_eqt, 1)  AS eq_temp_k,
    ROUND(pl_rade, 2) AS radius_earth,
    sy_dist
FROM exoplanets
WHERE pl_eqt BETWEEN 200 AND 350
  AND pl_rade < 2.0
ORDER BY sy_dist ASC;

-- 7. Host stars with most known planets
SELECT
    hostname,
    sy_pnum AS known_planets,
    ROUND(st_teff, 0) AS star_temp_k,
    ROUND(st_mass, 2) AS star_mass_solar
FROM exoplanets
WHERE sy_pnum IS NOT NULL
GROUP BY hostname, sy_pnum, st_teff, st_mass
ORDER BY known_planets DESC
LIMIT 15;

-- 8. Distance distribution buckets (parsecs)
SELECT
    CASE
        WHEN sy_dist < 100  THEN '< 100 pc'
        WHEN sy_dist < 500  THEN '100–500 pc'
        WHEN sy_dist < 1000 THEN '500–1000 pc'
        ELSE '> 1000 pc'
    END AS distance_bucket,
    COUNT(*) AS count
FROM exoplanets
WHERE sy_dist IS NOT NULL
GROUP BY distance_bucket
ORDER BY count DESC;

-- 9. Stellar metallicity vs average planet count
SELECT
    ROUND(st_met, 1) AS metallicity_bin,
    COUNT(DISTINCT hostname) AS host_count,
    ROUND(AVG(sy_pnum), 2) AS avg_planets_per_system
FROM exoplanets
WHERE st_met IS NOT NULL AND sy_pnum IS NOT NULL
GROUP BY metallicity_bin
ORDER BY metallicity_bin;

-- 10. Short-period planets (possible hot Jupiters): period < 10 days, radius > 8 Earth
SELECT
    pl_name,
    hostname,
    ROUND(pl_orbper, 3) AS period_days,
    ROUND(pl_rade, 2)   AS radius_earth,
    ROUND(pl_eqt, 0)    AS eq_temp_k
FROM exoplanets
WHERE pl_orbper < 10
  AND pl_rade > 8
ORDER BY pl_orbper ASC;
