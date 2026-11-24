# SEWA — Sepsis Early Warning Agent

SEWA is an **educational, non-clinical prototype** that processes simulated or de-identified ICU vital-sign data and displays risk alerts through a web dashboard.

The project demonstrates event-driven backend development, service-to-service communication, real-time dashboard updates, and containerized local execution.

> **Important:** SEWA is not a medical device and must not be used for clinical diagnosis, treatment, or patient-care decisions. The project is intended only for learning, software engineering experimentation, and research prototyping.

## Project goals

SEWA explores how a distributed application can:

- Receive simulated or de-identified patient-vital data.
- Process events through a message-broker pipeline.
- Send data to a separate prediction service.
- Persist application data.
- Deliver live dashboard updates.
- Display non-clinical risk notifications for demonstration purposes.

## Architecture

The prototype contains the following logical components:

1. **Data simulator** — generates or replays sample vital-sign events.
2. **FHIR/data gateway** — represents the data-ingestion boundary for the prototype.
3. **Kafka** — transports events between services.
4. **Spring Boot backend** — provides APIs, authentication, persistence, and application workflows.
5. **Python prediction service** — receives prepared data and returns the project’s configured prediction output.
6. **React dashboard** — displays patient information and live notifications.
7. **PostgreSQL** — stores application data.
8. **WebSockets** — deliver live updates to connected dashboard clients.

```text
Simulated data
      |
      v
Data/FHIR gateway
      |
      v
Apache Kafka  --->  Python prediction service
      |
      v
Spring Boot backend  --->  PostgreSQL
      |
      v
WebSocket notifications
      |
      v
React dashboard
```

The architecture is designed for learning and demonstration. It does not represent a production clinical architecture.

## Technology stack

| Area | Technology |
|---|---|
| Backend | Java, Spring Boot, Spring Security, REST APIs |
| Prediction service | Python, FastAPI |
| Frontend | React, JavaScript |
| Database | PostgreSQL |
| Messaging | Apache Kafka |
| Real-time communication | WebSockets |
| Data format/integration exploration | HAPI FHIR |
| Local infrastructure | Docker, Docker Compose |
| Documentation | REST API documentation where configured |

Use the exact libraries and model name that are present in the code. Do not describe a model as XGBoost, LSTM, or another algorithm unless it is implemented and reproducible in this repository.

## Repository structure

The current repository is organized into the following top-level areas:

```text
.
├── ICU vitals simulater/   # Simulated or replayed vital-sign data
├── MLservice/              # Python prediction service
├── diagrams/               # Architecture and design diagrams
├── frontend/               # React dashboard
├── sewa-backend/           # Java/Spring Boot backend
├── .gitignore
├── LICENSE
└── README.md
```

If a directory name changes, update this section and every setup command in the same commit.

## Prerequisites

Install the following before running the project:

- Java version required by the `sewa-backend` build file.
- Python version required by `MLservice` dependency files.
- Node.js and npm version required by `frontend/package.json`.
- Docker and Docker Compose.
- PostgreSQL, Kafka, and any other infrastructure listed in the Docker Compose file.

Check the repository build files before choosing versions. The commands below assume the standard tools are available on your PATH.

## Configuration and secrets

Never commit real passwords, OAuth secrets, JWT keys, API keys, or cloud credentials.

Create local environment files from the example files if they exist. Typical configuration areas may include:

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
JWT_SECRET
KAFKA_BOOTSTRAP_SERVERS
PREDICTION_SERVICE_URL
CORS_ALLOWED_ORIGINS
```

Use the exact variable names expected by the source code. If no example environment file exists, create one as part of the repository cleanup and document every required variable without including real secret values.

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/RasuriVIGNESH/SEWA.git
cd SEWA
```

### 2. Start infrastructure

From the directory containing the Docker Compose file, run:

```bash
docker compose up -d
```

Confirm that the required infrastructure containers are healthy before starting the application services.

### 3. Start the Spring Boot backend

Open the backend directory:

```bash
cd sewa-backend
```

Use the build tool and wrapper that are actually present in this directory. For Maven projects, the command is usually:

```bash
./mvnw spring-boot:run
```

If the repository does not contain `mvnw`, use the project’s documented Maven command after confirming the required Java version.

### 4. Start the prediction service

Open a second terminal and enter the prediction-service directory:

```bash
cd MLservice
```

Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install the dependencies listed by the repository:

```bash
pip install -r requirements.txt
```

Start the service using the entry point defined in the directory. For example:

```bash
python main.py
```

Do not keep this command in the README if the actual entry file has a different name. Update it to match the code.

### 5. Start the frontend

Open a third terminal and enter the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by the frontend development server.

### 6. Start the simulator

Open a fourth terminal and enter the simulator directory:

```bash
cd "ICU vitals simulater"
```

Install its dependencies according to the files in that directory and start the simulator using the actual entry point documented by the code.

The simulator should use only simulated or authorized de-identified data. Do not place real patient information in this repository.

## Application flow

1. The simulator generates or replays a vital-sign event.
2. The ingestion layer validates and forwards the event.
3. Kafka transports the event to the configured consumers.
4. The Spring Boot backend and prediction service process the event according to the configured application flow.
5. The backend stores relevant application data in PostgreSQL.
6. The dashboard receives a live notification through WebSockets.
7. The React interface displays the event and the configured non-clinical risk output.

## API documentation

When the backend is running, open the API documentation URL configured by the project. If Swagger/OpenAPI is enabled, it is commonly available at a path such as:

```text
http://localhost:8080/swagger-ui/index.html
```

Verify the actual path in the source configuration before publishing it as the official URL.

Document the currently implemented endpoints in this README or in a separate `API.md` file. Each endpoint should include its method, path, purpose, request body, response body, authentication requirement, and example error response.

## Testing

Document the commands that are actually supported by the current codebase. At minimum, add tests for:

- Input validation.
- Authentication and authorization.
- Core backend service logic.
- Database repository behavior.
- Prediction-service request validation.
- Frontend loading, error, and empty states.
- WebSocket connection or notification behavior where practical.

Before claiming that tests pass, run them locally and configure GitHub Actions to run the same commands.

## Current limitations

- The system is an educational prototype, not a clinical product.
- Input data is simulated or de-identified.
- Prediction outputs depend on the configured service and available model implementation.
- Local setup requires multiple services and may require manual environment configuration.
- No clinical decision should be made from the application output.
- Performance, accuracy, and reliability claims should be treated as experimental unless supported by a reproducible evaluation procedure.

## Responsible use

Do not upload real patient data, personally identifiable information, medical records, credentials, or secrets to this repository or its issue tracker.

Any future evaluation should document the dataset source, licensing, preprocessing, train/test split, evaluation metrics, model version, limitations, and reproducibility steps.

## License

This project is available under the license included in the repository.
