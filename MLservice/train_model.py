from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit


# ============================================================
# Configuration
# ============================================================

DATASET_PATH = Path("app/data/Dataset.csv")
MODEL_PATH = Path("app/model/sepsis_model.pkl")
MEDIANS_PATH = Path("app/model/medians.pkl")

TEST_SIZE = 0.20
RANDOM_STATE = 42
DECISION_THRESHOLD = 0.45

# The application expects these features in this exact order.
FEATURES = [
    "HR",
    "O2Sat",
    "Temp",
    "SBP",
    "MAP",
    "DBP",
    "Resp",
    "EtCO2",
    "BaseExcess",
    "HCO3",
    "FiO2",
    "pH",
    "PaCO2",
    "SaO2",
    "AST",
    "BUN",
    "Alkalinephos",
    "Calcium",
    "Chloride",
    "Creatinine",
    "Bilirubin_direct",
    "Glucose",
    "Lactate",
    "Magnesium",
    "Phosphate",
    "Potassium",
    "Bilirubin_total",
    "TroponinI",
    "Hct",
    "Hgb",
    "PTT",
    "WBC",
    "Fibrinogen",
    "Platelets",
    "Age",
    "Gender",
]

TARGET_COLUMN = "SepsisLabel"
GROUP_COLUMN = "Patient_ID"


# ============================================================
# Helper functions
# ============================================================

def validate_dataset(df: pd.DataFrame) -> None:
    """Validate that all required columns are available."""

    required_columns = FEATURES + [TARGET_COLUMN, GROUP_COLUMN]

    missing_columns = [
        column for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            "The following required columns are missing from the dataset:\n"
            f"{missing_columns}\n\n"
            f"Available columns are:\n{df.columns.tolist()}"
        )


def choose_patient_level_split(
    X: pd.DataFrame,
    y: pd.Series,
    groups: pd.Series,
):
    """
    Create a patient-level train/test split.

    The same Patient_ID is never placed in both training and test data.
    Several random states are attempted to ensure both classes exist in
    both splits.
    """

    for seed in range(RANDOM_STATE, RANDOM_STATE + 100):
        splitter = GroupShuffleSplit(
            n_splits=1,
            test_size=TEST_SIZE,
            random_state=seed,
        )

        train_indices, test_indices = next(
            splitter.split(X, y, groups=groups)
        )

        y_train = y.iloc[train_indices]
        y_test = y.iloc[test_indices]

        if (
            y_train.nunique() == 2
            and y_test.nunique() == 2
        ):
            return train_indices, test_indices, seed

    raise ValueError(
        "Could not create a patient-level split containing both classes "
        "in the training and test sets. Check the number of patients and "
        "the distribution of SepsisLabel."
    )


def calculate_metrics(
    y_true: pd.Series,
    probabilities: np.ndarray,
    threshold: float,
) -> dict:
    """Calculate binary-classification metrics."""

    predictions = (
        probabilities >= threshold
    ).astype(int)

    metrics = {
        "accuracy": accuracy_score(y_true, predictions),
        "balanced_accuracy": balanced_accuracy_score(
            y_true,
            predictions,
        ),
        "precision": precision_score(
            y_true,
            predictions,
            zero_division=0,
        ),
        "recall": recall_score(
            y_true,
            predictions,
            zero_division=0,
        ),
        "f1_score": f1_score(
            y_true,
            predictions,
            zero_division=0,
        ),
        "roc_auc": roc_auc_score(
            y_true,
            probabilities,
        ),
        "pr_auc": average_precision_score(
            y_true,
            probabilities,
        ),
        "predictions": predictions,
        "confusion_matrix": confusion_matrix(
            y_true,
            predictions,
            labels=[0, 1],
        ),
    }

    return metrics


