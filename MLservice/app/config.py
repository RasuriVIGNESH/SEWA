from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    KAFKA_BOOTSTRAP_SERVERS = os.getenv(
        "KAFKA_BOOTSTRAP_SERVERS",
        "localhost:9092"
    )

    KAFKA_TOPIC = os.getenv(
        "KAFKA_TOPIC",
        "sewa.vitals"
    )

    DATABASE_URL = os.getenv(
        "DATABASE_URL"
    )

settings = Settings()