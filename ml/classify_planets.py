"""
STARC — ML Module 1: Planet Type Classifier
Trains a Random Forest classifier to predict planet_type
(Super Jupiter, Gas Giant, Neptune-like, Super Earth, Rocky, etc.)
from physical and orbital properties.

Input:  cleaned CSV (planetary_systems_data_transformed_V5_for_visualisation.csv)
Output: ml/outputs/feature_importance.png
        ml/outputs/confusion_matrix.png
        ml/outputs/classification_report.txt
        ml/outputs/planet_classifier.pkl
"""

import os
import sys
import joblib
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

FEATURES = ["orbital_period", "planet_mass", "stellar_mass", "distance", "number_of_planets", "number_of_stars"]
LABEL    = "planet_type"


def load_data(csv_path: str) -> pd.DataFrame:
    print(f"[CLASSIFIER] Loading {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"[CLASSIFIER] {len(df)} rows loaded.")
    print(f"[CLASSIFIER] Planet types: {sorted(df[LABEL].dropna().unique())}")
    return df


def prepare(df):
    available = [f for f in FEATURES if f in df.columns]
    data = df[available + [LABEL]].dropna()
    print(f"[CLASSIFIER] {len(data)} rows after dropping NaNs.")
    le = LabelEncoder()
    y  = le.fit_transform(data[LABEL])
    X  = data[available].values
    print(f"[CLASSIFIER] Classes: {list(le.classes_)}")
    return X, y, available, le


def plot_feature_importance(model, feature_names):
    rf = model.named_steps["clf"]
    importances = rf.feature_importances_
    indices = np.argsort(importances)[::-1]
    fig, ax = plt.subplots(figsize=(10, 6))
    fig.patch.set_facecolor("#0a0a0f")
    ax.set_facecolor("#0d0d1a")
    bars = ax.barh([feature_names[i] for i in indices], importances[indices], color="#00d4ff", edgecolor="#0a0a0f")
    ax.set_xlabel("Feature Importance", color="white")
    ax.set_title("STARC — Planet Type Classifier\nFeature Importance (Random Forest)", color="white", pad=15)
    ax.tick_params(colors="white")
    ax.spines[:].set_color("#333355")
    ax.invert_yaxis()
    for bar, val in zip(bars, importances[indices]):
        ax.text(val + 0.002, bar.get_y() + bar.get_height()/2, f"{val:.3f}", va="center", color="#f5a623", fontsize=9)
    plt.tight_layout()
    out = os.path.join(OUTPUT_DIR, "feature_importance.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"[CLASSIFIER] Feature importance saved → {out}")
    plt.close()


def plot_confusion_matrix(y_test, y_pred, classes):
    cm   = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=classes)
    fig, ax = plt.subplots(figsize=(9, 7))
    fig.patch.set_facecolor("#0a0a0f")
    ax.set_facecolor("#0d0d1a")
    disp.plot(ax=ax, colorbar=False, cmap="Blues", xticks_rotation=45)
    ax.set_title("STARC — Planet Type Confusion Matrix", color="white", pad=12)
    ax.tick_params(colors="white")
    ax.xaxis.label.set_color("white")
    ax.yaxis.label.set_color("white")
    plt.tight_layout()
    out = os.path.join(OUTPUT_DIR, "confusion_matrix.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"[CLASSIFIER] Confusion matrix saved → {out}")
    plt.close()


def train(csv_path: str):
    df = load_data(csv_path)
    X, y, feature_names, le = prepare(df)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42,
                                          class_weight="balanced", n_jobs=-1))
    ])

    print("[CLASSIFIER] Training...")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    report = classification_report(y_test, y_pred, target_names=le.classes_)
    print("\n[CLASSIFIER] Classification Report:")
    print(report)

    with open(os.path.join(OUTPUT_DIR, "classification_report.txt"), "w") as f:
        f.write(report)

    plot_feature_importance(model, feature_names)
    plot_confusion_matrix(y_test, y_pred, le.classes_)

    joblib.dump({"model": model, "label_encoder": le, "features": feature_names},
                os.path.join(OUTPUT_DIR, "planet_classifier.pkl"))
    print(f"[CLASSIFIER] Model saved → {OUTPUT_DIR}/planet_classifier.pkl")
    print("\n[CLASSIFIER] Done ✓")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to cleaned CSV file")
    args = parser.parse_args()
    train(csv_path=args.csv)