def print_metrics(
    y_true: pd.Series,
    probabilities: np.ndarray,
    metrics: dict,
    threshold: float,
) -> None:
    """Print model evaluation results."""

    matrix = metrics["confusion_matrix"]
    true_negative, false_positive, false_negative, true_positive = (
        matrix.ravel()
    )

    print("\n" + "=" * 75)
    print("SEWA XGBOOST MODEL EVALUATION")
    print("=" * 75)

    print(f"Decision threshold: {threshold}")
    print(f"Test rows: {len(y_true)}")
    print(f"Actual negative samples: {(y_true == 0).sum()}")
    print(f"Actual positive samples: {(y_true == 1).sum()}")

    print("\nMetrics:")
    print(
        f"Accuracy:            "
        f"{metrics['accuracy']:.4f} "
        f"({metrics['accuracy'] * 100:.2f}%)"
    )
    print(
        f"Balanced accuracy:   "
        f"{metrics['balanced_accuracy']:.4f}"
    )
    print(
        f"Precision:           "
        f"{metrics['precision']:.4f} "
        f"({metrics['precision'] * 100:.2f}%)"
    )
    print(
        f"Recall/Sensitivity:   "
        f"{metrics['recall']:.4f} "
        f"({metrics['recall'] * 100:.2f}%)"
    )
    print(
        f"F1-score:            "
        f"{metrics['f1_score']:.4f}"
    )
    print(
        f"ROC-AUC:             "
        f"{metrics['roc_auc']:.4f}"
    )
    print(
        f"PR-AUC:              "
        f"{metrics['pr_auc']:.4f}"
    )

    print("\nConfusion matrix:")
    print(matrix)

    print("\nConfusion matrix details:")
    print(f"True negatives:  {true_negative}")
    print(f"False positives: {false_positive}")
    print(f"False negatives: {false_negative}")
    print(f"True positives:  {true_positive}")

    print("\nClassification report:")
    print(
        classification_report(
            y_true,
            metrics["predictions"],
            labels=[0, 1],
            target_names=["No sepsis", "Sepsis"],
            zero_division=0,
        )
    )


def save_evaluation_results(
    y_test: pd.Series,
    probabilities: np.ndarray,
    metrics: dict,
    threshold: float,
    split_seed: int,
    train_patient_count: int,
    test_patient_count: int,
) -> None:
    """Save evaluation metrics and row-level predictions."""

    predictions = metrics["predictions"]

    results = pd.DataFrame({
        "actual_label": y_test.to_numpy(),
        "predicted_probability": probabilities,
        "predicted_label": predictions,
    })

    results.to_csv(
        "test_predictions.csv",
        index=False,
    )

    matrix = metrics["confusion_matrix"]

    with open(
        "evaluation_results.txt",
        "w",
        encoding="utf-8",
    ) as file:
        file.write("SEWA XGBoost Sepsis Model Evaluation\n")
        file.write("=" * 60 + "\n")
        file.write(
            "Evaluation type: Patient-level holdout test set\n"
        )
        file.write(
            f"Patient-level split random state: {split_seed}\n"
        )
        file.write(
            f"Training patients: {train_patient_count}\n"
        )
        file.write(
            f"Test patients: {test_patient_count}\n"
        )
        file.write(
            f"Test rows: {len(y_test)}\n"
        )
        file.write(
            f"Decision threshold: {threshold}\n\n"
        )

        file.write(
            f"Accuracy: {metrics['accuracy']:.6f}\n"
        )
        file.write(
            f"Balanced accuracy: "
            f"{metrics['balanced_accuracy']:.6f}\n"
        )
        file.write(
            f"Precision: {metrics['precision']:.6f}\n"
        )
        file.write(
            f"Recall/Sensitivity: "
            f"{metrics['recall']:.6f}\n"
        )
        file.write(
            f"F1-score: {metrics['f1_score']:.6f}\n"
        )
        file.write(
            f"ROC-AUC: {metrics['roc_auc']:.6f}\n"
        )
        file.write(
            f"PR-AUC: {metrics['pr_auc']:.6f}\n\n"
        )

        file.write("Confusion matrix:\n")
        file.write(str(matrix))
        file.write("\n\n")

        file.write("Classification report:\n")
        file.write(
            classification_report(
                y_test,
                predictions,
                labels=[0, 1],
                target_names=["No sepsis", "Sepsis"],
                zero_division=0,
            )
        )

    print("\nSaved:")
    print("- test_predictions.csv")
    print("- evaluation_results.txt")


# ============================================================
# Main training and evaluation workflow
# ============================================================

