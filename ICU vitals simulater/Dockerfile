FROM python:3.11-slim

# Prevent pyc generation
ENV PYTHONDONTWRITEBYTECODE=1

# Realtime logs
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy dependency file first for Docker caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy remaining project files
COPY . .

# Run simulator
CMD ["python", "fhir_simulator.py"]