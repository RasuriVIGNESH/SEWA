from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report,
    roc_curve,
    precision_recall_curve,
)

MODEL_PATH = Path("app/model/sepsis_model.pkl")
MEDIAN_PATH = Path("app/model/medians.pkl")
DATASET_PATH = Path("app/data/Dataset.csv")

THRESHOLD = 0.45
RANDOM_STATE = 42
TEST_SIZE = 0.20

# Load model and preprocessing values
model = joblib.load(MODEL_PATH)
medians = joblib.load(MEDIAN_PATH)

# The saved medians define the feature order expected by the model
FEATURES = list(medians.index)
TARGET = "sepsisLabel"

print("Features used for evaluation:")
print(FEATURES)

# Load dataset
df = pd.read_csv(DATASET_PATH)

# Validate required columns
required_columns = FEATURES + [TARGET]
missing_columns = [
    column for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"The following required columns are missing from the dataset: "
        f"{missing_columns}"
    )

# Keep only the model features and target
data = df[required_columns].copy()

# Convert values to numeric
for column in FEATURES + [TARGET]:
    data[column] = pd.to_numeric(data[column], errors="coerce")

# Remove rows without a target label
data = data.dropna(subset=[TARGET])

# Ensure labels are integers
data[TARGET] = data[TARGET].astype(int)

# Fill missing feature values exactly as the application does
for column in FEATURES:
    data[column] = data[column].fillna(medians[column])

X = data[FEATURES]
y = data[TARGET]

print("\nDataset after preprocessing:")
print(f"Rows: {len(data)}")
print(f"Features: {FEATURES}")
print("\nClass distribution:")
print(y.value_counts())
print("\nClass distribution percentage:")
print((y.value_counts(normalize=True) * 100).round(2))

# Create a stratified holdout set
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=y,
)

# Generate probability predictions
if not hasattr(model, "predict_proba"):
    raise TypeError("The saved model does not support predict_proba().")

probabilities = model.predict_proba(X_test)[:, 1]

# Apply the same threshold used by the application
predictions = (probabilities >= THRESHOLD).astype(int)

# Calculate metrics
accuracy = accuracy_score(y_test, predictions)
balanced_accuracy = balanced_accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions, zero_division=0)
recall = recall_score(y_test, predictions, zero_division=0)
f1 = f1_score(y_test, predictions, zero_division=0)
roc_auc = roc_auc_score(y_test, probabilities)
pr_auc = average_precision_score(y_test, probabilities)

print("\n" + "=" * 70)
print("MODEL EVALUATION RESULTS")
print("=" * 70)

print(f"Decision threshold: {THRESHOLD}")
print(f"Test rows: {len(y_test)}")
print(f"Accuracy: {accuracy:.4f} ({accuracy * 100:.2f}%)")
print(f"Balanced accuracy: {balanced_accuracy:.4f}")
print(f"Precision: {precision:.4f} ({precision * 100:.2f}%)")
print(f"Recall/Sensitivity: {recall:.4f} ({recall * 100:.2f}%)")
print(f"F1-score: {f1:.4f}")
print(f"ROC-AUC: {roc_auc:.4f}")
print(f"PR-AUC: {pr_auc:.4f}")

print("\nConfusion matrix:")
print(confusion_matrix(y_test, predictions))

print("\nClassification report:")
print(
    classification_report(
        y_test,
        predictions,
        target_names=["No sepsis", "Sepsis"],
        zero_division=0,
    )
)

# Show the four confusion matrix values separately
tn, fp, fn, tp = confusion_matrix(y_test, predictions).ravel()

print("Confusion matrix details:")
print(f"True negatives: {tn}")
print(f"False positives: {fp}")
print(f"False negatives: {fn}")
print(f"True positives: {tp}")

# Save row-level predictions
results = X_test.copy()
results["actual_label"] = y_test
results["predicted_probability"] = probabilities
results["predicted_label"] = predictions

results.to_csv("model_predictions.csv", index=False)

print("\nSaved predictions to model_predictions.csv")

# Save metrics to a text file
with open("evaluation_results.txt", "w", encoding="utf-8") as file:
    file.write("SEWA XGBoost Model Evaluation\n")
    file.write("=" * 50 + "\n")
    file.write(f"Decision threshold: {THRESHOLD}\n")
    file.write(f"Test rows: {len(y_test)}\n")
    file.write(f"Accuracy: {accuracy:.4f}\n")
    file.write(f"Balanced accuracy: {balanced_accuracy:.4f}\n")
    file.write(f"Precision: {precision:.4f}\n")
    file.write(f"Recall/Sensitivity: {recall:.4f}\n")
    file.write(f"F1-score: {f1:.4f}\n")
    file.write(f"ROC-AUC: {roc_auc:.4f}\n")
    file.write(f"PR-AUC: {pr_auc:.4f}\n")
    file.write("\nConfusion matrix:\n")
    file.write(str(confusion_matrix(y_test, predictions)))
    file.write("\n\nClassification report:\n")
    file.write(
        classification_report(
            y_test,
            predictions,
            target_names=["No sepsis", "Sepsis"],
            zero_division=0,
        )
    )

print("Saved metrics to evaluation_results.txt")
