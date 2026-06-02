# Bill Splitter Full Build Documentation

A complete walkthrough of building, containerizing, deploying, and securing a full-stack Spring Boot + React application on Oracle Cloud free tier with Docker, Let's Encrypt, and GitHub Actions CI/CD.

> **Author:** Pravat K Timsina
> **Live app:** [https://groupbillsplit.me](https://groupbillsplit.me) • [https://www.groupbillsplit.me](https://www.groupbillsplit.me)
> **Source:** https://github.com/ptimsina1127/springboot-group-bill-splitter

---

## Table of Contents

1. [Overview](#1-overview)
2. [Webapp User Flow](#2-webapp-user-flow)
3. [Local Development Setup](#3-local-development-setup)
4. [Docker Containerization](#4-docker-containerization)
5. [Production Deployment — Oracle Cloud](#5-production-deployment--oracle-cloud-free-tier)
6. [SSL Certificate — Let's Encrypt + Custom Domain](#6-ssl-certificate--lets-encrypt--custom-domain)
7. [Fixes & Debugging (Key Lessons Learned)](#7-fixes--debugging-key-lessons-learned)
8. [Database Access via SSH Tunnel](#8-database-access-via-ssh-tunnel)
9. [CI/CD with GitHub Actions](#9-cicd-with-github-actions)
10. [Quick Command Reference](#10-quick-command-reference)
11. [Architecture Diagram](#11-architecture-diagram)
12. [Glossary](#12-glossary)
13. [Backend Spring Boot Flow Technical Specification](#13-backend-spring-boot-flow-technical-specification)

---

## 1. Overview

### What it does

A web app that lets groups of people split shared expenses. Create a session, add participants and expenses, then calculate who owes whom.

### Tech stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Backend      | Java 17, Spring Boot 3.1.5, JPA / Hibernate     |
| Frontend     | React 18, Vite, Tailwind CSS, Lucide React Icons|
| Database     | MySQL 8.0                                       |
| Deployment   | Docker Compose, Nginx reverse proxy             |
| DNS          | Namecheap (custom domain: groupbillsplit.me)    |
| SSL          | Let's Encrypt (certbot)                         |
| CI/CD        | GitHub Actions                                  |
| Cloud        | Oracle Cloud free tier VM (1 GB RAM, 1 OCPU)   |

---

## 2. Webapp User Flow

A complete walkthrough of how a user interacts with the Bill Splitter application from start to finish.

### 2.1 Home Page

**Route:** `/`

User lands on the home page showing:
- App branding with the tagline "Split bills effortlessly."
- **"Start New Session" button** — navigates to `/setup`
- **Session ID input + "Join" button** — enter an existing session ID to navigate directly to its dashboard

### 2.2 Create a Session

**Route:** `/setup` → `POST /spring-api/sessions`

User fills in:
- **Session Name** (required, e.g. "Tokyo Summer Trip 2024")
- **Number of People** (2–50, default 2)

On submit, the frontend calls:

```json
POST /spring-api/sessions
Body: { "name": "Tokyo Summer Trip 2024", "participantNames": ["Person 1", "Person 2"] }
```

The backend creates a `Session` entity with a UUID, creates `Participant` entities for each name, and returns:

```json
{ "id": "abc-123...", "name": "Tokyo Summer Trip 2024", "participantCount": 2 }
```

The browser navigates to `/session/abc-123...` (the session dashboard).

### 2.3 Session Dashboard

**Route:** `/session/:sessionId` → `GET /spring-api/sessions/:sessionId`

The dashboard shows:
- **Header** — session name (active badge), participant count, session ID, exit button
- **Participant cards** — one card per person showing their expense ledger
- **Settlement panel** — "Ready to settle?" section on the right side (desktop)

#### Participant Card (ParticipantLedger)

Each participant card contains:
- **Participant name** (click to rename inline)
- **Quick-add expense form** — enter description, amount, and who shares the cost
- **Expense list** — all expenses paid by this participant, showing description, amount, and shared-with count
- **Edit/Delete** buttons on each expense row
- **Share icon** — click to see who each expense is shared with

### 2.4 Add Expenses

**Via quick-add form:**
- User enters description, amount, and optionally adjusts who shares the expense
- Calls `POST /spring-api/sessions/:sessionId/items`
- The dashboard refreshes automatically

**Via modal (from ParticipantLedger or ExpenseList):**
- Click **"Add Expense"** to open a modal
- Fill in: description, amount, who paid, who shares
- Calls `POST /spring-api/sessions/:sessionId/items`
- Modal closes, dashboard refreshes

**Behavior:**
- If `sharedWithParticipantIds` is empty, the expense is split equally among ALL participants
- Each participant's net balance updates in real-time as expenses are added
- Expenses can be edited or deleted from the list

### 2.5 Calculate Settlements

**Button:** "Calculate Debts" → calls `POST /spring-api/sessions/:sessionId/calculate`

The backend runs the greedy settlement algorithm and returns:

```json
{
  "sessionId": "abc-123",
  "sessionName": "Tokyo Summer Trip 2024",
  "debts": [
    { "fromParticipantId": "...", "fromParticipantName": "Person 2",
      "toParticipantId": "...", "toParticipantName": "Person 1", "amount": 45.50 }
  ],
  "totalExpenses": 150.00
}
```

The UI shows:
- Total expenses badge
- List of debts: "Person 2 pays $45.50 to Person 1"
- If everything is balanced: "Everything is already settled!"

### 2.6 View Summary

**Route:** `GET /spring-api/sessions/:sessionId/summary`

Returns per-participant balances:
- `totalPaid` — how much they paid
- `totalOwed` — how much they owe (their share of expenses)
- `netBalance` — `totalPaid - totalOwed` (positive = creditor, negative = debtor)

This data can be used to show a balance summary alongside the settlement view.

### User Flow Diagram

```
Home ──> Create Session ──> Dashboard ──> Add Expenses ──> Calculate Debts ──> Done
  │                            │
  └──> Join by ID ─────────────┘
                                 │
                           Edit / Delete Expenses
                                 │
                           Add / Remove Participants
```

---

## 3. Local Development Setup

### Prerequisites

- Java 17+ installed
- Node.js 20+ installed
- MySQL 8.0 running on `localhost:3307`
- A database named `bill_splitter` must exist

### Backend (Spring Boot)

```bash
# In the project root:
./mvnw spring-boot:run
```

- Starts on `http://localhost:8080/spring-api`
- Uses `application.properties` (local config with `localhost:3307`)

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- Dev server on `http://localhost:5173`
- In development, Vite proxies API calls to `http://localhost:8080/spring-api`

### Environment file

Copy `.env.example` to `.env` and fill in your MySQL credentials:

```
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=bill_splitter
MYSQL_USER=splitter
MYSQL_PASSWORD=your_user_password
```

---

## 4. Docker Containerization

### docker-compose.yml — The Three Services

```yaml
services:
  db:       # MySQL 8.0
  backend:  # Spring Boot API
  frontend: # Nginx serving React SPA
```

#### db service

- Image: `mysql:8.0`
- Named volume `mysql-data` for persistence (survives container restarts)
- Health check that waits for MySQL to be ready before backend starts
- Environment variables from `.env` file
- Options for exposing port 3306 via SSH tunnel (bound to 127.0.0.1 only)

#### backend service

- Builds from `backend/Dockerfile` (not a pre-built image)
- Container name: `bill-splitter-backend`
- Depends on `db` being healthy first — waits for MySQL before starting
- Profile set to `production` via env `SPRING_PROFILES_ACTIVE=production`
- Database host is `db` (Docker internal DNS resolution)
- Internal port: 8080 (not exposed to host — only accessible within Docker network)

#### frontend service

- Builds from `frontend/Dockerfile`
- Container name: `bill-splitter-frontend`
- Host ports: 80 (HTTP) and 443 (HTTPS)
- Mounts host directory `/etc/letsencrypt` (read-only) for SSL certificates
- Build arg: `VITE_API_URL=/spring-api` — tells the React app to call the API via the same domain

### Dockerfiles Explained

#### backend/Dockerfile (multi-stage build)

```dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
COPY pom.xml ./
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Run (smaller final image)
FROM eclipse-temurin:17-jre
COPY --from=build target/*.jar app.jar
CMD ["java", "-jar", "app.jar", "--spring.profiles.active=production"]
```

**Why multi-stage?** The Maven build image is ~400 MB. The final JRE image is ~80 MB. The build tools are discarded, leaving only the compiled JAR.

#### frontend/Dockerfile (multi-stage build)

```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration (`frontend/nginx.conf`)

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name groupbillsplit.me;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name groupbillsplit.me;

    ssl_certificate /etc/letsencrypt/live/groupbillsplit.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/groupbillsplit.me/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    # Serve React SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to backend
    location /spring-api/ {
        proxy_pass http://backend:8080/spring-api/;
        proxy_http_version 1.1;          # CRITICAL: fixes POST body corruption
        proxy_set_header Connection "";   # CRITICAL: enables keep-alive
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Why `proxy_http_version 1.1`?** By default, Nginx proxies using HTTP/1.0 which doesn't support chunked transfer encoding. POST request bodies get corrupted (you'd see errors like "JSON parse error: Unrecognized character escape ':'"). HTTP/1.1 + empty `Connection` header fixes this.

---

## 5. Production Deployment — Oracle Cloud Free Tier

### Step 1: Create VM Instance

1. Log into Oracle Cloud Console
2. Create a VM instance (Ubuntu 22.04/24.04, 1 GB RAM, 1 OCPU — always free tier)
3. Download the SSH private key
4. Note the public IP address

### Step 2: Open Firewall Ports

In Oracle Cloud Console, add ingress rules to the security list / network security group:

- Port 22 (SSH) — already open by default
- Port 80 (HTTP)
- Port 443 (HTTPS)

### Step 3: SSH into VM

```bash
ssh -i ~/Downloads/your-key.key ubuntu@<your-vm-ip>
```

For Oracle Cloud, the default user is `ubuntu` (not `opc` like some older images).

### Step 4: Install Required Software

```bash
# System update
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to docker group (avoids needing sudo for docker)
sudo usermod -aG docker $USER
# Then log out and back in, or run: newgrp docker

# Install Docker Compose v2 (usually included with Docker)
docker compose version    # Should show v2.x

# Install Git
sudo apt install git -y

# Clone the repo
git clone https://github.com/ptimsina1127/springboot-group-bill-splitter.git
cd springboot-group-bill-splitter
```

### Step 5: Add Swap Space (Prevents OOM)

The free tier VM has only 1 GB RAM. Docker builds can easily exceed this and crash.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

### Step 6: Create .env File

```bash
nano .env
# Paste:
MYSQL_ROOT_PASSWORD=<your_root_password>
MYSQL_DATABASE=bill_splitter
MYSQL_USER=splitter
MYSQL_PASSWORD=<your_user_password>
```

### Step 7: Deploy

```bash
docker compose up -d
```

This builds all three images and starts the containers. First build takes ~5 minutes (Maven downloads dependencies).

### Step 8: Monitor

```bash
docker compose logs -f
```

Watch for the backend to finish starting (~60 seconds for Hibernate + DB health check).

---

## 6. SSL Certificate — Let's Encrypt + Custom Domain

### Domain

The app runs on `groupbillsplit.me` (registered on Namecheap). DNS A records point both `@` and `www` to the server IP `<old-server-ip>`.

### DuckDNS (migrated)

Originally the app used DuckDNS (`groupbillsplit.duckdns.org`) to handle the Oracle Cloud VM's dynamic IP. The DuckDNS cron job has been removed in favor of a static IP and custom domain. The cron cleanup is handled automatically in the deploy script.

### Let's Encrypt Certificate

```bash
# Install certbot
sudo apt install certbot -y

# Stop Nginx (port 80 must be free for standalone mode)
docker compose stop frontend

# Add temporary iptables rule (Oracle firewall blocks port 80 on host)
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT

# Get the certificate
sudo certbot certonly --standalone -d groupbillsplit.me \
  --non-interactive --agree-tos -m your@email.com --force-renewal

# Clean up iptables
sudo iptables -D INPUT -p tcp --dport 80 -j ACCEPT

# Restart frontend
docker compose up -d frontend
```

### Fix Symlinks for Nginx (old DuckDNS setup)

Nginx config expects certs at `/etc/letsencrypt/live/{domain}/`. If certbot created a `-0001` directory (because self-signed files already existed), fix it:

```bash
sudo rm -rf /etc/letsencrypt/live/groupbillsplit.me
sudo ln -s /etc/letsencrypt/live/groupbillsplit.me-0001 \
           /etc/letsencrypt/live/groupbillsplit.me
```

### Auto-Renewal

Certbot automatically sets up a systemd timer that checks twice daily:

```bash
sudo systemctl status certbot.timer
```

**Deploy hook** to reload Nginx after renewal:

```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/sh
cd /home/ubuntu/springboot-group-bill-splitter && docker compose exec -T frontend nginx -s reload
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## 7. Fixes & Debugging (Key Lessons Learned)

### Issue 1: Spring Security Blocking Endpoints

**Symptom:** API calls returning 401/403 or login page HTML instead of JSON.

**Root cause:** `spring-boot-starter-security` was in `pom.xml` with a `SecurityConfig.java` that was broken or overly restrictive.

**Fix:** Removed `spring-boot-starter-security` from `pom.xml` and deleted `SecurityConfig.java`.

### Issue 2: Missing @RestController

**Symptom:** 404 errors on all API endpoints after code changes.

**Root cause:** The `@RestController` annotation was accidentally deleted from `SessionController.java` during a `nano` edit.

**Fix:** Added `@RestController` back to the class.

### Issue 3: Lombok Constructor Conflicts

**Symptom:** Compilation errors — "The blank final field X may not have been initialized."

**Root cause:** Both `@RequiredArgsConstructor` AND explicit constructors existed in `SessionService.java` and `SessionController.java`. Lombok's generated constructor conflicted with the manual one.

**Fix:** Removed the explicit constructors, kept only Lombok's `@RequiredArgsConstructor`.

### Issue 4: Nginx POST Body Corruption

**Symptom:** Backend logs show `JSON parse error: Unrecognized character escape ':' (code 58)`.

**Root cause:** Nginx proxies to backend using HTTP/1.0 by default. HTTP/1.0 doesn't support chunked transfer encoding, so POST bodies get corrupted.

**Fix:** Added to nginx.conf:

```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
```

### Issue 5: Frontend Can't Reach API (CORS / Wrong URL)

**Symptom:** Browser shows "Error creating session. Please check your backend!" but backend logs show nothing.

**Root cause:** The `VITE_API_URL` build arg was NOT passed to the frontend Docker build in `docker-compose.yml`. The frontend fell back to `http://localhost:8080/spring-api` — a different origin — causing CORS errors.

**Fix:** Added build args to docker-compose.yml:

```yaml
frontend:
  build:
    args:
      VITE_API_URL: /spring-api
```

### Issue 6: STS Shows False Lombok Errors

**Symptom:** Eclipse/STS shows "The blank final field X may not have been initialized" on files using `@RequiredArgsConstructor`, but the project compiles fine with Maven.

**Root cause:** STS doesn't understand Lombok annotations without the Lombok plugin installed.

**Fix:** Install Lombok into STS:

1. `winget install EclipseAdoptium.Temurin.17.JDK` (if Java not installed on your machine)
2. Download `lombok.jar` from https://projectlombok.org/download
3. Run `java -jar lombok.jar` and point it to your STS installation
4. In STS: **Window → Preferences → Annotation Processing** → enable annotation processing

---

## 8. Database Access via SSH Tunnel

### Why SSH Tunnel?

Exposing MySQL directly to the internet (port 3306) is a security risk. An SSH tunnel lets you connect securely through an encrypted channel.

### Step 1: Add port to docker-compose.yml

```yaml
db:
  ports:
    - "127.0.0.1:3306:3306"   # Only binds to localhost
```

Then recreate the container (data is safe in the volume):

```bash
docker compose up -d db
```

### Step 2: Open Tunnel (on your local machine)

```bash
ssh -i <ssh-key-path> -L 3306:localhost:3306 ubuntu@<old-server-ip>
```

Keep this terminal window open. The tunnel forwards your local port 3306 to the VM's port 3306 through SSH.

### Step 3: Connect (in a second terminal)

**Via CLI:**

```bash
mysql -h 127.0.0.1 -P 3306 -u splitter -p bill_splitter
# Password: <your_password>
```

**Via GUI (MySQL Workbench, DBeaver, TablePlus):**

- Host: `127.0.0.1` (or `localhost`)
- Port: `3306`
- User: `splitter`
- Password: `<your_password>`
- Database: `bill_splitter`

---

## 9. CI/CD with GitHub Actions

### How it works

```
You push to main → GitHub Actions → SSH into VM → git pull → rebuild containers → restart
```

### File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /home/deploy/app
            git pull
            docker compose build
            docker compose up -d
            docker image prune -f
```

### Setup Checklist

**On the VM:**

```bash
# Create deploy user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Generate SSH key
sudo -u deploy ssh-keygen -t ed25519 -f /home/deploy/.ssh/id_ed25519 -N ""

# Authorize the key
sudo -u deploy sh -c 'cat /home/deploy/.ssh/id_ed25519.pub >> /home/deploy/.ssh/authorized_keys'
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
sudo -u deploy chmod 700 /home/deploy/.ssh

# Clone repo
sudo -u deploy git clone https://github.com/ptimsina1127/springboot-group-bill-splitter.git /home/deploy/app

# Copy .env
sudo cp /home/ubuntu/springboot-group-bill-splitter/.env /home/deploy/app/.env
sudo chown -R deploy:deploy /home/deploy/app

# View private key (copy this to GitHub)
sudo cat /home/deploy/.ssh/id_ed25519
```

**In GitHub repo settings:**

Go to **Settings → Secrets and variables → Actions** and add these secrets:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | `<old-server-ip>` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | (paste the private key) |

---

## 10. Quick Command Reference

### Docker

| Command | What it does |
|---------|-------------|
| `docker compose up -d` | Build and start all services in background |
| `docker compose down` | Stop and remove all containers |
| `docker compose build <service>` | Rebuild a specific service image |
| `docker compose logs -f` | Follow all logs |
| `docker compose logs <service>` | Logs for a specific service |
| `docker compose exec <service> <cmd>` | Run a command inside a running container |
| `docker compose ps` | List container status |
| `docker system prune -a -f` | Remove all unused images/containers/cache |

### Specific service commands

```bash
# Backend logs
docker compose logs backend -f

# Rebuild backend
docker compose build backend

# Restart backend
docker compose up -d backend

# Bash into backend container
docker compose exec backend sh

# MySQL CLI
docker compose exec db mysql -u splitter -p bill_splitter

# Check Nginx config
docker compose exec frontend nginx -t

# Reload Nginx
docker compose exec frontend nginx -s reload
```

### SSH (from your local machine)

```bash
# Basic SSH
ssh -i <ssh-key-path> ubuntu@<old-server-ip>

# SSH tunnel (MySQL)
ssh -i <ssh-key-path> -L 3306:localhost:3306 ubuntu@<old-server-ip>

# Copy a file
scp -i <ssh-key-path> local-file.txt ubuntu@<old-server-ip>:~/remote-path/
```

### Git

```bash
git status                          # Check current state
git add <file>                      # Stage a file
git commit -m "message"             # Commit
git push                            # Push to GitHub
git log --oneline                   # View commit history
git diff                            # See uncommitted changes
```

### Certbot / SSL

```bash
# Get certificate
sudo certbot certonly --standalone -d groupbillsplit.me

# Check expiry
sudo openssl x509 -noout -dates -in /etc/letsencrypt/live/groupbillsplit.me/fullchain.pem

# Test renewal
sudo certbot renew --dry-run
```

---

## 11. Architecture Diagram

```
                          ┌─────────────────────┐
                          │     Internet        │
                          └─────────┬───────────┘
                                    │
                          https://groupbillsplit.me
                                    │
                           DNS resolves to
                          ┌──────────────────┐
                          │  <old-server-ip>    │
                          │  (Oracle Cloud VM)│
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
              │  frontend  │  │ backend │  │    db     │
              │  Nginx     │  │ Spring  │  │  MySQL    │
              │ :80 / :443 │  │ Boot    │  │  8.0      │
              │            │  │ :8080   │  │ :3306     │
              └────────────┘  └─────────┘  └───────────┘
                     │              │            │
                     │         ┌────┘            │
                     │         │                 │
                     └─────────┼─────────────────┘
                               │
                     Docker Compose Network
                     (springboot-group-bill-splitter_default)
```

### Request flow (creating a session):

```
1. Browser POST /spring-api/sessions
       │
2. Nginx receives on port 443 (HTTPS)
       │
3. Nginx matches location /spring-api/
       │
4. Nginx proxies to http://backend:8080/spring-api/ (HTTP/1.1)
       │
5. Spring Boot receives, processes, creates Session in DB
       │
6. Response flows back: backend -> Nginx -> Browser
```

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **Docker** | Containerization platform — packages apps with their dependencies into isolated containers |
| **Docker Compose** | Tool to define and run multiple containers together |
| **Image** | A read-only template (like a snapshot) used to create containers |
| **Container** | A running instance of an image |
| **Volume** | Persistent storage that survives container restarts |
| **Nginx** | Web server and reverse proxy — sits in front of the backend, handles SSL, serves static files |
| **Reverse proxy** | A server that forwards client requests to backend servers, then returns the response to the client |
| **proxy_pass** | Nginx directive that forwards requests to another server |
| **proxy_http_version 1.1** | Forces Nginx to use HTTP/1.1 when proxying (fixes POST body issues) |
| **SSL / TLS** | Encryption protocols for HTTPS connections |
| **Let's Encrypt** | Free, automated certificate authority providing SSL certs |
| **Certbot** | Tool that automates obtaining and renewing Let's Encrypt certs |
| **DuckDNS** | Free dynamic DNS service — previously used before migrating to a custom domain |
| **Multi-stage build** | Dockerfile technique — uses one image to build, then copies only artifacts to a smaller final image |
| **GitHub Actions** | CI/CD service — automatically runs workflows when code is pushed |
| **SSH tunnel** | Encrypted connection that forwards a local port to a remote server through SSH |
| **OOM** | Out of Memory — when the system runs out of RAM |
| **Swap** | Disk space used as virtual RAM when physical RAM is full |
| **JPA / Hibernate** | Java ORM — maps Java objects to database tables |
| **Vite** | Modern frontend build tool (faster than webpack) |
| **Lombok** | Java library that generates boilerplate code (getters, constructors) via annotations |
| **@RequiredArgsConstructor** | Lombok annotation — generates a constructor for all `final` fields |
| **EntityNotFoundException** | JPA exception thrown when a database record is not found |

---

## 13. Backend Spring Boot Flow Technical Specification

### 13.1 Package Structure

```
com.billsplitter
├── BillSplitterApplication.java        (main entry point)
├── config/
│   └── CorsConfig.java                 (CORS configuration)
├── controller/
│   ├── HealthController.java           (health check endpoint)
│   └── SessionController.java          (all business endpoints)
├── dto/
│   ├── CreateSessionRequest.java
│   ├── UpdateSessionRequest.java
│   ├── SessionResponse.java
│   ├── SessionDetailResponse.java
│   ├── SessionSummaryResponse.java
│   ├── AddParticipantRequest.java
│   ├── UpdateParticipantRequest.java
│   ├── ParticipantResponse.java
│   ├── ParticipantBalanceResponse.java
│   ├── AddExpenseItemRequest.java
│   ├── UpdateExpenseItemRequest.java
│   ├── ExpenseItemResponse.java
│   ├── DebtResponse.java
│   └── SettlementResultResponse.java
├── entity/
│   ├── Session.java
│   ├── Participant.java
│   └── ExpenseItem.java
├── repository/
│   ├── SessionRepository.java
│   ├── ParticipantRepository.java
│   └── ExpenseItemRepository.java
├── service/
│   └── SessionService.java
└── util/
    └── StringListConverter.java        (JSON array <-> TEXT converter)
```

### 13.2 Entity Models

#### Session (table: `sessions`)

| Field | Type | Constraints |
|---|---|---|
| `id` | `String` (UUID, 36 chars) | `@Id` |
| `name` | `String` | `@Column(nullable=false)` |
| `createdAt` | `LocalDateTime` | `@CreationTimestamp`, `updatable=false` |

**Relationships:**
- `@OneToMany(mappedBy="session", cascade=ALL, orphanRemoval=true)` → `List<Participant>`
- `@OneToMany(mappedBy="session", cascade=ALL, orphanRemoval=true)` → `List<ExpenseItem>`

**Design notes:**
- Uses a static inner `SessionBuilder` class
- `equals/hashCode` based on `id`
- UUID generated manually via `UUID.randomUUID().toString()` in the service layer

#### Participant (table: `participants`)

| Field | Type | Constraints |
|---|---|---|
| `id` | `String` (UUID, 36 chars) | `@Id` |
| `name` | `String` | `@Column(nullable=false)` |
| `displayOrder` | `int` | `@Column(name="display_order", nullable=false)` |

**Relationships:**
- `@ManyToOne(fetch=LAZY)` → `Session` via `@JoinColumn(name="session_id")`

#### ExpenseItem (table: `expense_items`)

| Field | Type | Constraints |
|---|---|---|
| `id` | `String` (UUID, 36 chars) | `@Id` |
| `paidByParticipantId` | `String` (UUID) | `nullable=false` |
| `description` | `String` | `@Column(nullable=false)` |
| `amount` | `BigDecimal` | `precision=12, scale=2` |
| `sharedWithParticipantIds` | `List<String>` | Stored as JSON TEXT via `StringListConverter` |
| `createdAt` | `LocalDateTime` | `@CreationTimestamp`, `updatable=false` |

**Relationships:**
- `@ManyToOne(fetch=LAZY)` → `Session` via `@JoinColumn(name="session_id")`

### 13.3 Database Schema

```sql
sessions
├── id          VARCHAR(36)  PRIMARY KEY
├── name        VARCHAR(255) NOT NULL
└── created_at  DATETIME

participants
├── id            VARCHAR(36)  PRIMARY KEY
├── session_id    VARCHAR(36)  FOREIGN KEY -> sessions(id)
├── name          VARCHAR(255) NOT NULL
└── display_order INT          NOT NULL

expense_items
├── id                          VARCHAR(36)  PRIMARY KEY
├── session_id                  VARCHAR(36)  FOREIGN KEY -> sessions(id)
├── paid_by_participant_id      VARCHAR(36)  NOT NULL
├── description                 VARCHAR(255) NOT NULL
├── amount                      DECIMAL(12,2) NOT NULL
├── shared_with_participant_ids TEXT         (JSON array of participant UUIDs)
└── created_at                  DATETIME
```

**Key relationship rules:**
- Deleting a Session cascades to all its Participants and ExpenseItems
- Participants and ExpenseItems cannot exist without a parent Session
- `sharedWithParticipantIds` is stored as a JSON string, not a join table

### 13.4 DTOs (All are Java `record` types)

#### Request DTOs

| DTO | Fields | Validation |
|---|---|---|
| `CreateSessionRequest` | `String name`, `List<String> participantNames` | `@NotBlank` on name, `@NotEmpty` on participantNames |
| `UpdateSessionRequest` | `String name` | `@NotBlank` on name |
| `AddParticipantRequest` | `String name` | `@NotBlank` on name |
| `UpdateParticipantRequest` | `String name` | `@NotBlank` on name |
| `AddExpenseItemRequest` | `String paidByParticipantId`, `String description`, `BigDecimal amount`, `List<String> sharedWithParticipantIds` | `@NotBlank` on paidByParticipantId & description, `@NotNull @PositiveOrZero` on amount |
| `UpdateExpenseItemRequest` | Same as AddExpenseItemRequest | Same validation rules |

#### Response DTOs

| DTO | Fields | Purpose |
|---|---|---|
| `SessionResponse` | `id`, `name`, `createdAt`, `participantCount` | Returned after create / update |
| `SessionDetailResponse` | `id`, `name`, `createdAt`, `participants[]`, `items[]` | Full session view |
| `SessionSummaryResponse` | `sessionId`, `sessionName`, `totalExpenses`, `participantCount`, `itemCount`, `balances[]` | Balance overview |
| `ParticipantResponse` | `id`, `sessionId`, `name`, `displayOrder` | Single participant |
| `ParticipantBalanceResponse` | `participantId`, `participantName`, `totalPaid`, `totalOwed`, `netBalance` | Per-person balance |
| `ExpenseItemResponse` | `id`, `sessionId`, `paidByParticipantId`, `description`, `amount`, `sharedWithParticipantIds` | Single expense |
| `DebtResponse` | `fromParticipantId`, `fromParticipantName`, `toParticipantId`, `toParticipantName`, `amount` | A single debt (X owes Y $Z) |
| `SettlementResultResponse` | `sessionId`, `sessionName`, `debts[]`, `totalExpenses` | Full settlement output |

### 13.5 Repository Layer

| Repository | Extends | Custom Methods |
|---|---|---|
| `SessionRepository` | `JpaRepository<Session, String>` | None (standard CRUD) |
| `ParticipantRepository` | `JpaRepository<Participant, String>` | `findBySessionIdOrderByDisplayOrderAsc(sessionId)`, `countBySessionId(sessionId)` |
| `ExpenseItemRepository` | `JpaRepository<ExpenseItem, String>` | `findBySessionId(sessionId)` |

All repositories inherit: `findById()`, `save()`, `delete()`, `findAll()`.

### 13.6 Service Layer — `SessionService`

Annotated with `@Service`, `@RequiredArgsConstructor`, `@Transactional`. Injects all three repositories.

#### Session Methods

| Method | Transaction | Logic |
|---|---|---|
| `createSession(req)` | Read-Write | Generates UUID → creates `Session` → iterates `participantNames` → creates `Participant` with incremental `displayOrder` → saves all → returns `SessionResponse` with count |
| `getSession(id)` | Read-Only | Finds session → fetches participants ordered by `displayOrder` → fetches items → returns `SessionDetailResponse` |
| `updateSession(id, req)` | Read-Write | Finds session → updates `name` → saves → queries `countBySessionId` → returns `SessionResponse` |

#### Participant Methods

| Method | Transaction | Logic |
|---|---|---|
| `addParticipant(sessionId, req)` | Read-Write | Finds session → counts existing participants → new `displayOrder` = count + 1 → saves `Participant` |
| `updateParticipant(sessionId, participantId, req)` | Read-Write | Finds participant (verifies session ownership) → updates name → saves |
| `removeParticipant(sessionId, participantId)` | Read-Write | Finds participant (verifies session ownership) → deletes |

#### Expense Item Methods

| Method | Transaction | Logic |
|---|---|---|
| `addExpenseItem(sessionId, req)` | Read-Write | Finds session → if `sharedWithParticipantIds` is null, defaults to empty list → saves `ExpenseItem` |
| `updateExpenseItem(sessionId, itemId, req)` | Read-Write | Finds item (verifies session ownership) → updates all fields → saves |
| `deleteExpenseItem(sessionId, itemId)` | Read-Write | Finds item (verifies session ownership) → deletes |

#### Settlement & Summary

| Method | Transaction | Logic |
|---|---|---|
| `calculateSettlements(sessionId)` | Read-Only | Runs the full settlement algorithm (see 13.8) |
| `getSessionSummary(sessionId)` | Read-Only | Computes per-participant paid/owed/net balances |

### 13.7 Controller Layer — `SessionController`

`@RestController` with `@RequiredArgsConstructor`. All endpoints return `ResponseEntity`.

| HTTP | Path | Request | Response | Status |
|---|---|---|---|---|
| POST | `/sessions` | `CreateSessionRequest` | `SessionResponse` | 201 Created |
| GET | `/sessions/{id}` | — | `SessionDetailResponse` | 200 / 404 |
| PUT | `/sessions/{id}` | `UpdateSessionRequest` | `SessionResponse` | 200 / 404 |
| POST | `/sessions/{id}/participants` | `AddParticipantRequest` | `ParticipantResponse` | 201 / 404 |
| PUT | `/sessions/{id}/participants/{pid}` | `UpdateParticipantRequest` | `ParticipantResponse` | 200 / 404 |
| DELETE | `/sessions/{id}/participants/{pid}` | — | — | 204 / 404 |
| POST | `/sessions/{id}/items` | `AddExpenseItemRequest` | `ExpenseItemResponse` | 201 / 404 |
| PUT | `/sessions/{id}/items/{iid}` | `UpdateExpenseItemRequest` | `ExpenseItemResponse` | 200 / 404 |
| DELETE | `/sessions/{id}/items/{iid}` | — | — | 204 / 404 |
| POST | `/sessions/{id}/calculate` | — | `SettlementResultResponse` | 200 / 404 |
| GET | `/sessions/{id}/summary` | — | `SessionSummaryResponse` | 200 / 404 |

**Error handling in controller:**
- `EntityNotFoundException` → `404 Not Found` (caught in every endpoint)
- `MethodArgumentNotValidException` → `400 Bad Request` with `{"error": "fieldName: message"}` (via `@ExceptionHandler`)

### 13.8 Settlement Algorithm (Greedy Debt Simplification)

The `calculateSettlements()` method implements an optimized debt settlement algorithm:

```
Step 1: Compute net balance for each participant
  For each expense item:
    - Add full amount to payer's balance (they paid this much)
    - Split amount equally among sharedWithParticipantIds
      (if empty, split among ALL participants)
    - Subtract each sharer's portion from their balance
  Division uses 10 decimal places with HALF_UP rounding

Step 2: Separate into creditors and debtors
  creditors = participants with positive net balance
  debtors   = participants with negative net balance (stored as absolute value)

Step 3: Sort both lists by amount descending

Step 4: Greedily match creditors to debtors
  while creditors and debtors both have entries:
    take largest creditor and largest debtor
    settlement = min(creditor.balance, debtor.balance)
    record: debtor pays settlement to creditor
    reduce both balances by settlement amount
    if balance < 0.001, advance to next person

Step 5: Return list of DebtResponse entries + total expenses
```

**Result:** The minimum number of transactions needed to settle all debts.

### 13.9 Configuration

#### Local (`application.properties`)

```properties
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/bill_splitter?useSSL=false
spring.datasource.username=root
spring.datasource.password=<your-password>
spring.jpa.hibernate.ddl-auto=create
spring.jpa.open-in-view=false
server.servlet.context-path=/spring-api
```

- DDL mode `create` — drops and recreates tables on each start (development only)
- Context path: `/spring-api`
- OSIV disabled (all lazy loading must happen within `@Transactional`)

#### Production (`application-production.properties`)

```properties
spring.datasource.url=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=false
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false
server.servlet.context-path=/spring-api
```

- All values overridable via environment variables
- DDL mode `update` — preserves existing data, alters schema if needed
- Docker Compose sets `DB_HOST=db`, `DB_PORT=3306`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` from `.env`

### 13.10 CORS Configuration

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET", POST, PUT, DELETE, PATCH, OPTIONS)
                        .allowedHeaders("*")
                        .allowCredentials(false);
            }
        };
    }
}
```

- Allows all origins, all standard HTTP methods
- Does NOT allow credentials (cookies, auth headers)
- In production, CORS is bypassed entirely because Nginx proxies same-origin requests

### 13.11 End-to-End Data Flow

```
Browser
  │  POST /spring-api/sessions
  │  { "name": "Trip", "participantNames": ["A", "B"] }
  ▼
Nginx (port 443, HTTPS)
  │  proxy_pass http://backend:8080/spring-api/
  │  (HTTP/1.1, keep-alive)
  ▼
SessionController.createSession()
  │  @Valid validates CreateSessionRequest
  │  @RequestBody deserializes JSON -> Java record
  ▼
SessionService.createSession()
  │  @Transactional
  │  UUID.randomUUID() -> session ID
  │  Creates Session entity
  │  Creates Participant entities (with displayOrder)
  │  sessionRepository.save(session) -- cascades to participants
  ▼
MySQL
  │  INSERT INTO sessions (id, name, created_at)
  │  INSERT INTO participants (id, session_id, name, display_order) x N
  ▼
Response flows back:
  Session entity -> SessionResponse DTO -> JSON -> Nginx -> Browser
```

### 13.12 Key Design Decisions

| Decision | Rationale |
|---|---|
| **UUIDs as primary keys** | No auto-increment conflicts, safe for distributed systems |
| **`sharedWithParticipantIds` as JSON TEXT** | Avoids complex join tables for expense sharing; simpler queries |
| **No session DELETE endpoint** | Prevents accidental data loss |
| **Lombok only for `@RequiredArgsConstructor`** | Keeps DI clean without exposing all fields via @Data |
| **`open-in-view=false`** | Forces proper transactional boundaries, prevents lazy-loading issues |
| **No global exception handler** | Each controller handles its own exceptions explicitly |
| **`ddl-auto=update` in production** | Schema evolves with code; no manual migration scripts needed |
