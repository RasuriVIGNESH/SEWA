from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

from sklearn.metrics import confusion_matrix


# ============================================================
# Configuration
# ============================================================

PREDICTIONS_PATH = Path("test_predictions.csv")
OUTPUT_PATH = Path("confusion_matrix.png")


# ============================================================
# Load test predictions
# ============================================================

if not PREDICTIONS_PATH.exists():
    raise FileNotFoundError(
        f"Could not find {PREDICTIONS_PATH}. "
        "Run train_model.py first."
    )

predictions = pd.read_csv(PREDICTIONS_PATH)

required_columns = [
    "actual_label",
    "predicted_label",
]

missing_columns = [
    column
    for column in required_columns
    if column not in predictions.columns
]

if missing_columns:
    raise ValueError(
        f"Missing columns in {PREDICTIONS_PATH}: "
        f"{missing_columns}"
    )


# ============================================================
# Prepare labels
# ============================================================

actual_labels = predictions["actual_label"].astype(int)
predicted_labels = predictions["predicted_label"].astype(int)

confusion_matrix_values = confusion_matrix(
    actual_labels,
    predicted_labels,
    labels=[0, 1],
)

true_negative, false_positive, false_negative, true_positive = (
    confusion_matrix_values.ravel()
)


# ============================================================
# Print confusion-matrix values
# ============================================================

print("Confusion matrix:")
print(confusion_matrix_values)

print("\nConfusion matrix details:")
print(f"True negatives:  {true_negative}")
print(f"False positives: {false_positive}")
print(f"False negatives: {false_negative}")
print(f"True positives:  {true_positive}")


# ============================================================
# Generate the image
# ============================================================

sns.set_theme(style="white")

plt.figure(figsize=(8, 6))

axis = sns.heatmap(
    confusion_matrix_values,
    annot=True,
    fmt=",d",
    cmap="Blues",
    cbar=False,
    square=True,
    linewidths=1.5,
    linecolor="white",
    xticklabels=["No Sepsis", "Sepsis"],
    yticklabels=["No Sepsis", "Sepsis"],
    annot_kws={
        "size": 18,
        "weight": "bold",
    },
)

axis.set_xlabel(
    "Predicted Label",
    fontsize=12,
    fontweight="bold",
    labelpad=12,
)

axis.set_ylabel(
    "Actual Label",
    fontsize=12,
    fontweight="bold",
    labelpad=12,
)

axis.set_title(
    "SEWA XGBoost Sepsis Classifier\n"
    "Patient-Level Holdout Test Set",
    fontsize=15,
    fontweight="bold",
    pad=18,
)

plt.tight_layout()

plt.savefig(
    OUTPUT_PATH,
    dpi=300,
    bbox_inches="tight",
    facecolor="white",
)

plt.close()

print(f"\nSaved confusion-matrix image to: {OUTPUT_PATH}")
