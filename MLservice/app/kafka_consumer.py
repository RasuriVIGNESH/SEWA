import json
from aiokafka import AIOKafkaConsumer
from sqlalchemy.orm import Session
from . import crud, schemas
from .database import SessionLocal
from .ml_model import SepsisPredictor
from .config import settings

async def consume_messages(predictor: SepsisPredictor):
    consumer = AIOKafkaConsumer(
        settings.KAFKA_TOPIC,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id='ml-service-group',
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )
    await consumer.start()
    print(f"🚀 Kafka Consumer started on topic: {settings.KAFKA_TOPIC}")

    try:
        async for msg in consumer:
            vital_data = msg.value
            vital_reading = schemas.VitalReadingCreate(**vital_data)

            # Perform real ML prediction
            prediction_result = predictor.predict(vital_reading.model_dump())

            if prediction_result == 1:
                db: Session = SessionLocal()
                try:
                    alert = schemas.AlertCreate(
                        fhir_patient_id=vital_reading.fhirPatientId,
                        patient_name=vital_reading.patientName,
                        bed_number=vital_reading.bedNumber,
                        alert_message=f"CRITICAL: Sepsis detected for {vital_reading.patientName}",
                        timestamp=vital_reading.timestamp
                    )
                    crud.create_alert(db, alert)
                    print(f"🚨 ALERT PERSISTED: {vital_reading.patientName}")
                finally:
                    db.close()
    finally:
        await consumer.stop()