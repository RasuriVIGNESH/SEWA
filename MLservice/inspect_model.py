import joblib
from pathlib import Path

MODEL_PATH = Path("app/model/sepsis_model.pkl")
MEDIAN_PATH = Path("app/model/medians.pkl")

model = joblib.load(MODEL_PATH)
medians = joblib.load(MEDIAN_PATH)

print("Model type:")
print(type(model))

print("\nModel object:")
print(model)

print("\nExpected feature columns:")
print(list(medians.index))

print("\nMedian values used for missing features:")
print(medians)

print("\nNumber of model features:")
print(getattr(model, "n_features_in_", "Not available"))

print("\nModel feature names:")
print(getattr(model, "feature_names_in_", "Not available"))

print("\nClasses:")
print(getattr(model, "classes_", "Not available"))

print("\nNumber of estimators:")
print(getattr(model, "n_estimators", "Not available"))

print("\nMaximum tree depth:")
print(getattr(model, "max_depth", "Not available"))

print("\nLearning rate:")
print(getattr(model, "learning_rate", "Not available"))
