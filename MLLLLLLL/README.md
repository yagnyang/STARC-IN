# STARC Planet Personality API

ML-powered exoplanet personality cards for the STARC project.

## Setup

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/planet/{name}` | Full personality card for a planet |
| GET | `/search?q=kepler` | Search planets by name |
| GET | `/archetypes` | All 7 archetypes with stats |
| GET | `/archetypes/{name}` | Planets in a specific archetype |
| GET | `/leaderboard/habitable` | Top N most habitable planets |
| GET | `/leaderboard/hostile` | Top N most hostile planets |
| GET | `/random` | Random planet card |
| POST | `/predict` | Score a brand new planet |

## Example Response — `/planet/KELT-9 b`

```json
{
  "planet_name": "KELT-9 b",
  "host_star": "KELT-9",
  "archetype": "Inferno Jupiters",
  "archetype_emoji": "☀️",
  "habitability_score": 13.6,
  "score_tier": "Instant Death",
  "score_emoji": "💀",
  "one_liner": "At 4050K, even the concept of landing here is optimistic. You'd become plasma.",
  "component_scores": {
    "temperature": 0.0,
    "gravity": 0.0,
    "insolation": 0.0,
    "stellar_stability": 30.0,
    "orbit_stability": 100.0,
    "radius": 0.0
  },
  ...
}
```

## Predict a new planet — `POST /predict`

```json
{
  "pl_orbper": 365.0,
  "pl_orbsmax": 1.0,
  "pl_rade": 1.0,
  "pl_bmasse": 1.0,
  "pl_orbeccen": 0.02,
  "pl_insol": 1.0,
  "pl_eqt": 288.0,
  "st_teff": 5778.0,
  "st_mass": 1.0,
  "st_rad": 1.0,
  "st_met": 0.0,
  "sy_dist": 10.0
}
```

## Files needed
- `starc_final.parquet` — 4075 planets with scores and one-liners
- `starc_kmeans.pkl` — K-Means clustering model + scaler
- `starc_gb.pkl` — Gradient Boosting habitability model
