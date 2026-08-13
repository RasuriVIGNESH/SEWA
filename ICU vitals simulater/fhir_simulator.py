"""
SEWA — ICU Vitals Simulator
────────────────────────────────────────────────────────────────
Discovers patients already created by Spring Boot in FHIR,
assigns dataset rows (round-robin), and streams vitals as
FHIR Observations every STREAM_INTERVAL seconds.

Handles:
  • Server restart  → re-discovers all existing FHIR patients
  • New admission   → auto-detected on next poll cycle
  • Rows exhausted  → circular replay per patient
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

FHIR_BASE       = os.getenv("FHIR_BASE_URL", "http://localhost:8080/fhir")
PATIENT_URL     = f"{FHIR_BASE}/Patient"
OBSERVATION_URL = f"{FHIR_BASE}/Observation"

DATASET_PATH    = "data/Dataset.csv"
MIN_ROWS        = 150    # minimum rows required per dataset patient
STREAM_INTERVAL = 5      # seconds between each vitals push
POLL_INTERVAL   = 10     # seconds between FHIR patient discovery checks

VITAL_CODES = {
    "HR":    ("8867-4",  "Heart Rate",             "bpm"),
    "O2Sat": ("59408-5", "Oxygen Saturation",      "%"),
    "Temp":  ("8310-5",  "Body Temperature",       "C"),
    "SBP":   ("8480-6",  "Systolic BP",            "mmHg"),
    "DBP":   ("8462-4",  "Diastolic BP",           "mmHg"),
    "MAP":   ("8478-0",  "Mean Arterial Pressure", "mmHg"),
    "Resp":  ("9279-1",  "Respiratory Rate",       "/min"),
}

# ── HELPERS ────────────────────────────────────────────────────────────────────

def safe_int(val, default=0):
    """Convert a value to int safely, returning default for None/NaN."""
    try:
        if pd.isna(val):
            return default
    except (TypeError, ValueError):
        pass
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def fmt(val):
    """Format a vital value for display. Returns '—' for missing values."""
    try:
        if pd.isna(val):
            return "—"
        f = float(val)
        return str(int(f)) if f == int(f) else f"{f:.1f}"
    except (TypeError, ValueError):
        return str(val) if val is not None else "—"

# ── STARTUP ────────────────────────────────────────────────────────────────────

def print_banner():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║        SEWA — ICU Vitals Simulator       ║")
    print("  ║    Sepsis Early Warning Agent  |  v1.0   ║")
    print("  ╚══════════════════════════════════════════╝")
    print()


def check_fhir_server():
    print(f"  Connecting to FHIR server at {FHIR_BASE} ...")
    try:
        res = requests.get(f"{FHIR_BASE}/metadata", timeout=5)
        if res.status_code == 200:
            print("  ✅  FHIR server is online\n")
            return
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
        pass

    print("  ❌  FHIR server is not reachable")
    print(f"      URL : {FHIR_BASE}")
    print("      Fix : docker-compose up -d\n")
    print("  Simulator stopped.")
    sys.exit(0)


def load_dataset():
    print(f"  Loading dataset → {DATASET_PATH}")
    try:
        df = pd.read_csv(DATASET_PATH)
    except FileNotFoundError:
        print(f"  ❌  Dataset not found at {DATASET_PATH}")
        print("      Fix : ensure data/Dataset.csv exists\n")
        print("  Simulator stopped.")
        sys.exit(0)

    counts    = df.groupby("Patient_ID").size()
    valid_ids = counts[counts >= MIN_ROWS].index.tolist()
    df        = df[df["Patient_ID"].isin(valid_ids)].copy()

    print(f"  ✅  {len(valid_ids)} dataset patients with ≥{MIN_ROWS} rows ready\n")
    return df, valid_ids

# ── FHIR ───────────────────────────────────────────────────────────────────────

def fetch_fhir_patient_ids():
    """Fetch all Patient IDs currently registered in FHIR."""
    try:
        res = requests.get(PATIENT_URL, params={"_count": 100}, timeout=5)
        if res.status_code == 200:
            entries = res.json().get("entry", [])
            return [e["resource"]["id"] for e in entries if "resource" in e]
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
        pass
    return []


def build_observation(fhir_id, row, timestamp):
    """Build a FHIR Observation resource from a dataset row."""
    components = []
    for col, (code, display, unit) in VITAL_CODES.items():
        val = row.get(col)
        try:
            if val is None or pd.isna(val):
                continue
        except (TypeError, ValueError):
            pass
        components.append({
            "code": {
                "coding": [{"system": "http://loinc.org", "code": code, "display": display}]
            },
            "valueQuantity": {"value": round(float(val), 2), "unit": unit},
        })

    if not components:
        return None

    return {
        "resourceType": "Observation",
        "status": "final",
        "category": [{
            "coding": [{
                "system":  "http://terminology.hl7.org/CodeSystem/observation-category",
                "code":    "vital-signs",
                "display": "Vital Signs",
            }]
        }],
        "code": {
            "coding": [{"system": "http://loinc.org", "code": "85353-1", "display": "Vital Signs Panel"}]
        },
        "subject":           {"reference": f"Patient/{fhir_id}"},
        "effectiveDateTime": timestamp.isoformat(),
        "component":         components,
        "extension": [{
            "url":          "http://sewa.local/extension/sepsisLabel",
            "valueInteger": safe_int(row.get("SepsisLabel", 0)),
        }],
    }

# ── MAIN ───────────────────────────────────────────────────────────────────────

def main():
    print_banner()
    check_fhir_server()

    df, valid_ids = load_dataset()

    # Round-robin pool of dataset Patient_IDs
    dataset_pool = itertools.cycle(valid_ids)

    # Pre-group rows by Patient_ID for fast lookup
    grouped = {
        pid: df[df["Patient_ID"] == pid].sort_values("Hour").to_dict("records")
        for pid in valid_ids
    }

    # fhir_id → { dataset_pid, iterator }
    assignments: dict = {}
    last_poll = 0.0

    print(f"  {'─' * 56}")
    print("  Streaming vitals  →  press Ctrl+C to stop\n")

    while True:
        now = time.time()

        # ── Discover new FHIR patients ────────────────────────
        if now - last_poll >= POLL_INTERVAL:
            last_poll = now
            fhir_ids  = fetch_fhir_patient_ids()
            new_ids   = [fid for fid in fhir_ids if fid not in assignments]

            if new_ids:
                print(f"\n  🔍  {len(new_ids)} new patient(s) admitted:")
                for fhir_id in new_ids:
                    dataset_pid = next(dataset_pool)
                    rows        = grouped[dataset_pid]
                    assignments[fhir_id] = {
                        "dataset_pid": dataset_pid,
                        "iterator":    itertools.cycle(rows),
                    }
                    print(f"      ✅  FHIR [{fhir_id}]  →  Dataset {dataset_pid}  ({len(rows)} rows)")
                print()

        # ── Wait if no patients assigned yet ──────────────────
        if not assignments:
            print(f"  ⏳  [{datetime.now().strftime('%H:%M:%S')}]  Waiting for patients from application ...")
            time.sleep(STREAM_INTERVAL)
            continue

        # ── Push one vitals row per patient ───────────────────
        ts = datetime.now()
        print(f"\n  🕐  {ts.strftime('%H:%M:%S')}  —  Active: {len(assignments)} patient(s)")
        print(f"  {'─' * 72}")

        for fhir_id, state in assignments.items():
            row = next(state["iterator"])
            obs = build_observation(fhir_id, row, ts)
            if obs is None:
                continue

            try:
                res = requests.post(OBSERVATION_URL, json=obs, timeout=5)

                if res.status_code in (200, 201):
                    label  = safe_int(row.get("SepsisLabel", 0))
                    status = "⚠️   SEPSIS ALERT" if label == 1 else "✓   stable"
                    print(
                        f"  [{fhir_id[:8]}..]"
                        f"  HR={fmt(row.get('HR')):<5}"
                        f"  SpO₂={fmt(row.get('O2Sat')):<5}"
                        f"  Temp={fmt(row.get('Temp')):<5}"
                        f"  Resp={fmt(row.get('Resp')):<4}"
                        f"  SBP={fmt(row.get('SBP')):<5}"
                        f"  {status}"
                    )
                else:
                    print(f"  [{fhir_id[:8]}..]  ❌  HTTP {res.status_code}")

            except requests.exceptions.Timeout:
                print(f"  [{fhir_id[:8]}..]  ⚠️   Request timed out — retrying next cycle")
            except requests.exceptions.ConnectionError:
                print(f"  [{fhir_id[:8]}..]  ❌  FHIR connection lost — retrying next cycle")

        time.sleep(STREAM_INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  Simulator stopped.\n")