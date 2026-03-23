"""
STARC — ML Module 2: Planet Clustering (CSV version)
K-Means + DBSCAN on cleaned CSV data.
Compares KMeans clusters against actual planet_type labels.

Output: ml/outputs/planet_clusters.png
        ml/outputs/dbscan_outliers.png
        ml/outputs/cluster_summary.csv
        ml/outputs/cluster_vs_label.png
"""

import os
import sys
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

FEATURES = ["orbital_period", "planet_mass", "stellar_mass", "distance"]
COLORS   = ["#f5a623", "#00d4ff", "#7b61ff", "#ff4f6d", "#00ff9f", "#ffffff"]


def load(csv_path: str):
    print(f"[CLUSTER] Loading {csv_path}...")
    df = pd.read_csv(csv_path)
    available = [f for f in FEATURES if f in df.columns]
    df_clean = df[available + ["planet_name", "planet_type"]].dropna()
    print(f"[CLUSTER] {len(df_clean)} usable rows.")
    return df_clean, available


def run_kmeans(X_scaled, df, feature_names, n_clusters=6):
    print(f"[CLUSTER] K-Means k={n_clusters}...")
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df = df.copy()
    df["cluster"] = km.fit_predict(X_scaled)

    pca    = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(X_scaled)

    fig, ax = plt.subplots(figsize=(12, 7))
    fig.patch.set_facecolor("#0a0a0f")
    ax.set_facecolor("#0d0d1a")

    for i in range(n_clusters):
        mask = df["cluster"] == i
        ax.scatter(coords[mask, 0], coords[mask, 1],
                   c=COLORS[i % len(COLORS)], label=f"Cluster {i}",
                   alpha=0.6, s=18, edgecolors="none")

    ax.set_xlabel("PCA Component 1", color="white")
    ax.set_ylabel("PCA Component 2", color="white")
    ax.set_title("STARC — Planet Clustering (K-Means)\nFeatures: mass, period, stellar mass, distance",
                 color="white", pad=12)
    ax.tick_params(colors="white")
    ax.spines[:].set_color("#333355")
    ax.legend(facecolor="#0d0d1a", edgecolor="#333355", labelcolor="white")
    plt.tight_layout()
    out = os.path.join(OUTPUT_DIR, "planet_clusters.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"[CLUSTER] Clusters saved → {out}")
    plt.close()

    # Summary
    summary = df.groupby("cluster")[feature_names].mean().round(3)
    summary["count"] = df.groupby("cluster").size()
    # Most common planet_type per cluster
    summary["dominant_type"] = df.groupby("cluster")["planet_type"].agg(lambda x: x.value_counts().index[0])
    summary.to_csv(os.path.join(OUTPUT_DIR, "cluster_summary.csv"))
    print("[CLUSTER] Cluster summary:")
    print(summary.to_string())

    # Cluster vs actual label comparison
    fig2, ax2 = plt.subplots(figsize=(12, 7))
    fig2.patch.set_facecolor("#0a0a0f")
    ax2.set_facecolor("#0d0d1a")
    types  = df["planet_type"].unique()
    colors = {t: COLORS[i % len(COLORS)] for i, t in enumerate(types)}
    for t in types:
        mask = df["planet_type"] == t
        ax2.scatter(coords[mask, 0], coords[mask, 1],
                    c=colors[t], label=t, alpha=0.6, s=18, edgecolors="none")
    ax2.set_xlabel("PCA Component 1", color="white")
    ax2.set_ylabel("PCA Component 2", color="white")
    ax2.set_title("STARC — Actual Planet Types (same PCA space)\nCompare with K-Means clusters above",
                  color="white", pad=12)
    ax2.tick_params(colors="white")
    ax2.spines[:].set_color("#333355")
    ax2.legend(facecolor="#0d0d1a", edgecolor="#333355", labelcolor="white", fontsize=8)
    plt.tight_layout()
    out2 = os.path.join(OUTPUT_DIR, "cluster_vs_label.png")
    plt.savefig(out2, dpi=150, bbox_inches="tight", facecolor=fig2.get_facecolor())
    print(f"[CLUSTER] Cluster vs label saved → {out2}")
    plt.close()

    return df


def run_dbscan(X_scaled, df):
    print("[CLUSTER] Running DBSCAN...")
    labels   = DBSCAN(eps=0.8, min_samples=5).fit_predict(X_scaled)
    pca      = PCA(n_components=2, random_state=42)
    coords   = pca.fit_transform(X_scaled)
    n_out    = (labels == -1).sum()
    print(f"[CLUSTER] {n_out} anomalies detected.")

    fig, ax = plt.subplots(figsize=(12, 7))
    fig.patch.set_facecolor("#0a0a0f")
    ax.set_facecolor("#0d0d1a")
    ax.scatter(coords[labels != -1, 0], coords[labels != -1, 1],
               c="#00d4ff", alpha=0.4, s=12, label="Core planets", edgecolors="none")
    ax.scatter(coords[labels == -1, 0], coords[labels == -1, 1],
               c="#ff4f6d", alpha=0.9, s=30, label=f"Anomalies ({n_out})", edgecolors="none")
    ax.set_xlabel("PCA Component 1", color="white")
    ax.set_ylabel("PCA Component 2", color="white")
    ax.set_title("STARC — DBSCAN Anomaly Detection\nRed = statistically unusual planets",
                 color="white", pad=12)
    ax.tick_params(colors="white")
    ax.spines[:].set_color("#333355")
    ax.legend(facecolor="#0d0d1a", edgecolor="#333355", labelcolor="white")
    plt.tight_layout()
    out = os.path.join(OUTPUT_DIR, "dbscan_outliers.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"[CLUSTER] DBSCAN saved → {out}")
    plt.close()

    outliers = df[labels == -1]["planet_name"].head(10).tolist()
    print(f"[CLUSTER] Sample anomalous planets: {outliers}")


def cluster(csv_path: str):
    df, available = load(csv_path)
    X        = df[available].values
    X_scaled = StandardScaler().fit_transform(X)
    df       = run_kmeans(X_scaled, df, available, n_clusters=6)
    run_dbscan(X_scaled, df)
    print("\n[CLUSTER] Done ✓")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to cleaned CSV file")
    args = parser.parse_args()
    cluster(csv_path=args.csv)
