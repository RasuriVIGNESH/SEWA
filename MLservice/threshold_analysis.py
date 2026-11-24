import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

model = joblib.load("app/model/sepsis_model.pkl")
medians = joblib.load("app/model/medians.pkl")

features = list(medians.index)

df = pd.read_csv("app/data/Dataset.csv")

for column in features + ["sepsisLabel"]:
    df[column] = pd.to_numeric(df[column], errors="coerce")

df = df.dropna(subset=["sepsisLabel"])

for column in features:
    df[column] = df[column].fillna(medians[column])

X = df[features]
y = df["sepsisLabel"].astype(int)

_, X_test, _, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

probabilities = model.predict_proba(X_test)[:, 1]

print("Threshold | Precision | Recall | F1-score | False Positives | False Negatives")
print("-" * 85)

for threshold in [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]:
    predictions = (probabilities >= threshold).astype(int)

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )

    tn, fp, fn, tp = confusion_matrix(
        y_test,
        predictions,
    ).ravel()

    print(
        f"{threshold:9.2f} | "
        f"{precision:9.4f} | "
        f"{recall:6.4f} | "
        f"{f1:8.4f} | "
        f"{fp:15d} | "
        f"{fn:15d}"
    )
