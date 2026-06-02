# Bill Splitter

Split shared expenses with friends — no awkward math. A modern, responsive full-stack web app built with Spring Boot and React, deployed with Docker on Oracle Cloud free tier.

**Live at:** [https://groupbillsplit.me](https://groupbillsplit.me) • [https://www.groupbillsplit.me](https://www.groupbillsplit.me)

## Tech Stack

| Layer        | Technology                                   |
|--------------|----------------------------------------------|
| Backend      | Java 17, Spring Boot 3.1, JPA/Hibernate      |
| Frontend     | React 18, Vite, Tailwind CSS, Lucide Icons   |
| Database     | MySQL 8.0                                    |
| Deployment   | Docker Compose, Nginx reverse proxy |
| CI/CD        | GitHub Actions                               |
| SSL          | Let's Encrypt (auto-renewed via certbot)     |

---

## Local Development

### Prerequisites
- Java 17+
- Node.js 20+
- MySQL 8.0 running on `localhost:3307`
- Create a database named `bill_splitter`

### Backend
```bash
./mvnw spring-boot:run
# Starts at http://localhost:8080/spring-api
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Dev server at http://localhost:5173 (proxies API to :8080)
```

---

## Production Architecture

```
                         Internet
                            |
                      groupbillsplit.me
                            |
                     Oracle Cloud VM
                     (REDACTED)
                            |
                     Nginx (ports 80 / 443)
                     - SSL termination (Let's Encrypt)
                     - HTTP -> HTTPS redirect
                     - Proxies /spring-api/ -> backend:8080
                     - Serves React SPA on /
                    /        |         \
                   /         |          \
            frontend      backend        db
           (Nginx:80/443) (Java:8080)  (MySQL:3306)
```

### Docker Services

| Service   | Role                     | Ports              | Notes                            |
|-----------|--------------------------|--------------------|----------------------------------|
| `frontend`| Nginx serving React SPA  | `80`, `443` (host) | SSL certs mounted from host      |
| `backend` | Spring Boot REST API     | `8080` (internal)  | Profile `production`, Hibernate  |
| `db`      | MySQL 8.0                | `3306` (internal)  | Named volume `mysql-data`        |

### SSL Certificates
- **Provider:** Let's Encrypt via certbot
- **Auto-renewal:** certbot systemd timer (twice daily)
- **Deploy hook:** Reloads Nginx after renewal
- **Domain:** `groupbillsplit.me` (Namecheap)

---

## CI/CD Pipeline

Every push to the `main` branch triggers an automatic deployment via GitHub Actions.

### Workflow: `.github/workflows/deploy.yml`

```yaml
on: push to main
steps:
  - SSH into production VM as `deploy` user
  - git pull latest code
  - docker compose build (only changed images)
  - docker compose up -d (zero-downtime restart)
  - docker image prune -f (clean up old images)
```

### Required GitHub Secrets

| Secret          | Value                         |
|-----------------|-------------------------------|
| `DEPLOY_HOST`   | `REDACTED`               |
| `DEPLOY_USER`   | `deploy`                      |
| `DEPLOY_SSH_KEY`| Private SSH key for deploy user |

---

## API Endpoints

All endpoints are prefixed with `/spring-api`.

### Sessions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions` | Create a session |
| GET | `/sessions/{id}` | Get session details |
| PUT | `/sessions/{id}` | Update session name |

### Participants
| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions/{id}/participants` | Add a participant |
| PUT | `/sessions/{id}/participants/{pid}` | Update participant name |
| DELETE | `/sessions/{id}/participants/{pid}` | Remove a participant |

### Expenses
| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions/{id}/items` | Add an expense |
| PUT | `/sessions/{id}/items/{itemId}` | Update an expense |
| DELETE | `/sessions/{id}/items/{itemId}` | Delete an expense |

### Calculations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions/{id}/calculate` | Calculate settlements |
| GET | `/sessions/{id}/summary` | Get session summary |

---

## Database Access (Production)

Access the production MySQL database via SSH tunnel:

```bash
# Open tunnel (keep this terminal open)
ssh -i REDACTED -L 3306:localhost:3306 ubuntu@REDACTED

# In another terminal, connect
mysql -h 127.0.0.1 -P 3306 -u splitter -p bill_splitter
```

**Credentials:** User `splitter`, password `REDACTED`, database `bill_splitter`.

Or use any GUI tool (MySQL Workbench, DBeaver, TablePlus) pointing to `localhost:3306`.

---

## Project Structure

```
├── .github/workflows/
│   └── deploy.yml              # CI/CD pipeline
├── backend/
│   ├── Dockerfile               # Multi-stage Maven -> JRE build
│   └── src/main/resources/
│       ├── application.properties
│       └── application-production.properties
├── frontend/
│   ├── Dockerfile               # Multi-stage Node -> Nginx build
│   ├── nginx.conf               # HTTPS + reverse proxy config
│   └── src/
├── docker-compose.yml
├── pom.xml
├── .env.example
└── README.md
```

---

## Deployment Notes

- **VM:** Oracle Cloud free tier (1 GB RAM, 1 OCPU)
- **Swap:** 2 GB swapfile to prevent OOM during Docker builds
- **Nginx:** `proxy_http_version 1.1` required for proper POST body forwarding
- **Backend startup:** ~60s (Hibernate schema validation + DB health checks)
- **DNS:** A records for `@` and `www` point to `REDACTED` (Namecheap)
- **Let's Encrypt:** `certbot.timer` runs twice daily; deploy hook reloads Nginx
