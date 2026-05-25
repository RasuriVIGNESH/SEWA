from sqlalchemy.orm import Session
from . import models, schemas

def create_alert(db: Session, alert: schemas.AlertCreate):
    db_alert = models.Alert(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def get_alerts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Alert).offset(skip).limit(limit).all()

def get_alerts_by_patient_id(db: Session, fhir_patient_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.Alert).filter(models.Alert.fhir_patient_id == fhir_patient_id).offset(skip).limit(limit).all()
