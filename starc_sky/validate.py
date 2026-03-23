"""
STARC-SKY — Validation Layer
Cross-validates host star names against the CDS SIMBAD database
using the astroquery library. Flags any unresolvable entries.
"""

import os
import sys
import time
import duckdb
import pandas as pd
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.config import DB_PATH

logging.basicConfig(level=logging.INFO, format="%(asctime)s [STARC-SKY] %(message)s")
log = logging.getLogger(__name__)

try:
    from astroquery.simbad import Simbad
    ASTROQUERY_AVAILABLE = True
except ImportError:
    ASTROQUERY_AVAILABLE = False
    log.warning("astroquery not installed. Install with: pip install astroquery")


def validate_stars(sample_size: int = 50, delay: float = 0.3) -> pd.DataFrame:
    """
    Queries SIMBAD for a sample of host star names from the STARC database.
    Returns a DataFrame with validation results.

    Args:
        sample_size: Number of unique host stars to validate (keep small to avoid rate-limiting).
        delay: Seconds between SIMBAD requests (be a polite API citizen).
    """
    if not ASTROQUERY_AVAILABLE:
        raise ImportError("astroquery is required. Run: pip install astroquery")

    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"DuckDB not found at {DB_PATH}. Run the full pipeline first.")

    con = duckdb.connect(DB_PATH, read_only=True)
    hosts = con.execute(
        f"SELECT DISTINCT hostname FROM exoplanets WHERE hostname IS NOT NULL LIMIT {sample_size}"
    ).fetchdf()
    con.close()

    log.info(f"Validating {len(hosts)} host stars against SIMBAD...")

    results = []
    simbad = Simbad()
    simbad.TIMEOUT = 20

    for _, row in hosts.iterrows():
        star = row["hostname"]
        try:
            result = simbad.query_object(star)
            resolved = result is not None
        except Exception as e:
            log.debug(f"SIMBAD query failed for '{star}': {e}")
            resolved = False

        results.append({
            "hostname": star,
            "simbad_resolved": resolved,
            "status": "OK" if resolved else "UNRESOLVED"
        })
        time.sleep(delay)

    df_results = pd.DataFrame(results)
    ok = df_results["simbad_resolved"].sum()
    total = len(df_results)
    log.info(f"Validation complete: {ok}/{total} stars resolved in SIMBAD.")

    unresolved = df_results[~df_results["simbad_resolved"]]
    if not unresolved.empty:
        log.warning(f"Unresolved stars ({len(unresolved)}):")
        for name in unresolved["hostname"].tolist():
            log.warning(f"  - {name}")

    return df_results


def save_validation_report(df: pd.DataFrame):
    """Save validation results to CSV in data/processed/."""
    out_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data", "processed", "starc_sky_validation.csv"
    )
    df.to_csv(out_path, index=False)
    log.info(f"Validation report saved → {out_path}")


if __name__ == "__main__":
    df_validation = validate_stars(sample_size=50)
    save_validation_report(df_validation)
    print("\n--- STARC-SKY Validation Summary ---")
    print(df_validation["status"].value_counts().to_string())
