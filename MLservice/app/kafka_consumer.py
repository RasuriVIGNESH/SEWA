import asyncio
import json

from kafka import KafkaConsumer
from sqlalchemy.orm import Session

from . import crud, schemas
from .database import SessionLocal
from .ml_model import SepsisPredictor
from .config import settings

async def consume_messages(predictor: SepsisPredictor):
    consumer = KafkaConsumer(
        settings.KAFKA_TOPIC,

        bootstrap_servers=[
            settings.KAFKA_BOOTSTRAP_SERVERS
        ],

        auto_offset_reset='earliest',

        enable_auto_commit=True,

        group_id='ml-service-group',

        value_deserializer=lambda x:
        json.loads(x.decode('utf-8'))
    )
    print("Kafka consumer connected successfully")
    print(f"Topic: {settings.KAFKA_TOPIC}")
    print(f"Broker: {settings.KAFKA_BOOTSTRAP_SERVERS}")

    print("Kafka consumer started, waiting for messages...")

    for message in consumer:
        vital_reading_data = message.value
        print(f"Received message: {vital_reading_data}")

        vital_reading = schemas.VitalReadingCreate(**vital_reading_data)

        # Perform sepsis prediction
        prediction_result = predictor.predict(vital_reading.model_dump())

        if prediction_result == 1:  # Assuming 1 means sepsis detected
            db: Session = SessionLocal()
            try:
                alert_message = f"Sepsis alert for patient {vital_reading.patientName} (Bed: {vital_reading.bedNumber})!"
                alert = schemas.AlertCreate(
                    fhir_patient_id=vital_reading.fhirPatientId,
                    patient_name=vital_reading.patientName,
                    bed_number=vital_reading.bedNumber,
                    alert_message=alert_message,
                    timestamp=vital_reading.timestamp
                )
                crud.create_alert(db, alert)
                print(f"Sepsis alert created for {vital_reading.patientName}")
            finally:
                db.close()
        await asyncio.sleep(0.1) # Small delay to yield control
