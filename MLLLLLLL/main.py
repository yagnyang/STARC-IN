"""
STARC — Planet Personality API
Serves cluster archetype, habitability score, score tier, and sarcastic one-liner
for any of the 4,075 exoplanets in the dataset.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import pickle
import os

# ── App setup ─────────────────────────────────────────────────────
app = FastAPI(
    title="STARC Planet Personality API",
    description="ML-powered exoplanet personality cards — archetype, habitability score, and sarcastic one-liner.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production to your frontend domain
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load data + models once at startup ────────────────────────────
BASE = os.path.dirname(__file__)

df: pd.DataFrame = None
kmeans_bundle: dict = None
gb_bundle: dict = None

@app.on_event("startup")
def load_assets():
    global df, kmeans_bundle, gb_bundle

    df = pd.read_parquet(os.path.join(BASE, "starc_final.parquet"))
    # lowercase planet names for case-insensitive lookup
    df["_name_lower"] = df["pl_name"].str.lower()

    with open(os.path.join(BASE, "starc_kmeans.pkl"), "rb") as f:
        kmeans_bundle = pickle.load(f)

    with open(os.path.join(BASE, "starc_gb.pkl"), "rb") as f:
        gb_bundle = pickle.load(f)

    print(f"✓ Loaded {len(df)} planets | models ready")


# ── Response schemas ──────────────────────────────────────────────
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

class ArchetypeInfo(BaseModel):
    archetype:       str
    emoji:           str
    description:     str
    planet_count:    int
    median_temp_K:   float
    median_mass_earth: float
    median_period_days: float
    habitable_zone_count: int
    top_planets:     list[str]


# ── Endpoints ─────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "planets_loaded": len(df),
        "endpoints": [
            "GET /planet/{name}",
            "GET /planet/{name}/personality",
            "GET /search?q=kepler",
            "GET /archetypes",
            "GET /archetypes/{name}",
            "GET /leaderboard/habitable",
            "GET /leaderboard/hostile",
            "GET /random",
            "POST /predict"
        ]
    }


@app.get("/planet/{name}", response_model=PersonalityCard, tags=["Planet"])
@app.get("/planet/{name}/personality", response_model=PersonalityCard, tags=["Planet"])
def get_planet_personality(name: str):
    """
    Get the full ML personality card for a planet by name.
    Case-insensitive. Example: /planet/KELT-9 b  or  /planet/trappist-1 e
    """
    row = df[df["_name_lower"] == name.lower()]
    if row.empty:
        # Fuzzy fallback — partial match
        matches = df[df["_name_lower"].str.contains(name.lower(), regex=False)]
        if matches.empty:
            raise HTTPException(404, f"Planet '{name}' not found. Try /search?q={name}")
        row = matches.iloc[[0]]   # take closest partial match

    r = row.iloc[0]
    return PersonalityCard(
        planet_name      = r["pl_name"],
        host_star        = r["hostname"],
        archetype        = r["archetype"],
        archetype_emoji  = r["archetype_emoji"],
        archetype_desc   = r["archetype_desc"],
        habitability_score = float(r["final_score"]),
        score_tier       = r["score_tier"],
        score_emoji      = r["score_emoji"],
        one_liner        = r["one_liner"],
        component_scores = {
            "temperature":       round(float(r["score_temp"]),    1),
            "gravity":           round(float(r["score_gravity"]), 1),
            "insolation":        round(float(r["score_insol"]),   1),
            "stellar_stability": round(float(r["score_stellar"]), 1),
            "orbit_stability":   round(float(r["score_orbit"]),   1),
            "radius":            round(float(r["score_radius"]),  1),
        },
        stats = PlanetStats(
            orbital_period_days   = round(float(r["pl_orbper"]),  4),
            planet_mass_earth     = round(float(r["pl_bmasse"]),  4),
            planet_radius_earth   = round(float(r["pl_rade"]),    4),
            eq_temperature_K      = round(float(r["pl_eqt"]),     2),
            insolation_flux       = round(float(r["pl_insol"]),   4),
            gravity_earth         = round(float(r["gravity"]),    4),
            semi_major_axis_au    = round(float(r["pl_orbsmax"]), 6),
            eccentricity          = round(float(r["pl_orbeccen"]),4),
            stellar_temperature_K = round(float(r["st_teff"]),    1),
            stellar_mass_solar    = round(float(r["st_mass"]),    4),
            in_habitable_zone     = bool(r["in_hz"]),
            distance_parsecs      = round(float(r["sy_dist"]),    4),
        ),
        discovery_method = r["discoverymethod"],
        discovery_year   = str(r["disc_year"]),
    )


@app.get("/search", response_model=list[SearchResult], tags=["Search"])
def search_planets(
    q: str = Query(..., min_length=2, description="Planet name search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """Search planets by name (partial match, case-insensitive)."""
    matches = df[df["_name_lower"].str.contains(q.lower(), regex=False)].head(limit)
    if matches.empty:
        return []
    return [
        SearchResult(
            planet_name = r["pl_name"],
            archetype   = r["archetype"],
            score       = round(float(r["final_score"]), 1),
            tier        = r["score_tier"]
        )
        for _, r in matches.iterrows()
    ]


@app.get("/archetypes", response_model=list[ArchetypeInfo], tags=["Archetypes"])
def get_all_archetypes():
    """Get summary info for all 7 planetary archetypes."""
    result = []
    for archetype, grp in df.groupby("archetype"):
        top = grp.nlargest(3, "final_score")["pl_name"].tolist()
        emoji = grp.iloc[0]["archetype_emoji"]
        desc  = grp.iloc[0]["archetype_desc"]
        result.append(ArchetypeInfo(
            archetype            = archetype,
            emoji                = emoji,
            description          = desc,
            planet_count         = len(grp),
            median_temp_K        = round(float(grp["pl_eqt"].median()), 1),
            median_mass_earth    = round(float(grp["pl_bmasse"].median()), 2),
            median_period_days   = round(float(grp["pl_orbper"].median()), 2),
            habitable_zone_count = int(grp["in_hz"].sum()),
            top_planets          = top,
        ))
    return sorted(result, key=lambda x: -x.planet_count)


@app.get("/archetypes/{archetype_name}", tags=["Archetypes"])
def get_archetype_planets(
    archetype_name: str,
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("score", regex="^(score|name|temp|mass)$")
):
    """Get all planets belonging to a specific archetype."""
    matches = df[df["archetype"].str.lower() == archetype_name.lower().replace("-", " ")]
    if matches.empty:
        raise HTTPException(404, f"Archetype '{archetype_name}' not found.")

    sort_col = {
        "score": "final_score", "name": "pl_name",
        "temp": "pl_eqt",       "mass": "pl_bmasse"
    }[sort_by]

    ascending = sort_by == "name"
    planets = matches.sort_values(sort_col, ascending=ascending).head(limit)

    return {
        "archetype":    matches.iloc[0]["archetype"],
        "emoji":        matches.iloc[0]["archetype_emoji"],
        "description":  matches.iloc[0]["archetype_desc"],
        "total_count":  len(matches),
        "planets": [
            {
                "name":  r["pl_name"],
                "score": round(float(r["final_score"]), 1),
                "tier":  r["score_tier"],
                "temp_K": float(r["pl_eqt"]),
                "one_liner": r["one_liner"]
            }
            for _, r in planets.iterrows()
        ]
    }


@app.get("/leaderboard/habitable", tags=["Leaderboards"])
def most_habitable(limit: int = Query(20, ge=1, le=100)):
    """Top N most habitable planets."""
    top = df.nlargest(limit, "final_score")
    return {
        "title": "Most Potentially Habitable Planets",
        "planets": [
            {
                "rank":       i + 1,
                "name":       r["pl_name"],
                "score":      round(float(r["final_score"]), 1),
                "tier":       r["score_tier"],
                "temp_K":     float(r["pl_eqt"]),
                "in_hz":      bool(r["in_hz"]),
                "archetype":  r["archetype"],
                "one_liner":  r["one_liner"],
            }
            for i, (_, r) in enumerate(top.iterrows())
        ]
    }


@app.get("/leaderboard/hostile", tags=["Leaderboards"])
def most_hostile(limit: int = Query(20, ge=1, le=100)):
    """Top N most hostile / deadly planets."""
    bot = df.nsmallest(limit, "final_score")
    return {
        "title": "Most Hostile Planets — Do Not Visit",
        "planets": [
            {
                "rank":       i + 1,
                "name":       r["pl_name"],
                "score":      round(float(r["final_score"]), 1),
                "tier":       r["score_tier"],
                "temp_K":     float(r["pl_eqt"]),
                "insol":      float(r["pl_insol"]),
                "archetype":  r["archetype"],
                "one_liner":  r["one_liner"],
            }
            for i, (_, r) in enumerate(bot.iterrows())
        ]
    }


@app.get("/random", response_model=PersonalityCard, tags=["Planet"])
def random_planet(tier: Optional[str] = Query(None, description="Filter by tier e.g. 'Potentially Habitable'")):
    """Get a random planet personality card, optionally filtered by tier."""
    pool = df if tier is None else df[df["score_tier"].str.lower() == tier.lower()]
    if pool.empty:
        raise HTTPException(404, f"No planets found for tier '{tier}'")
    r = pool.sample(1).iloc[0]
    return get_planet_personality(r["pl_name"])


# ── Predict endpoint for new planets ──────────────────────────────
class NewPlanetInput(BaseModel):
    pl_orbper:  float = 365.0
    pl_orbsmax: float = 1.0
    pl_rade:    float = 1.0
    pl_bmasse:  float = 1.0
    pl_orbeccen:float = 0.02
    pl_insol:   float = 1.0
    pl_eqt:     float = 288.0
    st_teff:    float = 5778.0
    st_mass:    float = 1.0
    st_rad:     float = 1.0
    st_met:     float = 0.0
    sy_dist:    float = 10.0

@app.post("/predict", tags=["Predict"])
def predict_new_planet(planet: NewPlanetInput):
    """
    Predict archetype + habitability score for a new planet not in the dataset.
    Feed in raw physical parameters and get back a full personality assessment.
    """
    import math

    d = planet.dict()

    # Feature engineering (mirrors preprocessing pipeline)
    gravity      = d["pl_bmasse"] / max(d["pl_rade"] ** 2, 0.001)
    st_lum       = (d["st_teff"] / 5778) ** 4 * (d["st_rad"] ** 2)
    hz_inner     = math.sqrt(st_lum / 1.1)
    hz_outer     = math.sqrt(st_lum / 0.53)
    in_hz        = 1 if hz_inner <= d["pl_orbsmax"] <= hz_outer else 0

    log_feats = {
        "log_pl_orbper":    math.log1p(max(d["pl_orbper"], 0)),
        "log_pl_bmasse":    math.log1p(max(d["pl_bmasse"], 0)),
        "log_pl_rade":      math.log1p(max(d["pl_rade"], 0)),
        "log_pl_insol":     math.log1p(max(d["pl_insol"], 0)),
        "log_gravity":      math.log1p(max(gravity, 0)),
        "log_st_luminosity":math.log1p(max(st_lum, 0)),
        "log_sy_dist":      math.log1p(max(d["sy_dist"], 0)),
    }

    # Component scores (import inline to keep API self-contained)
    def s_temp(t):
        if 273<=t<=373: return 100
        elif 200<=t<273: return 60+(t-200)/73*40
        elif 373<t<=500: return 60+(500-t)/127*40
        elif 150<=t<200: return 20+(t-150)/50*40
        elif 500<t<=700: return 20+(700-t)/200*40
        else: return max(0, 100-abs(t-300)/20)

    def s_grav(g):
        if 0.8<=g<=1.5: return 100
        elif 0.4<=g<0.8: return 50+(g-0.4)/0.4*50
        elif 1.5<g<=2.5: return 50+(2.5-g)/1.0*50
        elif 0.1<=g<0.4: return 10+(g-0.1)/0.3*40
        elif 2.5<g<=5.0: return 10+(5.0-g)/2.5*40
        else: return 0

    def s_insol(i):
        if 0.36<=i<=1.11: return 100
        elif 0.2<=i<0.36: return 50+(i-0.2)/0.16*50
        elif 1.11<i<=2.0: return 50+(2.0-i)/0.89*50
        elif 0.05<=i<0.2: return 10+(i-0.05)/0.15*40
        elif 2.0<i<=10.0: return 10+(10.0-i)/8.0*40
        else: return 0

    def s_stellar(t, m):
        if 4500<=t<=6500 and 0.7<=m<=1.3: return 100
        elif 3700<=t<4500: return 60
        elif 6500<t<=7500: return 75
        elif 7500<t<=10000: return 30
        elif t>10000: return 5
        else: return 40

    def s_orbit(e):
        if e<=0.1: return 100
        elif e<=0.3: return 80-(e-0.1)/0.2*30
        elif e<=0.6: return 50-(e-0.3)/0.3*40
        else: return max(0, 10-(e-0.6)/0.4*10)

    def s_radius(r):
        if 0.5<=r<=1.8: return 100
        elif 1.8<r<=2.5: return 70-(r-1.8)/0.7*30
        elif 2.5<r<=4.0: return 40-(r-2.5)/1.5*30
        elif 0.3<=r<0.5: return 60
        else: return max(0, 10-(r-4.0)*3)

    comp = {
        "score_temp":    s_temp(d["pl_eqt"]),
        "score_gravity": s_grav(gravity),
        "score_insol":   s_insol(d["pl_insol"]),
        "score_stellar": s_stellar(d["st_teff"], d["st_mass"]),
        "score_orbit":   s_orbit(d["pl_orbeccen"]),
        "score_radius":  s_radius(d["pl_rade"]),
    }

    # Build feature vector for GB model
    gb   = gb_bundle["model"]
    feats = gb_bundle["features"]
    feat_vec = {
        **log_feats,
        "pl_eqt":     d["pl_eqt"],
        "pl_orbsmax": d["pl_orbsmax"],
        "pl_orbeccen":d["pl_orbeccen"],
        "st_teff":    d["st_teff"],
        "st_mass":    d["st_mass"],
        "st_met":     d["st_met"],
        "in_hz":      in_hz,
        **comp
    }
    X_new = np.array([[feat_vec[f] for f in feats]])
    hab_score = float(np.clip(gb.predict(X_new)[0], 0, 100))

    # Cluster assignment
    km     = kmeans_bundle["model"]
    scaler = kmeans_bundle["scaler"]
    km_feats = kmeans_bundle["features"]
    km_vec = {
        **log_feats,
        "pl_eqt":     d["pl_eqt"],
        "pl_orbsmax": d["pl_orbsmax"],
        "pl_orbeccen":d["pl_orbeccen"],
        "st_teff":    d["st_teff"],
        "st_mass":    d["st_mass"],
        "st_met":     d["st_met"],
        "log_st_luminosity": log_feats["log_st_luminosity"],
        "in_hz":      in_hz,
    }
    X_km = np.array([[km_vec[f] for f in km_feats]])
    X_km_scaled = scaler.transform(X_km)
    cluster_id  = int(km.predict(X_km_scaled)[0])
    cluster_info = kmeans_bundle["cluster_map"][cluster_id]

    # Score tier
    tiers = [
        (85, "Potentially Habitable",  "🟢"),
        (65, "Marginally Survivable",  "🟡"),
        (45, "Hostile",                "🟠"),
        (25, "Extremely Hostile",      "🔴"),
        (0,  "Instant Death",          "💀"),
    ]
    tier, tier_emoji = next((t, e) for th, t, e in tiers if hab_score >= th)

    return {
        "archetype":           cluster_info[0],
        "archetype_emoji":     cluster_info[1],
        "archetype_desc":      cluster_info[2],
        "habitability_score":  round(hab_score, 2),
        "score_tier":          tier,
        "score_emoji":         tier_emoji,
        "in_habitable_zone":   bool(in_hz),
        "component_scores":    {k: round(v, 1) for k, v in comp.items()},
        "derived": {
            "gravity_earth":       round(gravity, 4),
            "stellar_luminosity":  round(st_lum, 4),
            "hz_range_au":         [round(hz_inner, 4), round(hz_outer, 4)],
        }
    }
