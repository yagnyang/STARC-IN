"""
STARC — ML Module 1: Habitable Zone Classifier
Trains a Random Forest classifier to predict whether a planet
is a habitable zone candidate based on its physical properties.

Label definition (from STARC analysis.sql Query 6):
  - Equilibrium temperature: 200–350 K
  - Planet radius: < 2.0 Earth radii

Output:
  - Classification report
  - Feature importance chart → ml/outputs/feature_importance.png
  - Saved model → ml/outputs/habitable_classifier.pkl
"""

import os
import sys
import joblib
import duckdb
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use("Agg")  # non-interactive backend

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.config import DB_PATH

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Features to train on
FEATURES = [
    "pl_orbper",   # Orbital period (days)
    "pl_rade",     # Planet radius (Earth radii)
    "pl_masse",    # Planet mass (Earth masses)
    "pl_eqt",      # Equilibrium temperature (K)
    "st_teff",     # Stellar effective temperature (K)
    "st_rad",      # Stellar radius (Solar radii)
    "st_mass",     # Stellar mass (Solar masses)
    "st_met",      # Stellar metallicity
    "sy_dist",     # Distance from Earth (pc)
]


def load_data() -> pd.DataFrame:
    print("[CLASSIFIER] Loading data from DuckDB...")
    con = duckdb.connect(DB_PATH, read_only=True)
    df = con.execute("SELECT * FROM exoplanets").fetchdf()
    con.close()
    print(f"[CLASSIFIER] Loaded {len(df)} rows.")
    return df


def create_label(df: pd.DataFrame) -> pd.DataFrame:
    """Define habitable zone candidate label from domain rules."""
    df["is_habitable"] = (
        (df["pl_eqt"] >= 200) & (df["pl_eqt"] <= 350) &
        (df["pl_rade"] < 2.0)
    ).astype(int)
    n_pos = df["is_habitable"].sum()
    print(f"[CLASSIFIER] Label created: {n_pos} habitable candidates out of {len(df)} planets ({n_pos/len(df)*100:.1f}%)")
    return df


def prepare_features(df: pd.DataFrame):
    """Drop rows with missing features, return X and y."""
    available = [f for f in FEATURES if f in df.columns]
    data = df[available + ["is_habitable"]].dropna()
    print(f"[CLASSIFIER] Training on {len(data)} rows after dropping NaNs ({len(df)-len(data)} dropped).")
    X = data[available].values
    y = data["is_habitable"].values
    return X, y, available


def plot_feature_importance(model, feature_names):
    rf = model.named_steps["clf"]
    importances = rf.feature_importances_
    indices = np.argsort(importances)[::-1]

    fig, ax = plt.subplots(figsize=(10, 6))
    fig.patch.set_facecolor("#0a0a0f")
    ax.set_facecolor("#0d0d1a")

    bars = ax.barh(
        [feature_names[i] for i in indices],
        importances[indices],
        color="#00d4ff",
        edgecolor="#0a0a0f"
    )

    ax.set_xlabel("Feature Importance", color="white")
    ax.set_title("STARC — Habitable Zone Classifier\nFeature Importance (Random Forest)", color="white", pad=15)
    ax.tick_params(colors="white")
    ax.spines[:].set_color("#333355")
    ax.invert_yaxis()

    for bar, val in zip(bars, importances[indices]):
        ax.text(val + 0.002, bar.get_y() + bar.get_height()/2,
                f"{val:.3f}", va="center", color="#f5a623", fontsize=9)

    plt.tight_layout()
    out = os.path.join(OUTPUT_DIR, "feature_importance.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"[CLASSIFIER] Feature importance chart saved → {out}")
    plt.close()


def plot_confusion_matrix(y_test, y_pred):
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Not Habitable", "Habitable"])

    fig, ax = plt.subplots(figsize=(6, 5))
    fig.patch.set_facecolor("#0a0a0f")
    ax.set_facecolor("#0d0d1a")
    disp.plot(ax=ax, colorbar=False, cmap="Blues")
    ax.set_title("STARC — Confusion Matrix", color="white", pad=12)
    ax.tick_params(colors="white")
    ax.xaxis.label.set_color("white")
    ax.yaxis.label.set_color("white")

    plt.tight_layout()
    out = os.path.join(OUTPUT_DIR, "confusion_matrix.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"[CLASSIFIER] Confusion matrix saved → {out}")
    plt.close()


def train():
    df = load_data()
    df = create_label(df)
    X, y, feature_names = prepare_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=42,
            class_weight="balanced"  # handles class imbalance (few habitable planets)
        ))
    ])

    print("[CLASSIFIER] Training Random Forest...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("\n[CLASSIFIER] Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Not Habitable", "Habitable"]))

    plot_feature_importance(model, feature_names)
    plot_confusion_matrix(y_test, y_pred)

    model_path = os.path.join(OUTPUT_DIR, "habitable_classifier.pkl")
    joblib.dump(model, model_path)
    print(f"[CLASSIFIER] Model saved → {model_path}")
    print("\n[CLASSIFIER] Done ✓")


if __name__ == "__main__":
    train()
