import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd

MODEL_DIR = Path("app/model")

# ---------- 1. Model ----------
with open(MODEL_DIR / "sepsis_model.pkl", "rb") as f:
    model = pickle.load(f)

print("Loaded model type:", type(model))

# If it's the sklearn wrapper (XGBClassifier), get the underlying Booster
booster = model.get_booster() if hasattr(model, "get_booster") else model

booster.save_model(str(MODEL_DIR / "sepsis_model.json"))   # native XGBoost JSON
print("Saved sepsis_model.json")

# Feature names + threshold info help the Java side
feature_names = booster.feature_names or getattr(model, "feature_names_in_", None)
print("Features:", list(feature_names) if feature_names is not None else "none stored")

# ---------- 2. Medians ----------
with open(MODEL_DIR / "medians.pkl", "rb") as f:
    medians = pickle.load(f)

print("Medians type:", type(medians))

def to_py(v):
    return None if (isinstance(v, float) and np.isnan(v)) else float(v)

if isinstance(medians, (pd.Series, pd.DataFrame)):
    medians = medians.squeeze()
    medians_dict = {str(k): to_py(v) for k, v in medians.items()}
elif isinstance(medians, dict):
    medians_dict = {str(k): to_py(v) for k, v in medians.items()}
else:
    raise TypeError(f"Unexpected medians type: {type(medians)}")

with open(MODEL_DIR / "medians.json", "w") as f:
    json.dump(medians_dict, f, indent=2)
print("Saved medians.json with", len(medians_dict), "entries")

# ---------- 3. Feature order (important for Java) ----------
if feature_names is not None:
    with open(MODEL_DIR / "feature_names.json", "w") as f:
        json.dump(list(feature_names), f, indent=2)
    print("Saved feature_names.json")