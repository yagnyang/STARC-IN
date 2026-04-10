"""
STARC - Transformation Module
Cleans, validates, and normalises raw exoplanet CSV data.
"""

import os
import sys
import pandas as pd
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.config import RAW_FILE, PROCESSED_FILE, DATA_PROCESSED_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s [TRANSFORM] %(message)s")
log = logging.getLogger(__name__)

# Columns that must be physically non-negative
NON_NEGATIVE_COLS = [
    "pl_orbper", "pl_rade", "pl_masse", "pl_eqt",
    "st_teff", "st_rad", "st_mass", "sy_dist"
]


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Lowercase + strip whitespace from column names."""
    df.columns = [c.strip().lower() for c in df.columns]
    return df


def cast_numeric(df: pd.DataFrame) -> pd.DataFrame:
    """Coerce expected numeric columns; non-parseable become NaN."""
    numeric_cols = [
        "pl_orbper", "pl_rade", "pl_masse", "pl_eqt",
        "st_teff", "st_rad", "st_mass", "st_met", "st_logg",
        "sy_dist", "disc_year", "sy_snum", "sy_pnum"
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def validate_non_negative(df: pd.DataFrame) -> pd.DataFrame:
    """Flag and remove rows with physically invalid negative values."""
    before = len(df)
    for col in NON_NEGATIVE_COLS:
        if col in df.columns:
            invalid = df[col] < 0
            if invalid.any():
                log.warning(f"  {invalid.sum()} negative values in '{col}' — flagged as NaN")
                df.loc[invalid, col] = pd.NA
    log.info(f"Validation pass complete. Rows: {before} → {len(df)}")
    return df


def drop_unusable_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Drop rows missing both planet name and host name."""
    before = len(df)
    df = df.dropna(subset=["pl_name", "hostname"])
    log.info(f"Dropped {before - len(df)} rows with no planet/host name.")
    return df


def transform():
    if not os.path.exists(RAW_FILE):
        raise FileNotFoundError(f"Raw file not found: {RAW_FILE}. Run ingest.py first.")

    log.info(f"Reading raw data from {RAW_FILE}...")
    # NASA TAP CSV includes comment lines starting with '#'
    df = pd.read_csv(RAW_FILE, comment="#", low_memory=False)
    log.info(f"Loaded {len(df)} rows, {len(df.columns)} columns.")

    df = normalize_columns(df)
    df = cast_numeric(df)
    df = validate_non_negative(df)
    df = drop_unusable_rows(df)

    # Strip string columns
    str_cols = ["pl_name", "hostname", "discoverymethod"]
    for col in str_cols:
        if col in df.columns:
            df[col] = df[col].str.strip()

    os.makedirs(DATA_PROCESSED_DIR, exist_ok=True)
    df.to_csv(PROCESSED_FILE, index=False)
    log.info(f"Clean data saved → {PROCESSED_FILE} ({len(df)} rows)")
    return df


if __name__ == "__main__":
    transform()