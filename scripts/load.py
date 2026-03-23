"""
STARC - Load Module
Creates DuckDB schema and inserts cleaned exoplanet data idempotently.
"""

import os
import sys
import duckdb
import pandas as pd
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.config import DB_PATH, PROCESSED_FILE

logging.basicConfig(level=logging.INFO, format="%(asctime)s [LOAD] %(message)s")
log = logging.getLogger(__name__)

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS exoplanets (
    pl_name         VARCHAR,
    hostname        VARCHAR,
    sy_snum         INTEGER,
    sy_pnum         INTEGER,
    discoverymethod VARCHAR,
    disc_year       INTEGER,
    pl_orbper       DOUBLE,   -- Orbital period (days)
    pl_rade         DOUBLE,   -- Planet radius (Earth radii)
    pl_masse        DOUBLE,   -- Planet mass (Earth masses)
    pl_eqt          DOUBLE,   -- Equilibrium temperature (K)
    st_teff         DOUBLE,   -- Stellar effective temperature (K)
    st_rad          DOUBLE,   -- Stellar radius (Solar radii)
    st_mass         DOUBLE,   -- Stellar mass (Solar masses)
    st_met          DOUBLE,   -- Stellar metallicity [dex]
    st_logg         DOUBLE,   -- Stellar surface gravity (log10 cm/s^2)
    sy_dist         DOUBLE    -- Distance from Earth (pc)
);
"""


def load():
    if not os.path.exists(PROCESSED_FILE):
        raise FileNotFoundError(f"Processed file not found: {PROCESSED_FILE}. Run transform.py first.")

    log.info(f"Connecting to DuckDB at {DB_PATH}...")
    con = duckdb.connect(DB_PATH)

    log.info("Creating schema (if not exists)...")
    con.execute(SCHEMA_SQL)

    # Idempotency: truncate before reload to avoid duplicates on re-run
    existing = con.execute("SELECT COUNT(*) FROM exoplanets").fetchone()[0]
    if existing > 0:
        log.info(f"Table has {existing} existing rows — truncating for clean reload.")
        con.execute("DELETE FROM exoplanets")

    log.info(f"Loading data from {PROCESSED_FILE}...")
    df = pd.read_csv(PROCESSED_FILE, low_memory=False)

    # Only insert columns that exist in both df and schema
    schema_cols = [
        "pl_name", "hostname", "sy_snum", "sy_pnum", "discoverymethod",
        "disc_year", "pl_orbper", "pl_rade", "pl_masse", "pl_eqt",
        "st_teff", "st_rad", "st_mass", "st_met", "st_logg", "sy_dist"
    ]
    df = df[[c for c in schema_cols if c in df.columns]]

    con.execute("INSERT INTO exoplanets SELECT * FROM df")
    count = con.execute("SELECT COUNT(*) FROM exoplanets").fetchone()[0]
    log.info(f"Load complete. {count} rows now in exoplanets table.")
    con.close()


if __name__ == "__main__":
    load()