def main():
    print(f"Loading dataset from: {DATASET_PATH}")

    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_PATH}"
        )

    df = pd.read_csv(DATASET_PATH)

    print(f"Original dataset shape: {df.shape}")

    validate_dataset(df)

    # Keep only the columns needed for this experiment.
    data = df[FEATURES + [TARGET_COLUMN, GROUP_COLUMN]].copy()

    # Convert feature columns and target to numeric values.
    for feature in FEATURES:
        data[feature] = pd.to_numeric(
            data[feature],
            errors="coerce",
        )

    data[TARGET_COLUMN] = pd.to_numeric(
        data[TARGET_COLUMN],
        errors="coerce",
    )

    # Remove rows with missing labels or missing patient IDs.
    data = data.dropna(
        subset=[TARGET_COLUMN, GROUP_COLUMN]
    )

    # Keep only binary labels.
    data = data[
        data[TARGET_COLUMN].isin([0, 1])
    ].copy()

    if data.empty:
        raise ValueError(
            "No valid rows with SepsisLabel values 0 or 1 were found."
        )

    data[TARGET_COLUMN] = data[TARGET_COLUMN].astype(int)

    # Replace infinite values with missing values.
    data[FEATURES] = data[FEATURES].replace(
        [np.inf, -np.inf],
        np.nan,
    )

    X = data[FEATURES]
    y = data[TARGET_COLUMN]
    groups = data[GROUP_COLUMN]

    print(f"Cleaned dataset shape: {data.shape}")
    print(f"Unique patients: {groups.nunique()}")

    print("\nClass distribution:")
    print(y.value_counts().sort_index())

    print("\nClass distribution percentage:")
    print(
        (y.value_counts(normalize=True).sort_index() * 100)
        .round(2)
    )

    # Create a patient-level split.
    train_indices, test_indices, split_seed = (
        choose_patient_level_split(
            X,
            y,
            groups,
        )
    )

    X_train = X.iloc[train_indices].copy()
    X_test = X.iloc[test_indices].copy()
    y_train = y.iloc[train_indices].copy()
    y_test = y.iloc[test_indices].copy()

    train_groups = groups.iloc[train_indices]
    test_groups = groups.iloc[test_indices]

    # Confirm there is no patient overlap.
    overlap = set(train_groups) & set(test_groups)

    if overlap:
        raise RuntimeError(
            "Patient leakage detected. "
            f"Overlapping patient IDs: {list(overlap)[:10]}"
        )

    print("\nPatient-level split:")
    print(f"Training rows: {len(X_train)}")
    print(f"Test rows: {len(X_test)}")
    print(f"Training patients: {train_groups.nunique()}")
    print(f"Test patients: {test_groups.nunique()}")
    print(f"Split random state: {split_seed}")
    print(f"Patient overlap: {len(overlap)}")

    # Calculate medians only from training data.
    # This prevents test-set information from leaking into training.
    training_medians = X_train.median()

    X_train = X_train.fillna(training_medians)
    X_test = X_test.fillna(training_medians)

    # If a feature is completely missing in training data, its median
    # will also be missing. Replace such values with zero as a fallback.
    X_train = X_train.fillna(0)
    X_test = X_test.fillna(0)

    # Calculate class weight for the imbalanced dataset.
    negative_count = int((y_train == 0).sum())
    positive_count = int((y_train == 1).sum())

    if positive_count == 0:
        raise ValueError(
            "The training set contains no positive sepsis examples."
        )

    scale_pos_weight = negative_count / positive_count

    print("\nTraining configuration:")
    print(f"Negative training samples: {negative_count}")
    print(f"Positive training samples: {positive_count}")
    print(f"scale_pos_weight: {scale_pos_weight:.4f}")

    # Train the evaluation model.
    evaluation_model = xgb.XGBClassifier(
        objective="binary:logistic",
        eval_metric="auc",
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    print("\nTraining XGBoost evaluation model...")
    evaluation_model.fit(X_train, y_train)

    # Evaluate only on the unseen patient-level test set.
    probabilities = evaluation_model.predict_proba(
        X_test
    )[:, 1]

    metrics = calculate_metrics(
        y_test,
        probabilities,
        DECISION_THRESHOLD,
    )

    print_metrics(
        y_test,
        probabilities,
        metrics,
        DECISION_THRESHOLD,
    )

    save_evaluation_results(
        y_test=y_test,
        probabilities=probabilities,
        metrics=metrics,
        threshold=DECISION_THRESHOLD,
        split_seed=split_seed,
        train_patient_count=train_groups.nunique(),
        test_patient_count=test_groups.nunique(),
    )

    # Train the final deployment model on all labeled data.
    # The evaluation above remains valid because it was calculated before
    # this final model was trained.
    print("\nTraining final deployment model on all labeled data...")

    final_medians = X.median()

    X_full = X.fillna(final_medians)
    X_full = X_full.fillna(0)

    full_negative_count = int((y == 0).sum())
    full_positive_count = int((y == 1).sum())

    full_scale_pos_weight = (
        full_negative_count / full_positive_count
    )

    final_model = xgb.XGBClassifier(
        objective="binary:logistic",
        eval_metric="auc",
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=full_scale_pos_weight,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    final_model.fit(X_full, y)

    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(final_model, MODEL_PATH)
    joblib.dump(final_medians, MEDIANS_PATH)

    print("\nFinal deployment artifacts saved:")
    print(f"- {MODEL_PATH}")
    print(f"- {MEDIANS_PATH}")

    print("\nTraining completed successfully.")


if __name__ == "__main__":
    main()
