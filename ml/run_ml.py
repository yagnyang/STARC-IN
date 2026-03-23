"""
STARC — ML Runner
Runs all ML modules in sequence.
Usage:
  python ml/run_ml.py                  # run both
  python ml/run_ml.py --only classify  # classifier only
  python ml/run_ml.py --only cluster   # clustering only
"""

import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    parser = argparse.ArgumentParser(description="STARC ML Runner")
    parser.add_argument("--only", choices=["classify", "cluster"], help="Run only one module")
    args = parser.parse_args()

    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "processed", "planetary_systems_data_transformed_V5_for_visualisation.csv")

    if args.only != "cluster":
        print("=" * 55)
        print("  Module 1: Planet Type Classifier (Random Forest)")
        print("=" * 55)
        from ml.classify_planets import train
        train(csv_path=csv_path)

    if args.only != "classify":
        print("\n" + "=" * 55)
        print("  Module 2: Planet Type Clustering (K-Means + DBSCAN)")
        print("=" * 55)
        from ml.cluster_planets_v2 import cluster
        cluster(csv_path=csv_path)

    print("\n✓ All ML modules complete. Outputs in ml/outputs/")


if __name__ == "__main__":
    main()
