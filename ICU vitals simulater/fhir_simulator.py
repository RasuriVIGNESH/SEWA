"""
SEWA — Professional ICU Vitals Simulator (High Fidelity)
────────────────────────────────────────────────────────────────
Streams full 42-parameter clinical telemetry from PhysioNet dataset
to HAPI FHIR server.

Features:
  • Full 42-column clinical data mapping (Vitals, Labs, Demographics)
  • Automated FHIR patient discovery & round-robin dataset assignment
  • Real-time observation streaming with configurable intervals
  • Standardized LOINC coding for all clinical parameters
"""

import sys
import os
import itertools
import time
from datetime import datetime
import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()

# ── CONFIGURATION ──────────────────────────────────────────────────────────────

# Updated to match user infrastructure (Port 8081)
FHIR_BASE       = os.getenv("FHIR_BASE_URL")
PATIENT_URL     = f"{FHIR_BASE}/Patient"
OBSERVATION_URL = f"{FHIR_BASE}/Observation"

DATASET_PATH    = "data/Dataset.csv"
MIN_ROWS        = 50
STREAM_INTERVAL = 5
POLL_INTERVAL   = 10

VITAL_CODES = {
    # Vitals
    "HR":          ("8867-4",  "Heart Rate",             "bpm"),
    "O2Sat":       ("59408-5", "Oxygen Saturation",      "%"),
    "Temp":        ("8310-5",  "Body Temperature",       "C"),
    "SBP":         ("8480-6",  "Systolic BP",            "mmHg"),
    "MAP":         ("8478-0",  "Mean Arterial Pressure", "mmHg"),
    "DBP":         ("8462-4",  "Diastolic BP",           "mmHg"),
    "Resp":        ("9279-1",  "Respiratory Rate",       "/min"),
    "EtCO2":       ("19889-5", "EtCO2",                  "mmHg"),

    # Laboratory (Blood Gas)
    "BaseExcess":  ("1927-5",  "Base Excess",            "mmol/L"),
    "HCO3":        ("1963-0",  "Bicarbonate",            "mmol/L"),
    "FiO2":        ("19994-3", "FiO2",                   "%"),
    "pH":          ("11558-4", "pH",                     "score"),
    "PaCO2":       ("11557-6", "PaCO2",                  "mmHg"),
    "SaO2":        ("2708-6",  "SaO2",                   "%"),

    # Laboratory (Chemistry & Hematology)
    "AST":         ("1920-8",  "AST",                    "IU/L"),
    "BUN":         ("2823-3",  "BUN",                    "mg/dL"),
    "Alkalinephos":("6768-6",  "Alkaline Phosphatase",   "IU/L"),
    "Calcium":     ("17861-6", "Calcium",                "mg/dL"),
    "Chloride":    ("2075-0",  "Chloride",               "mmol/L"),
    "Creatinine":  ("2160-0",  "Creatinine",             "mg/dL"),
    "Bilirubin_direct": ("1968-9", "Bilirubin Direct",    "mg/dL"),
    "Glucose":     ("2339-0",  "Glucose",                "mg/dL"),
    "Lactate":     ("2524-7",  "Lactate",                "mmol/L"),
    "Magnesium":   ("19123-9", "Magnesium",              "mg/dL"),
    "Phosphate":   ("2777-1",  "Phosphate",              "mg/dL"),
    "Potassium":   ("2823-3",  "Potassium",              "mmol/L"),
    "Bilirubin_total": ("1975-4", "Bilirubin Total",      "mg/dL"),
    "TroponinI":   ("10839-9", "Troponin I",             "ng/mL"),
    "Hct":         ("20570-8", "Hematocrit",             "%"),
    "Hgb":         ("718-7",   "Hemoglobin",             "g/dL"),
    "PTT":         ("3173-2",  "PTT",                    "sec"),
    "WBC":         ("6690-2",  "WBC Count",              "10^3/uL"),
    "Fibrinogen":  ("2276-4",  "Fibrinogen",             "mg/dL"),
    "Platelets":   ("777-3",   "Platelet Count",         "10^3/uL"),

    # Demographics & ICU Metrics (Treated as Observations for this demo)
    "Age":         ("30525-0", "Age",                    "yr"),
    "Gender":      ("76689-9", "Gender",                 "code"),
    "ICULOS":      ("ICU-LOS", "ICU Length of Stay",     "hr"),
}

# ── HELPERS ────────────────────────────────────────────────────────────────────

def safe_int(val, default=0):
    try:
        if pd.isna(val): return default
        return int(val)
    except: return default

def fmt(val):
    try:
        if pd.isna(val): return "—"
        f = float(val)
        return str(int(f)) if f == int(f) else f"{f:.1f}"
    except: return "—"

