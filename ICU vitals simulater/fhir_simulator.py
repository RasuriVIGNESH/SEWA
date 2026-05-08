import sys
import pandas as pd
import requests
import time
import os
import itertools
from datetime import datetime, timedelta

FHIR_BASE = os.getenv("FHIR_BASE_URL")
PATIENT_URL = f"{FHIR_BASE}/Patient"
OBSERVATION_URL = f"{FHIR_BASE}/Observation"

# ── FHIR HEALTH CHECK ───────────────────────────────────────
def check_fhir_server():
    try:
        res = requests.get(f"{FHIR_BASE}/metadata", timeout=5)
        if res.status_code == 200:
            print("FHIR server detected ✅\n")
            return
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
        pass
    print(f"FHIR server not running on {FHIR_BASE}")
    print(f"FHIR server not running on {FHIR_BASE}")
    print("Start FHIR server with: docker-compose up -d")
    sys.exit(0)

check_fhir_server()

# ── LOINC codes ─────────────────────────────────────────────
VITAL_CODES = {
    "HR":     ("8867-4",  "Heart Rate",             "bpm"),
    "O2Sat":  ("59408-5", "Oxygen Saturation",      "%"),
    "Temp":   ("8310-5",  "Body Temperature",       "C"),
    "SBP":    ("8480-6",  "Systolic BP",            "mmHg"),
    "DBP":    ("8462-4",  "Diastolic BP",           "mmHg"),
    "MAP":    ("8478-0",  "Mean Arterial Pressure", "mmHg"),
    "Resp":   ("9279-1",  "Respiratory Rate",       "/min"),
}

# ── LOAD DATASET (UPDATED) ──────────────────────────────────
df = pd.read_csv("data/dataset_top5.csv")

selected = df["Patient_ID"].unique().tolist()
print(f"Selected patients: {selected}\n")

# ── CREATE FHIR PATIENTS ───────────────────────────────────
def create_patient(pid):
    payload = {
        "resourceType": "Patient",
        "identifier": [{"system": "http://sewa.local/patients", "value": str(pid)}],
        "name": [{"text": f"Patient {pid}"}],
    }
    res = requests.post(PATIENT_URL, json=payload)
    if res.status_code in (200, 201):
        fhir_id = res.json().get("id")
        print(f"  Created Patient {pid} → FHIR id={fhir_id}")
        return fhir_id
    print(f"  ❌ Failed Patient {pid}: {res.status_code}")
    return None

patient_fhir_ids = {pid: create_patient(pid) for pid in selected}
print("\nAll patients created ✅\n")

# ── BUILD OBSERVATION ───────────────────────────────────────
def build_observation(row, pid, timestamp):

    components = []
    for col, (code, display, unit) in VITAL_CODES.items():
        val = row.get(col)
        if pd.isna(val):
            continue

        components.append({
            "code": {
                "coding": [{"system": "http://loinc.org", "code": code, "display": display}]
            },
            "valueQuantity": {"value": round(float(val), 2), "unit": unit},
        })

    if not components:
        return None

    sepsis_label = int(row.get("SepsisLabel", 0)) if not pd.isna(row.get("SepsisLabel", float("nan"))) else 0

    return {
        "resourceType": "Observation",
        "status": "final",
        "category": [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "vital-signs",
                "display": "Vital Signs",
            }]
        }],
        "code": {
            "coding": [{"system": "http://loinc.org", "code": "85353-1", "display": "Vital Signs Panel"}]
        },
        "subject": {"reference": f"Patient/{patient_fhir_ids[pid]}"},
        "effectiveDateTime": timestamp.isoformat(),
        "component": components,
        "extension": [{
            "url": "http://sewa.local/extension/sepsisLabel",
            "valueInteger": sepsis_label,
        }],
    }

# ── CIRCULAR STREAM SETUP (UPDATED) ─────────────────────────
grouped = df.groupby("Patient_ID")

patient_streams = {
    pid: itertools.cycle(group.sort_values("Hour").to_dict("records"))
    for pid, group in grouped
}

start_time = datetime.now()
print("Streaming vitals...\n")

# ── INFINITE LOOP ───────────────────────────────────────────
while True:

    for pid, iterator in patient_streams.items():

        row = next(iterator)

        fhir_id = patient_fhir_ids.get(pid)
        if not fhir_id:
            continue

        timestamp = start_time + timedelta(hours=int(row["Hour"]))

        obs = build_observation(row, pid, timestamp)
        if obs is None:
            continue

        res = requests.post(OBSERVATION_URL, json=obs)

        if res.status_code in (200, 201):
            vitals_sent = [c["code"]["coding"][0]["display"] for c in obs["component"]]
            print(f"P{pid} | Hour={int(row['Hour'])} | {', '.join(vitals_sent)}")
        else:
            print(f"❌ P{pid} failed")

    time.sleep(5)