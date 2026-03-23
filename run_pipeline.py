"""
STARC — Pipeline Runner
Executes all stages in order: Ingest → Transform → Load → (optional) STARC-SKY Validate
"""

import sys
import logging
import argparse

logging.basicConfig(level=logging.INFO, format="%(asctime)s [PIPELINE] %(message)s")
log = logging.getLogger(__name__)


def run(skip_sky: bool = False):
    log.info("=" * 50)
    log.info("  STARC Pipeline Starting")
    log.info("=" * 50)

    # Stage 1: Ingest
    log.info("\n--- Stage 1: Ingestion ---")
    from scripts.ingest import ingest
    ingest()

    # Stage 2: Transform
    log.info("\n--- Stage 2: Transformation ---")
    from scripts.transform import transform
    transform()

    # Stage 3: Load
    log.info("\n--- Stage 3: Load to DuckDB ---")
    from scripts.load import load
    load()

    # Stage 4 (optional): STARC-SKY Validation
    if not skip_sky:
        log.info("\n--- Stage 4: STARC-SKY Validation ---")
        try:
            from starc_sky.validate import validate_stars, save_validation_report
            df = validate_stars(sample_size=30)
            save_validation_report(df)
        except ImportError as e:
            log.warning(f"STARC-SKY skipped: {e}")
        except Exception as e:
            log.error(f"STARC-SKY validation failed: {e}")
    else:
        log.info("\nStage 4: STARC-SKY skipped (--skip-sky flag set)")

    log.info("\n" + "=" * 50)
    log.info("  STARC Pipeline Complete ✓")
    log.info("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="STARC Pipeline Runner")
    parser.add_argument("--skip-sky", action="store_true", help="Skip STARC-SKY validation stage")
    args = parser.parse_args()
    run(skip_sky=args.skip_sky)
