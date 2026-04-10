"""
STARC — FastAPI Backend
Serves real data from starc.duckdb to the React frontend.

Endpoints:
  GET /api/discoveries-by-year
  GET /api/discovery-methods
  GET /api/habitable-candidates
  GET /api/size-distribution
  GET /api/stats
  GET /api/hot-jupiters
  GET /api/distance-distribution
"""

import os
import sys
import duckdb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.config import DB_PATH

app = FastAPI(title="STARC API", version="1.0.0")

import json
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import pickle

ML_DIR = os.path.dirname(os.path.abspath(__file__))

df_model: pd.DataFrame = None
kmeans_bundle: dict = None
gb_bundle: dict = None

@app.on_event("startup")
def load_assets():
    global df_model, kmeans_bundle, gb_bundle
    try:
        df_model = pd.read_parquet(os.path.join(ML_DIR, "starc_final.parquet"))
        df_model["_name_lower"] = df_model["pl_name"].str.lower()
        with open(os.path.join(ML_DIR, "starc_kmeans.pkl"), "rb") as f:
            kmeans_bundle = pickle.load(f)
        with open(os.path.join(ML_DIR, "starc_gb.pkl"), "rb") as f:
            gb_bundle = pickle.load(f)
        print(f"Loaded {len(df_model)} planets | models ready")
    except Exception as e:
        print("ML Models missing or failed to load:", e)

class PlanetStats(BaseModel):
    orbital_period_days: float
    planet_mass_earth:   float
    planet_radius_earth: float
    eq_temperature_K:    float
    insolation_flux:     float
    gravity_earth:       float
    semi_major_axis_au:  float
    eccentricity:        float
    stellar_temperature_K: float
    stellar_mass_solar:  float
    in_habitable_zone:   bool
    distance_parsecs:    float

class PersonalityCard(BaseModel):
    planet_name:      str
    host_star:        str
    archetype:        str
    archetype_emoji:  str
    archetype_desc:   str
    habitability_score: float          # 0–100
    score_tier:       str              # Potentially Habitable → Instant Death
    score_emoji:      str
    one_liner:        str
    component_scores: dict             # breakdown of the 6 scoring components
    stats:            PlanetStats
    discovery_method: str
    discovery_year:   str
    
class SearchResult(BaseModel):
    planet_name: str
    archetype:   str
    score:       float
    tier:        str

HAB_FEATURES = ["pl_orbper", "pl_rade", "pl_masse", "pl_eqt", "st_teff", "st_rad", "st_mass", "st_met", "sy_dist"]

from api.catalog_upload import router as catalog_router
from api.forum import router as forum_router
app.include_router(catalog_router)
app.include_router(forum_router)