# ── FHIR ───────────────────────────────────────────────────────────────────────

def check_fhir_server():
    print(f"\n🚀 Connecting to HAPI FHIR at {FHIR_BASE}...")
    try:
        res = requests.get(f"{FHIR_BASE}/metadata", timeout=5)
        if res.status_code == 200:
            print("✅ FHIR Server Online.")
            return
    except: pass
    print("❌ FHIR Server Offline. Check your Docker container on port 8081.")
    sys.exit(0)

def load_dataset():
    print(f"📂 Loading Dataset: {DATASET_PATH}")
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Error: {DATASET_PATH} not found.")
        print("🔗 Download here: https://www.kaggle.com/datasets/salikhussaini49/prediction-of-sepsis")
        sys.exit(0)

    df = pd.read_csv(DATASET_PATH)
    counts = df.groupby("Patient_ID").size()
    valid_ids = counts[counts >= MIN_ROWS].index.tolist()
    print(f"✅ Dataset loaded. {len(valid_ids)} patients ready for simulation.")
    return df, valid_ids

def build_observation(fhir_id, row, timestamp):
    components = []
    for col, (code, display, unit) in VITAL_CODES.items():
        val = row.get(col)
        if val is None or pd.isna(val): continue

        components.append({
            "code": {"coding": [{"system": "http://loinc.org", "code": code, "display": display}]},
            "valueQuantity": {"value": round(float(val), 2), "unit": unit},
        })

    if not components: return None

    return {
        "resourceType": "Observation",
        "status": "final",
        "category": [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "vital-signs",
                "display": "Vital Signs"
            }]
        }],
        "code": {"coding": [{"system": "http://loinc.org", "code": "85353-1", "display": "Vital Signs Panel"}]},
        "subject": {"reference": f"Patient/{fhir_id}"},
        "effectiveDateTime": timestamp.isoformat(),
        "component": components,
        "extension": [{
            "url": "http://sewa.local/extension/sepsisLabel",
            "valueInteger": safe_int(row.get("SepsisLabel", 0))
        }]
    }

# ── MAIN ───────────────────────────────────────────────────────────────────────

def main():
    check_fhir_server()
    df, valid_ids = load_dataset()
    dataset_pool = itertools.cycle(valid_ids)

    # Pre-group rows for speed
    grouped = {pid: df[df["Patient_ID"] == pid].sort_values("Hour").to_dict("records") for pid in valid_ids}

    assignments = {}
    last_poll = 0

    print("\n" + "═"*60)
    print("SEWA ICU SIMULATOR ACTIVE — STREAMING FULL CLINICAL DATA")
    print("═"*60 + "\n")

    while True:
        now = time.time()

        # Discover patients from Spring Boot app
        if now - last_poll >= POLL_INTERVAL:
            last_poll = now
            try:
                res = requests.get(PATIENT_URL, params={"_count": 50}, timeout=5)
                if res.status_code == 200:
                    entries = res.json().get("entry", [])
                    fhir_ids = [e["resource"]["id"] for e in entries if "resource" in e]
                    for fid in fhir_ids:
                        if fid not in assignments:
                            d_pid = next(dataset_pool)
                            assignments[fid] = {"pid": d_pid, "iter": itertools.cycle(grouped[d_pid])}
                            print(f"✨ New Admission: FHIR ID [{fid}] linked to Dataset Patient [{d_pid}]")
            except: pass

        if not assignments:
            print(f"⏳ [{datetime.now().strftime('%H:%M:%S')}] Waiting for patients to be admitted via the UI...")
            time.sleep(STREAM_INTERVAL)
            continue

        ts = datetime.now()
        print(f"\n🏥 ICU Update [{ts.strftime('%H:%M:%S')}] — {len(assignments)} Patients Monitored")

        for fid, state in list(assignments.items()):
            row = next(state["iter"])
            obs = build_observation(fid, row, ts)
            if not obs: continue

            try:
                res = requests.post(OBSERVATION_URL, json=obs, timeout=5)
                if res.status_code in (200, 201):
                    label = safe_int(row.get("SepsisLabel", 0))
                    status = "🔴 SEPSIS RISK" if label == 1 else "🟢 STABLE"
                    print(f"   Patient [{fid[:8]}] -> HR: {fmt(row.get('HR')):<4} SpO2: {fmt(row.get('O2Sat')):<4} MAP: {fmt(row.get('MAP')):<4} Creat: {fmt(row.get('Creatinine')):<4} | {status}")
                else:
                    print(f"   Patient [{fid[:8]}] -> ❌ FHIR Error {res.status_code}")
            except:
                print(f"   Patient [{fid[:8]}] -> ❌ Connection Error")

        time.sleep(STREAM_INTERVAL)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Simulator Stopped.")
