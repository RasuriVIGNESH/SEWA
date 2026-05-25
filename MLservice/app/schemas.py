from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VitalReadingBase(BaseModel):
    fhirObservationId: str
    fhirPatientId: str
    bedNumber: str
    patientName: str
    timestamp: datetime
    heartRate: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    systolicBP: Optional[float] = None
    diastolicBP: Optional[float] = None
    meanArterialPressure: Optional[float] = None
    respiratoryRate: Optional[float] = None
    sepsisLabel: Optional[int] = None

class VitalReadingCreate(VitalReadingBase):
    pass

class VitalReading(VitalReadingBase):
    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    fhir_patient_id: str
    patient_name: str
    bed_number: str
    alert_message: str
    timestamp: datetime
    acknowledged: bool = False

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: int

    class Config:
        from_attributes = True

class SepsisPrediction(BaseModel):
    fhir_patient_id: str
    prediction: int
