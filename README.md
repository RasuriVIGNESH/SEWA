<div align="center">

<h1>🏥 SEWA</h1>
<h3>Sepsis Early Warning Agent</h3>

<p>Real-time ICU monitoring system that detects early signs of sepsis and alerts doctors before it becomes life-threatening.</p>

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

<br/>

</div>

---

## 📌 Overview

Sepsis kills ~11 million people annually. In ICU settings, every hour of delayed treatment increases mortality by ~7%. SEWA is an end-to-end clinical decision support system that:

- Streams live patient vitals from bedside monitors (or a dataset simulator in development)
- Runs an XGBoost ML model trained on 1M+ ICU records to predict sepsis risk in real-time
- Pushes instant alerts to the doctor's dashboard when sepsis is detected

---

## 🏗️ System Architecture and data flow

<img width="1680" height="720" alt="design" src="https://github.com/user-attachments/assets/24379aed-a1a6-4946-866d-d59a9135981d" />



### Environment Switch

| Mode | Data Source |
|------|-------------|
| `DATA_SOURCE_MODE=simulator` | Python simulator replays MIMIC-IV dataset via HAPI FHIR |
| `DATA_SOURCE_MODE=hardware` | Real ICU monitors → Device Gateway → HAPI FHIR |

Zero code change downstream — one environment variable.

---

## 🔬 ML Model

| Attribute | Detail |
|-----------|--------|
| Algorithm | XGBoost |
| Dataset | PhysioNet MIMIC-IV derived (~1M rows, 40+ features) |
| AUROC | ~0.87 |
| Recall (sensitivity) | ≥ 0.85 (tuned — missing sepsis is worse than false alarm) |
| Explainability | SHAP top-3 contributors per alert |
| Scoring | qSOFA + SOFA computed alongside ML prediction |

**Input features:** Heart Rate, SpO₂, Temperature, SBP, DBP, MAP, Respiratory Rate + 26 lab values + engineered rolling-window trends (1h, 3h, 6h) + shock index + PaO₂/FiO₂ ratio

**Alert trigger:** `risk_score > threshold` OR `qSOFA ≥ 2 AND SOFA ≥ 2`

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, WebSocket (STOMP) |
| Backend | Spring Boot 3, Spring Security, JWT, Spring Data JPA |
| ML Service | FastAPI, XGBoost, SHAP, scikit-learn, aiokafka |
| Clinical Standard | HAPI FHIR R4 (HL7 FHIR Observation resources) |
| Database | PostgreSQL |
| Message Bus | Apache Kafka |
| Simulator | Python, pandas, MIMIC-IV dataset |
| DevOps | Docker, Docker Compose |
| API Docs | Swagger / OpenAPI |

---

## 🚀 Getting Started

### Prerequisites

- Java 21+
- Python 3.11+
- Docker & Docker Compose
- Node.js 20+

### 1. Start Infrastructure

```bash
# Start HAPI FHIR Server + PostgreSQL + Kafka
docker-compose up -d
```

### 2. Run Spring Boot Backend

```bash
cd backend
./mvnw spring-boot:run
# Runs on http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### 3. Run Python Simulator

```bash
cd simulator
pip install -r requirements.txt

# Place your dataset at simulator/data/dataset.csv
python fhir_simulator.py
# Streams vitals for 3 patients every 2 seconds
```

### 4. Run React Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 5. Run FastAPI ML Service

```bash
cd ml_service
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

---

## 🔐 API Endpoints

Full API documentation available at `http://localhost:8080/swagger-ui.html` after running the backend.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register doctor, returns JWT | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| GET | `/api/patients` | All patients with details | 🔒 |
| POST | `/api/patients` | Create patient | 🔒 |
| PATCH | `/api/patients/{id}` | Update patient | 🔒 |
| POST | `/api/patients/assign` | Assign doctor to patient | 🔒 |
| POST | `/api/patients/{id}/discharge` | Discharge patient | 🔒 |
| GET | `/api/doctors` | All doctors with patient counts | 🔒 |
| GET | `/api/doctors/{id}/patients` | Doctor's assigned patients | 🔒 |

**WebSocket:** `ws://localhost:8080/ws` → subscribe `/topic/vitals/{fhirPatientId}`

---

## 🩺 Clinical Context

SEWA implements the **Sepsis-3 definition**:
- Sepsis = life-threatening organ dysfunction caused by dysregulated host response to infection
- Organ dysfunction detected by SOFA score increase ≥ 2 points from baseline
- qSOFA used for rapid bedside assessment (no labs needed)

The ML model is designed for **high recall** — in a medical context, a false alarm is acceptable; a missed sepsis case is not.

---
</div>
