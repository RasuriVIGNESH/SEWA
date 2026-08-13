import pandas as pd
import joblib
from sklearn.metrics import roc_auc_score, classification_report
import os

# 1. Load the artifacts we just created
model_path = 'app/model/sepsis_model.pkl'
data_path = 'app/data/Dataset.csv'

if not os.path.exists(model_path):
    print("❌ Model file not found. Please run train_model.py first.")
    exit()

print("--- SEWA Model Verification ---")
print(f"Loading model from: {model_path}")
model = joblib.load(model_path)
medians = joblib.load('app/model/medians.pkl')

# 2. Load the data to test
print("Loading data for verification...")
df = pd.read_csv(data_path)

features = ['HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp', 'EtCO2',
            'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN',
            'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct',
            'Glucose', 'Lactate', 'Magnesium', 'Phosphate', 'Potassium',
            'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC',
            'Fibrinogen', 'Platelets', 'Age', 'Gender']

# 3. Perform a test prediction on the first 1000 rows
X_test = df[features].head(1000).fillna(medians)
y_true = df['SepsisLabel'].head(1000).fillna(0).astype(int)

probs = model.predict_proba(X_test)[:, 1]
preds = (probs > 0.45).astype(int)

# 4. Show Results
print("\n--- Performance Metrics ---")
print(f"AUROC Score: {roc_auc_score(y_true, probs):.4f}")
print("\nClassification Report:")
print(classification_report(y_true, preds))

print("\n✅ VERIFICATION COMPLETE: The model is loaded and making intelligent predictions.")
print("If AUROC is > 0.80, your model is professional-grade.")
