import pandas as pd
import xgboost as xgb
import joblib
import os

# 1. Load Data
print("Loading Dataset.csv...")
df = pd.read_csv('app/data/Dataset.csv')

# 2. Define Features
features = ['HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp', 'EtCO2',
            'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN',
            'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct',
            'Glucose', 'Lactate', 'Magnesium', 'Phosphate', 'Potassium',
            'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC',
            'Fibrinogen', 'Platelets', 'Age', 'Gender']

X = df[features].fillna(df[features].median())
y = df['SepsisLabel'].fillna(0).astype(int)

# 3. Train with Class Weighting (Critical for Medical AI)
scale_weight = (y == 0).sum() / (y == 1).sum()
model = xgb.XGBClassifier(scale_pos_weight=scale_weight, eval_metric="auc", n_estimators=100)
model.fit(X, y)

# 4. Save Artifacts
os.makedirs('app/model', exist_ok=True)
joblib.dump(model, 'app/model/sepsis_model.pkl')
joblib.dump(df[features].median(), 'app/model/medians.pkl')
print("✅ SUCCESS: Model trained and saved to app/model/")