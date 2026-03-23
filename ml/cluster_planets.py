"""
STARC — ML Module 2: Planet Type Clustering
Groups exoplanets into natural clusters using K-Means and DBSCAN
purely from physical properties — no hardcoded labels.

Expected clusters roughly correspond to:
  - Rocky / Earth-like
  - Super-Earths
  - Neptune-like
  - Gas Giants / Hot Jupiters

Output:
  - Cluster scatter plot → ml/outputs/planet_clusters.png
  - Cluster summary CSV → ml/outputs/cluster_summary.csv
  - DBSCAN outlier plot → ml/outputs/dbscan_outliers.png
"""

import os
import sys
import duckdb
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use("Agg")

from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.config import DB_PATH

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

CLUSTER_FEATURES = ["pl_rade", "pl_masse", "pl_orbper", "pl_eqt"]
CLUSTER_LABELS = {
    0: "Rocky",
    1: "Super-Earth",
    2: "Neptune-like",
    3: "Gas Giant"
}
CLUSTER_COLORS = ["#f5a623", "#00d4ff", "#7b61ff", "#ff4f6d"]


def load_data() -> pd.DataFrame:
    print("[CLUSTER] Loading data from DuckDB...")
    con = duckdb.connect(DB_PATH, read_only=True)
    df = con.execute("SELECT * FROM exoplanets").fetchdf()
    con.close()
    available = [f for f in CLUSTER_FEATURES if f in df.columns]
    df = df[["pl_name"] + available].dropna()
    print(f"[CLUSTER] {len(df)} planets with complete feature data.")
    return df


def run_kmeans(X_scaled, df, feature_names):
    print("[CLUSTER] Running K-Means (k=4)...")
    km = KMeans(n_clusters=4, random_state=42, n_init=10)
    df["cluster"] = km.fit_predict(X_scaled)

    # PCA to 2D for plotting
    pca = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(X_scaled)

    fig, ax = plt.subplots(figsize=(11, 7))
    fig.patch.set_facecolor("#0a0a0f")
    ax.set_facecolor("#0d0d1a")

    for cluster_id, color in enumerate(CLUSTER_COLORS):
        mask = df["cluster"] == cluster_id
        ax.scatter(
            coords[mask, 0], coords[mask, 1],
            c=color, label=CLUSTER_LABELS.get(cluster_id, f"Cluster {cluster_id}"),
            alpha=0.6, s=18, edgecolors="none"
        )

    ax.set_xlabel("PCA Component 1", color="white")
    ax.set_ylabel("PCA Component 2", color="white")
    ax.set_title("STARC — Planet Type Clustering (K-Means, k=4)\nFeatures: radius, mass, orbital period, eq. temperature",
                 color="white", pad=12)
    ax.tick_params(colors="white")
    ax.spines[:].set_color("#333355")
    legend = ax.legend(facecolor="#0d0d1a", edgecolor="#333355", labelcolor="white")

    plt.tight_layout()
    out = os.path.join(OUTPUT_DIR, "planet_clusters.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"[CLUSTER] Cluster plot saved → {out}")
    plt.close()

    # Summary
    summary = df.groupby("cluster")[feature_names].mean().round(3)
    summary["count"] = df.groupby("cluster").size()
    summary.index = [CLUSTER_LABELS.get(i, f"Cluster {i}") for i in summary.index]
    out_csv = os.path.join(OUTPUT_DIR, "cluster_summary.csv")
    summary.to_csv(out_csv)
    print(f"[CLUSTER] Cluster summary saved → {out_csv}")
    print("\n[CLUSTER] Cluster Means:")
    print(summary.to_string())

    return df


def run_dbscan(X_scaled, df):
    print("\n[CLUSTER] Running DBSCAN (outlier/anomaly detection)...")
    db = DBSCAN(eps=0.8, min_samples=5)
    labels = db.fit_predict(X_scaled)

    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    n_outliers = (labels == -1).sum()
    print(f"[CLUSTER] DBSCAN found {n_clusters} clusters, {n_outliers} outliers/anomalies.")

    pca = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(X_scaled)

    fig, ax = plt.subplots(figsize=(11, 7))
    fig.patch.set_facecolor("#0a0a0f")
    ax.set_facecolor("#0d0d1a")

    core_mask = labels != -1
    outlier_mask = labels == -1

    ax.scatter(coords[core_mask, 0], coords[core_mask, 1],
               c="#00d4ff", alpha=0.4, s=12, label="Core planets", edgecolors="none")
    ax.scatter(coords[outlier_mask, 0], coords[outlier_mask, 1],
               c="#ff4f6d", alpha=0.9, s=30, label=f"Anomalies ({n_outliers})", edgecolors="none")

    ax.set_xlabel("PCA Component 1", color="white")
    ax.set_ylabel("PCA Component 2", color="white")
    ax.set_title("STARC — DBSCAN Anomaly Detection\nRed points = statistically unusual exoplanets",
                 color="white", pad=12)
    ax.tick_params(colors="white")
    ax.spines[:].set_color("#333355")
    ax.legend(facecolor="#0d0d1a", edgecolor="#333355", labelcolor="white")

    plt.tight_layout()
    out = os.path.join(OUTPUT_DIR, "dbscan_outliers.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"[CLUSTER] DBSCAN plot saved → {out}")
    plt.close()

    # Print some outlier planet names
    outlier_names = df.loc[outlier_mask, "pl_name"].head(10).tolist()
    print(f"[CLUSTER] Sample anomalous planets: {outlier_names}")


def cluster():
    df = load_data()
    available = [f for f in CLUSTER_FEATURES if f in df.columns]
    X = df[available].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    df = run_kmeans(X_scaled, df, available)
    run_dbscan(X_scaled, df)

    print("\n[CLUSTER] Done ✓")


if __name__ == "__main__":
    cluster()
