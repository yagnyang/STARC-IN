"""
STARC - Ingestion Module
Downloads raw exoplanet data from NASA Exoplanet Archive TAP service.
"""

import os
import sys
import requests
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.config import DATASET_URL, RAW_FILE, DATA_RAW_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s [INGEST] %(message)s")
log = logging.getLogger(__name__)


def ingest():
    os.makedirs(DATA_RAW_DIR, exist_ok=True)

    log.info("Fetching dataset from NASA Exoplanet Archive...")
    try:
        response = requests.get(DATASET_URL, timeout=60)
        response.raise_for_status()
    except requests.RequestException as e:
        log.error(f"Failed to fetch dataset: {e}")
        raise

    with open(RAW_FILE, "w", encoding="utf-8") as f:
        f.write(response.text)

    lines = response.text.strip().splitlines()
    log.info(f"Downloaded {len(lines) - 1} records → {RAW_FILE}")


if __name__ == "__main__":
    ingest()
