import os

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

# DuckDB
DB_PATH = os.path.join(BASE_DIR, "starc.duckdb")

# NASA Exoplanet Archive - Planetary Systems Composite Parameters table
DATASET_URL = (
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query="
    "select+pl_name,hostname,sy_snum,sy_pnum,discoverymethod,disc_year,"
    "pl_orbper,pl_rade,pl_masse,pl_eqt,st_teff,st_rad,st_mass,st_met,st_logg,sy_dist"
    "+from+pscomppars&format=csv"
)

RAW_FILE = os.path.join(DATA_RAW_DIR, "exoplanets_raw.csv")
PROCESSED_FILE = os.path.join(DATA_PROCESSED_DIR, "exoplanets_clean.csv")