# Allow React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def query(sql: str) -> list[dict]:
    """Run a SQL query against DuckDB and return list of dicts."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="Database not found. Run the pipeline first.")
    con = duckdb.connect(DB_PATH, read_only=True)
    result = con.execute(sql).fetchdf()
    con.close()
    return result.to_dict(orient="records")


@app.get("/api/stats")
def get_stats():
    """Key metrics for the dashboard header cards."""
    return query("""
        SELECT
            COUNT(*)                                        AS total_exoplanets,
            COUNT(DISTINCT hostname)                        AS unique_host_stars,
            COUNT(DISTINCT discoverymethod)                 AS discovery_methods,
            MIN(disc_year)                                  AS earliest_discovery,
            SUM(CASE WHEN discoverymethod = 'Transit'
                THEN 1 ELSE 0 END)                         AS transit_count,
            SUM(CASE WHEN discoverymethod = 'Radial Velocity'
                THEN 1 ELSE 0 END)                         AS radial_velocity_count
        FROM exoplanets
    """)[0]


@app.get("/api/discoveries-by-year")
def get_discoveries_by_year():
    """Year-by-year discovery counts for the timeline chart."""
    return query("""
        SELECT
            disc_year   AS year,
            COUNT(*)    AS count
        FROM exoplanets
        WHERE disc_year IS NOT NULL
          AND disc_year >= 1990
        GROUP BY disc_year
        ORDER BY disc_year
    """)


@app.get("/api/discovery-methods")
def get_discovery_methods():
    """Discovery method breakdown for bar chart."""
    return query("""
        SELECT
            discoverymethod     AS method,
            COUNT(*)            AS count
        FROM exoplanets
        WHERE discoverymethod IS NOT NULL
        GROUP BY discoverymethod
        ORDER BY count DESC
        LIMIT 8
    """)


@app.get("/api/habitable-candidates")
def get_habitable_candidates():
    """Planets in the habitable zone for scatter plot."""
    return query("""
        SELECT
            pl_name,
            hostname,
            ROUND(pl_eqt, 1)    AS eq_temp,
            ROUND(pl_rade, 3)   AS radius,
            ROUND(sy_dist, 1)   AS distance_pc,
            disc_year
        FROM exoplanets
        WHERE pl_eqt BETWEEN 200 AND 350
          AND pl_rade < 2.0
          AND pl_eqt IS NOT NULL
          AND pl_rade IS NOT NULL
        ORDER BY sy_dist ASC
    """)


@app.get("/api/size-distribution")
def get_size_distribution():
    """Planet radius bins for size distribution histogram."""
    return query("""
        SELECT
            CASE
                WHEN pl_rade < 1.0  THEN '< 1 R⊕'
                WHEN pl_rade < 2.0  THEN '1–2 R⊕'
                WHEN pl_rade < 4.0  THEN '2–4 R⊕'
                WHEN pl_rade < 8.0  THEN '4–8 R⊕'
                WHEN pl_rade < 16.0 THEN '8–16 R⊕'
                ELSE '> 16 R⊕'
            END                     AS bin,
            COUNT(*)                AS count,
            CASE
                WHEN pl_rade < 1.0  THEN 1
                WHEN pl_rade < 2.0  THEN 2
                WHEN pl_rade < 4.0  THEN 3
                WHEN pl_rade < 8.0  THEN 4
                WHEN pl_rade < 16.0 THEN 5
                ELSE 6
            END                     AS sort_order
        FROM exoplanets
        WHERE pl_rade IS NOT NULL
        GROUP BY bin, sort_order
        ORDER BY sort_order
    """)


@app.get("/api/hot-jupiters")
def get_hot_jupiters():
    """Short-period large planets table."""
    return query("""
        SELECT
            pl_name,
            hostname,
            ROUND(pl_orbper, 3) AS period_days,
            ROUND(pl_rade, 2)   AS radius_earth,
            ROUND(pl_eqt, 0)    AS eq_temp_k
        FROM exoplanets
        WHERE pl_orbper < 10
          AND pl_rade > 8
          AND pl_orbper IS NOT NULL
          AND pl_rade IS NOT NULL
        ORDER BY pl_orbper ASC
        LIMIT 20
    """)


@app.get("/api/distance-distribution")
def get_distance_distribution():
    """Distance buckets for donut chart."""
    return query("""
        SELECT
            CASE
                WHEN sy_dist < 100  THEN '< 100 pc'
                WHEN sy_dist < 500  THEN '100–500 pc'
                WHEN sy_dist < 1000 THEN '500–1000 pc'
                ELSE '> 1000 pc'
            END         AS bucket,
            COUNT(*)    AS count
        FROM exoplanets
        WHERE sy_dist IS NOT NULL
        GROUP BY bucket
        ORDER BY count DESC
    """)


@app.get("/health")
def health():
    return {"status": "ok", "db": os.path.exists(DB_PATH)}

@app.get("/api/exodex/planet", response_model=PersonalityCard)
def get_planet_personality(name: str):
    if df_model is None: raise HTTPException(500, "Models not loaded")
    
    row = df_model[df_model["_name_lower"] == name.lower()]
    if row.empty:
        matches = df_model[df_model["_name_lower"].str.contains(name.lower(), regex=False)]
        if matches.empty:
            raise HTTPException(404, f"Planet '{name}' not found.")
        row = matches.iloc[[0]]

    r = row.iloc[0]
    return PersonalityCard(
        planet_name      = str(r["pl_name"]),
        host_star        = str(r["hostname"]),
        archetype        = str(r["archetype"]),
        archetype_emoji  = str(r.get("archetype_emoji", "")),
        archetype_desc   = str(r.get("archetype_desc", "")),
        habitability_score = float(r["final_score"]),
        score_tier       = str(r["score_tier"]),
        score_emoji      = str(r.get("score_emoji", "")),
        one_liner        = str(r["one_liner"]),
        component_scores = {
            "temperature":       round(float(r["score_temp"]),    1) if "score_temp" in r else 0,
            "gravity":           round(float(r["score_gravity"]), 1) if "score_gravity" in r else 0,
            "insolation":        round(float(r["score_insol"]),   1) if "score_insol" in r else 0,
            "stellar_stability": round(float(r["score_stellar"]), 1) if "score_stellar" in r else 0,
            "orbit_stability":   round(float(r["score_orbit"]),   1) if "score_orbit" in r else 0,
            "radius":            round(float(r["score_radius"]),  1) if "score_radius" in r else 0,
        },
        stats = PlanetStats(
            orbital_period_days   = round(float(r.get("pl_orbper", 0)),  4),
            planet_mass_earth     = round(float(r.get("pl_bmasse", 0)),  4),
            planet_radius_earth   = round(float(r.get("pl_rade", 0)),    4),
            eq_temperature_K      = round(float(r.get("pl_eqt", 0)),     2),
            insolation_flux       = round(float(r.get("pl_insol", 0)),   4),
            gravity_earth         = round(float(r.get("gravity", 0)),    4),
            semi_major_axis_au    = round(float(r.get("pl_orbsmax", 0)), 6),
            eccentricity          = round(float(r.get("pl_orbeccen", 0)),4),
            stellar_temperature_K = round(float(r.get("st_teff", 0)),    1),
            stellar_mass_solar    = round(float(r.get("st_mass", 0)),    4),
            in_habitable_zone     = bool(r.get("in_hz", 0)),
            distance_parsecs      = round(float(r.get("sy_dist", 0)),    4),
        ),
        discovery_method = str(r.get("discoverymethod", "Unknown")),
        discovery_year   = str(r.get("disc_year", "Unknown")),
    )

@app.get("/api/exodex/search", response_model=list[SearchResult])
def search_planets(q: str, limit: int = 12):
    if df_model is None: return []
    matches = df_model[df_model["_name_lower"].str.contains(q.lower(), regex=False)].head(limit)
    if matches.empty: return []
    return [
        SearchResult(
            planet_name = r["pl_name"],
            archetype   = r["archetype"],
            score       = round(float(r["final_score"]), 1),
            tier        = r["score_tier"]
        ) for _, r in matches.iterrows()
    ]
    
@app.get("/api/exodex/leaderboard/habitable")
def most_habitable(limit: int = 12):
    if df_model is None: return []
    top = df_model.nlargest(limit, "final_score")
    return [{"name": r["pl_name"], "score": round(float(r["final_score"]), 1), "tier": r["score_tier"], "emoji": r.get("score_emoji", ""), "archetype": r["archetype"], "one_liner": r["one_liner"]} for _, r in top.iterrows()]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)


@app.get("/api/starc-votable")
def serve_starc_votable():
    """
    Generate and serve the STARC exoplanet catalog as VOTable for WWT.
    Pulls live from DuckDB, converts to VOTable on the fly.
    """
    import io
    import duckdb
    import pandas as pd
    from fastapi.responses import Response

    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="Database not found.")

    con = duckdb.connect(DB_PATH, read_only=True)
    df = con.execute("""
        SELECT
            pl_name     AS planet_name,
            hostname    AS host_name,
            ra_str      AS ra,
            dec_str     AS dec,
            discoverymethod AS discovery_method,
            disc_year   AS discovery_year,
            sy_dist     AS distance
        FROM exoplanets
        WHERE ra_str IS NOT NULL AND dec_str IS NOT NULL
        LIMIT 2500
    """).fetchdf()
    con.close()

    if df.empty:
        # Fallback: try numeric ra/dec columns
        con = duckdb.connect(DB_PATH, read_only=True)
        df = con.execute("""
            SELECT pl_name AS planet_name, hostname AS host_name,
                   discoverymethod AS discovery_method, disc_year AS discovery_year,
                   sy_dist AS distance
            FROM exoplanets LIMIT 2500
        """).fetchdf()
        con.close()

    try:
        from astropy.table import Table
        from astropy.io.votable import from_table, writeto
        import astropy.units as u

        table = Table.from_pandas(df)
        if "ra" in table.colnames:
            table["ra"].unit = u.deg
            table["ra"].meta["ucd"] = "pos.eq.ra;meta.main"
        if "dec" in table.colnames:
            table["dec"].unit = u.deg
            table["dec"].meta["ucd"] = "pos.eq.dec;meta.main"

        vot = from_table(table)
        buf = io.BytesIO()
        writeto(vot, buf)
        buf.seek(0)
        return Response(content=buf.read(), media_type="application/xml")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VOTable generation failed: {e}")
