# inspect_medians.py
import pickle
import numpy as np

with open("app/model/medians.pkl", "rb") as f:
    m = pickle.load(f)

print("dtype:", m.dtype)
print("shape:", m.shape)
print("first values:", m.flatten()[:10])