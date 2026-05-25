from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    fhir_patient_id = Column(String, index=True)
    patient_name = Column(String)
    bed_number = Column(String)
    alert_message = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged = Column(Boolean, default=False)

    # Optional: Link to a patient table if needed, but for now, we'll keep it simple
    # patient_id = Column(Integer, ForeignKey("patients.id"))
    # patient = relationship("Patient")
