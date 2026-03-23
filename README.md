# STARC — Stellar Telemetry and Astronomical Repository and Catalog

A focused, end-to-end data engineering pipeline that ingests publicly available exoplanet data from NASA, cleans and validates it, stores it in DuckDB, and enables SQL-based analytical exploration.

Includes **STARC-SKY**, a validation layer that cross-references host star names against the [CDS SIMBAD](http://simbad.u-strasbg.fr/) astronomical database.

---

## Architecture

```
NASA Exoplanet Archive (TAP API)
          ↓
  scripts/ingest.py        → data/raw/exoplanets_raw.csv
          ↓
  scripts/transform.py     → data/processed/exoplanets_clean.csv
          ↓
  scripts/load.py          → starc.duckdb (exoplanets table)
          ↓
  sql/analysis.sql         → run in DBeaver or duckdb CLI
          ↓
  starc_sky/validate.py    → data/processed/starc_sky_validation.csv
```

---

## Project Structure

```
STARC/
├── config/
│   └── config.py              # Paths, URLs, DB config
├── scripts/
│   ├── ingest.py              # Download raw data from NASA
│   ├── transform.py           # Clean, validate, normalize
│   └── load.py                # Load into DuckDB (idempotent)
├── sql/
│   └── analysis.sql           # 10 analytical queries
├── starc_sky/
│   └── validate.py            # SIMBAD cross-validation layer
├── data/
│   ├── raw/                   # Raw CSV (not committed to git)
│   └── processed/             # Cleaned CSV + validation report
├── run_pipeline.py            # Full pipeline runner
├── requirements.txt
└── README.md
```

---

## Setup

```bash
# 1. Clone and enter the repo
git clone https://github.com/YOUR_USERNAME/STARC.git
cd STARC

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt
```

---

## Running the Pipeline

### Full pipeline (all 4 stages):
```bash
python run_pipeline.py
```

### Skip STARC-SKY validation (faster, no external API calls):
```bash
python run_pipeline.py --skip-sky
```

### Run individual stages:
```bash
python scripts/ingest.py
python scripts/transform.py
python scripts/load.py
python starc_sky/validate.py
```

---

## Querying the Data

Open `starc.duckdb` in [DBeaver](https://dbeaver.io/) or use the CLI:

```bash
duckdb starc.duckdb
```

Then run queries from `sql/analysis.sql`. Example:

```sql
-- Habitable zone candidates
SELECT pl_name, hostname, pl_eqt, pl_rade, sy_dist
FROM exoplanets
WHERE pl_eqt BETWEEN 200 AND 350 AND pl_rade < 2.0
ORDER BY sy_dist ASC;
```

---

## Data Source

- **NASA Exoplanet Archive** — Planetary Systems Composite Parameters (PSCompPars)
- Accessed via the [TAP (Table Access Protocol)](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html) service
- Dataset is publicly available, no authentication required

---

## STARC-SKY Validation

`starc_sky/validate.py` queries the [SIMBAD](http://simbad.u-strasbg.fr/) astronomical database (via `astroquery`) to verify that host star names in the pipeline are resolvable astronomical objects.

- Validates a configurable sample (default: 50 stars)
- Outputs a CSV report with `OK` / `UNRESOLVED` status per star
- Rate-limited by default (0.3s delay between requests) to respect the API

---

## Assumptions & Limitations

- Dataset is treated as static per run (no incremental loading)
- No concurrent access (single-user local tool)
- STARC-SKY validates names only — it does not fetch positional data
- DuckDB is file-based; no server required

---

## Future Enhancements

- Incremental loading with change detection
- Scheduled runs via cron
- Lightweight read-only API (FastAPI)
- Cloud migration (S3 + Motherduck)
