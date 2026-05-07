# Bill Splitter

Split shared expenses with friends — no awkward math. A modern, responsive web app built with Spring Boot and React.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Java 17, Spring Boot 3.1, JPA/Hibernate |
| Frontend   | React 18, Vite, Tailwind CSS, Lucide Icons |
| Database   | MySQL 8.0                           |
| Deployment | Docker Compose, Nginx reverse proxy |

## Quick Start (Local)

### Prerequisites
- Java 17+
- Node.js 20+
- MySQL 8.0 running on `localhost:3307`
- Create a database named `bill_splitter`

### Backend
```bash
# Build and run
./mvnw spring-boot:run
# App starts at http://localhost:8080/spring-api
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Dev server at http://localhost:5173
```

## API Endpoints

All endpoints are prefixed with `/spring-api`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions` | Create a session |
| GET | `/sessions/{id}` | Get session details |
| PUT | `/sessions/{id}` | Update session name |
| POST | `/sessions/{id}/participants` | Add a participant |
| PUT | `/sessions/{id}/participants/{pid}` | Update participant name |
| DELETE | `/sessions/{id}/participants/{pid}` | Remove a participant |
| POST | `/sessions/{id}/items` | Add an expense |
| PUT | `/sessions/{id}/items/{itemId}` | Update an expense |
| DELETE | `/sessions/{id}/items/{itemId}` | Delete an expense |
| POST | `/sessions/{id}/calculate` | Calculate settlements |
| GET | `/sessions/{id}/summary` | Get session summary |

## Docker Deployment

```bash
# Build and run all services
docker compose up -d

# App available at http://localhost
```

### Services
- **frontend** — Nginx serving React SPA (port 80)
- **backend** — Spring Boot API (port 8080, internal)
- **db** — MySQL 8.0 (port 3306, internal)

Environment variables are read from a `.env` file (see `.env.example`).

## Project Structure

```
├── backend/
│   ├── Dockerfile
│   └── src/main/resources/
│       ├── application.properties        # Local config
│       └── application-production.properties  # Docker config
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── docker-compose.yml
└── pom.xml
```
