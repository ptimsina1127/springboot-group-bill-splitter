# Bill Splitter Full Build Documentation

A complete walkthrough of building, containerizing, deploying, and securing a full-stack Spring Boot + React application on Oracle Cloud free tier with Docker, DuckDNS, Let's Encrypt, and GitHub Actions CI/CD.

> **Author:** Pravat K Timsina
> **Live app:** [https://khoipaisa.duckdns.org](https://khoipaisa.duckdns.org)
> **Source:** https://github.com/ptimsina1127/springboot-group-bill-splitter

---

## Table of Contents

1. [Overview](#1-overview)
2. [Local Development Setup](#2-local-development-setup)
3. [Docker Containerization](#3-docker-containerization)
4. [Production Deployment — Oracle Cloud](#4-production-deployment--oracle-cloud-free-tier)
5. [SSL Certificate — Let's Encrypt + DuckDNS](#5-ssl-certificate--lets-encrypt--duckdns)
6. [Fixes & Debugging (Key Lessons Learned)](#6-fixes--debugging-key-lessons-learned)
7. [Database Access via SSH Tunnel](#7-database-access-via-ssh-tunnel)
8. [CI/CD with GitHub Actions](#8-cicd-with-github-actions)
9. [Quick Command Reference](#9-quick-command-reference)
10. [Architecture Diagram](#10-architecture-diagram)
11. [Glossary](#11-glossary)

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
| DNS          | DuckDNS (free dynamic DNS)                      |
| SSL          | Let's Encrypt (certbot)                         |
| CI/CD        | GitHub Actions                                  |
| Cloud        | Oracle Cloud free tier VM (1 GB RAM, 1 OCPU)   |

---

## 2. Local Development Setup

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

## 3. Docker Containerization

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
    server_name khoipaisa.duckdns.org;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name khoipaisa.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/khoipaisa.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/khoipaisa.duckdns.org/privkey.pem;

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

## 4. Production Deployment — Oracle Cloud Free Tier

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

## 5. SSL Certificate — Let's Encrypt + DuckDNS

### Why DuckDNS?

Oracle Cloud free tier VMs have dynamic IPs (they can change on reboot). DuckDNS provides a free domain name (`khoipaisa.duckdns.org`) with a cron job that auto-updates the IP every 5 minutes.

### DuckDNS Setup

```bash
# Create the update script
cat > ~/duckdns.sh << 'EOF'
#!/bin/sh
echo url="https://www.duckdns.org/update?domains=khoipaisa&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns.log -s
EOF
chmod +x ~/duckdns.sh

# Add to crontab (runs every 5 minutes)
echo "*/5 * * * * /home/ubuntu/duckdns.sh" | crontab -
```

Get your token from https://www.duckdns.org after signing in with GitHub.

### Let's Encrypt Certificate

```bash
# Install certbot
sudo apt install certbot -y

# Stop Nginx (port 80 must be free for standalone mode)
docker compose stop frontend

# Add temporary iptables rule (Oracle firewall blocks port 80 on host)
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT

# Get the certificate
sudo certbot certonly --standalone -d khoipaisa.duckdns.org \
  --non-interactive --agree-tos -m your@email.com --force-renewal

# Clean up iptables
sudo iptables -D INPUT -p tcp --dport 80 -j ACCEPT

# Restart frontend
docker compose up -d frontend
```

### Fix Symlinks for Nginx

Nginx config expects certs at `/etc/letsencrypt/live/khoipaisa.duckdns.org/`. If certbot created a `-0001` directory (because self-signed files already existed), fix it:

```bash
sudo rm -rf /etc/letsencrypt/live/khoipaisa.duckdns.org
sudo ln -s /etc/letsencrypt/live/khoipaisa.duckdns.org-0001 \
           /etc/letsencrypt/live/khoipaisa.duckdns.org
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

## 6. Fixes & Debugging (Key Lessons Learned)

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

## 7. Database Access via SSH Tunnel

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

## 8. CI/CD with GitHub Actions

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

## 9. Quick Command Reference

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
sudo certbot certonly --standalone -d khoipaisa.duckdns.org

# Check expiry
sudo openssl x509 -noout -dates -in /etc/letsencrypt/live/khoipaisa.duckdns.org/fullchain.pem

# Test renewal
sudo certbot renew --dry-run
```

---

## 10. Architecture Diagram

```
                          ┌─────────────────────┐
                          │     Internet        │
                          └─────────┬───────────┘
                                    │
                          https://khoipaisa.duckdns.org
                                    │
                          DuckDNS resolves to
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

## 11. Glossary

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
| **DuckDNS** | Free dynamic DNS service — maps a fixed domain name to a changing IP address |
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
