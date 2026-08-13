import joblib
import pandas as pd
import os


class SepsisPredictor:
    def __init__(self):
        base_path = os.path.dirname(__file__)
        model_path = os.path.join(base_path, 'model', 'sepsis_model.pkl')
        median_path = os.path.join(base_path, 'model', 'medians.pkl')

        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            self.medians = joblib.load(median_path)
            print("✅ SEWA: Real XGBoost Model Loaded.")
        else:
            self.model = None
            print("⚠️ SEWA: Model files not found! Run train_model.py first.")

    def predict(self, data: dict) -> int:
        if not self.model: return 0

        # Map incoming camelCase to Dataset UPPERCASE
        mapping = {
            'heartRate': 'HR', 'spo2': 'O2Sat', 'temperature': 'Temp',
            'systolicBP': 'SBP', 'meanArterialPressure': 'MAP',
            'diastolicBP': 'DBP', 'respiratoryRate': 'Resp'
        }

        # Prepare input
        input_data = {mapping.get(k, k): v for k, v in data.items()}
        df = pd.DataFrame([input_data])

        # Fill missing with medians
        for col in self.medians.index:
            if col not in df.columns:
                df[col] = self.medians[col]

        # Predict probability (Sepsis-3 Threshold: 0.45)
        prob = self.model.predict_proba(df[self.medians.index])[0][1]
        return 1 if prob > 0.45 else 0