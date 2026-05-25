from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from typing import List

from . import crud, models, schemas
from .database import SessionLocal, engine
from .kafka_consumer import consume_messages
from .ml_model import SepsisPredictor

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

predictor = SepsisPredictor()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Kafka consumer...")
    consumer_task = asyncio.create_task(consume_messages(predictor))
    yield
    print("Shutting down Kafka consumer...")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        print("Kafka consumer shut down successfully.")

app = FastAPI(lifespan=lifespan)

@app.get("/alerts", response_model=List[schemas.Alert])
def read_alerts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    alerts = crud.get_alerts(db, skip=skip, limit=limit)
    return alerts

@app.get("/alerts/patient/{fhir_patient_id}", response_model=List[schemas.Alert])
def read_patient_alerts(fhir_patient_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    alerts = crud.get_alerts_by_patient_id(db, fhir_patient_id, skip=skip, limit=limit)
    return alerts

@app.post("/predict", response_model=schemas.SepsisPrediction)
def predict_sepsis(vital_reading: schemas.VitalReadingCreate):
    prediction = predictor.predict(vital_reading.model_dump())
    return schemas.SepsisPrediction(fhir_patient_id=vital_reading.fhirPatientId, prediction=prediction)
