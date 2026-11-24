# export_medians.py
import json
import joblib
import numpy as np

medians = joblib.load("app/model/medians.pkl")
print("Type:", type(medians))          # expect pandas Series

with open("app/model/sepsis_model.json") as f:
    names = json.load(f)["learner"]["feature_names"]

missing = [n for n in names if n not in medians.index]
extra = [n for n in medians.index if n not in names]
if missing or extra:
    raise SystemExit(f"Mismatch. Missing: {missing}  Extra: {extra}")

out = {}
for n in names:                         # model feature order
    v = float(medians[n])
    out[n] = None if np.isnan(v) else v

with open("app/model/medians.json", "w") as f:
    json.dump(out, f, indent=2)

print(f"Saved {len(out)} entries")
print(json.dumps(out, indent=2))
print("Same order as medians.index:", list(medians.index) == names)