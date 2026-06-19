# CareNest – Deployment Guide
**Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16  
**Platform:** Render / Railway (PaaS)  
**Date:** June 2026  |  **Project:** CodeQuest 2026 – Group 19

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                     PaaS Platform                      │
│                  (Render / Railway)                    │
│                                                        │
│  ┌─────────────────────┐   ┌──────────────────────┐   │
│  │  Spring Boot API    │   │   PostgreSQL 16       │   │
│  │  (Web Service)      │──▶│   (Managed DB)        │   │
│  │  Port 8080          │   │                      │   │
│  └─────────────────────┘   └──────────────────────┘   │
│            │                                           │
│            │ environment variables                     │
│            ▼                                           │
│  ┌─────────────────────┐                               │
│  │  Secret / Env Store │                               │
│  └─────────────────────┘                               │
└────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
  Paystack API            Firebase / FCM
  (Payments)              (Push Notifications)
```

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Java 21 JDK installed locally (`java -version`)
- [ ] Maven 3.9+ or Gradle 8+ (`mvn -version`)
- [ ] A Render **or** Railway account (free tier works for development)
- [ ] A Paystack account with your Secret Key and Webhook Secret
- [ ] A Firebase project with a service account JSON for FCM push notifications
- [ ] Your PostgreSQL database provisioned (see Section 2)

---

## Section 1 – Project Structure

Your Spring Boot project should follow this structure:

```
carenest-api/
├── src/
│   └── main/
│       ├── java/com/carenest/api/
│       │   ├── auth/           # JWT, refresh token, login
│       │   ├── family/         # Family profile, addresses
│       │   ├── agency/         # Agency CRUD, verification
│       │   ├── worker/         # Worker CRUD, documents
│       │   ├── booking/        # Booking lifecycle
│       │   ├── payment/        # Paystack integration, webhooks
│       │   ├── messaging/      # Conversations, messages
│       │   ├── notification/   # Push notifications
│       │   ├── admin/          # Admin endpoints
│       │   └── config/         # Security, CORS, beans
│       └── resources/
│           ├── application.yml
│           ├── application-prod.yml
│           └── db/migration/   # Flyway migration scripts
├── Dockerfile
├── pom.xml (or build.gradle)
└── .env.example
```

---

## Section 2 – Database Setup

### 2a. Provision a Managed PostgreSQL Database

**On Render:**
1. Go to Dashboard → New → PostgreSQL
2. Name: `carenest-db`
3. Region: Choose closest to your users (e.g. Frankfurt for West Africa latency)
4. Plan: Free (dev) or Starter ($7/mo for production)
5. Copy the **External Database URL** — format: `postgresql://user:pass@host:5432/dbname`

**On Railway:**
1. New Project → Add Service → Database → PostgreSQL
2. Click the PostgreSQL service → Variables tab
3. Copy `DATABASE_URL`

### 2b. Run the Schema

Run `01_CareNest_Schema.sql` against your provisioned database:

```bash
# Using psql (install: brew install libpq  or  apt install postgresql-client)
psql "postgresql://user:pass@host:5432/carenest" -f 01_CareNest_Schema.sql
```

Alternatively, use Flyway for version-controlled migrations (recommended):

```
src/main/resources/db/migration/
├── V1__initial_schema.sql          ← paste content of 01_CareNest_Schema.sql here
├── V2__seed_service_categories.sql ← already included in schema (INSERT INTO service_categories)
└── V3__add_indexes.sql             ← any future index additions go here
```

Flyway runs automatically on Spring Boot startup when configured (see Section 3).

---

## Section 3 – Environment Variables

Create a `.env.example` in your repo root (never commit `.env` with real secrets):

```bash
# ── Database ────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@host:5432/carenest
DB_POOL_SIZE=10

# ── JWT ─────────────────────────────────────────────────
JWT_SECRET=<generate: openssl rand -base64 64>
JWT_ACCESS_EXPIRY_MS=900000        # 15 minutes
JWT_REFRESH_EXPIRY_MS=604800000    # 7 days

# ── Paystack ─────────────────────────────────────────────
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
PAYSTACK_BASE_URL=https://api.paystack.co

# ── Firebase (FCM Push Notifications) ───────────────────
FIREBASE_PROJECT_ID=carenest-prod
FIREBASE_SERVICE_ACCOUNT_JSON=<base64-encoded contents of serviceAccountKey.json>

# ── App ──────────────────────────────────────────────────
APP_BASE_URL=https://api.carenest.app
ALLOWED_ORIGINS=https://carenest.app,capacitor://localhost,http://localhost:8081
```

### `application-prod.yml`
```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    hikari:
      maximum-pool-size: ${DB_POOL_SIZE:10}
  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: 8080

jwt:
  secret: ${JWT_SECRET}
  access-expiry-ms: ${JWT_ACCESS_EXPIRY_MS}
  refresh-expiry-ms: ${JWT_REFRESH_EXPIRY_MS}

paystack:
  secret-key: ${PAYSTACK_SECRET_KEY}
  webhook-secret: ${PAYSTACK_WEBHOOK_SECRET}
  base-url: ${PAYSTACK_BASE_URL}

app:
  base-url: ${APP_BASE_URL}
  allowed-origins: ${ALLOWED_ORIGINS}
```

---

## Section 4 – Building the Application

### Maven
```bash
# Build a fat JAR (skipping tests for a quick build)
mvn clean package -DskipTests

# The output is at:
target/carenest-api-1.0.0.jar
```

### Gradle
```bash
./gradlew build -x test

# Output:
build/libs/carenest-api-1.0.0.jar
```

### Verify it runs locally
```bash
java -jar target/carenest-api-1.0.0.jar \
  --spring.profiles.active=prod \
  --DATABASE_URL=postgresql://localhost:5432/carenest_dev
```
Hit `http://localhost:8080/actuator/health` — should return `{"status":"UP"}`.

---

## Section 5 – Dockerfile

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/carenest-api-*.jar app.jar

# Non-root user for security
RUN addgroup -S carenest && adduser -S carenest -G carenest
USER carenest

EXPOSE 8080

ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
```

Build and test locally:
```bash
docker build -t carenest-api .
docker run -p 8080:8080 --env-file .env carenest-api
```

---

## Section 6 – Deploying on Render

### 6a. Create a Web Service

1. Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Fill in:

| Field | Value |
|---|---|
| **Name** | `carenest-api` |
| **Runtime** | Docker (use your Dockerfile) |
| **Region** | Frankfurt (EU) |
| **Branch** | `main` |
| **Build Command** | *(handled by Dockerfile)* |
| **Start Command** | *(handled by Dockerfile ENTRYPOINT)* |
| **Health Check Path** | `/actuator/health` |

### 6b. Set Environment Variables

In the Render dashboard → your service → **Environment**:

Add each variable from Section 3. For `FIREBASE_SERVICE_ACCOUNT_JSON`, paste the base64-encoded value:

```bash
# Encode your Firebase JSON locally
base64 -i serviceAccountKey.json | tr -d '\n'
# Paste the output as the env var value
```

### 6c. Auto-Deploy on Push

Render auto-deploys on every push to `main`. For the team workflow:

- Feature branches → PRs → merge to `main` → auto-deploy
- Use `develop` branch for staging if you want a separate staging environment

---

## Section 7 – Deploying on Railway (Alternative)

### 7a. Create a New Project

1. railway.app → **New Project** → **Deploy from GitHub repo**
2. Select your repository

### 7b. Add Environment Variables

In your service → **Variables** tab → add all variables from Section 3.

Railway auto-detects the `Dockerfile` and builds it.

### 7c. Custom Domain

Settings → **Domains** → Add `api.carenest.app` → Update your DNS CNAME record.

---

## Section 8 – CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Java 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Cache Maven packages
        uses: actions/cache@v4
        with:
          path: ~/.m2
          key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}

      - name: Build with Maven
        run: mvn clean package -DskipTests

      - name: Run Tests
        run: mvn test

      # Render deploys automatically via GitHub — no extra step needed.
      # For Railway, add the railway CLI deploy step here if needed.
```

---

## Section 9 – Paystack Webhook Setup

**This is a Backend Dev 1 responsibility.**

1. Log in to your Paystack Dashboard
2. Settings → **API Keys & Webhooks**
3. Set Webhook URL to: `https://api.carenest.app/v1/payments/webhook/paystack`
4. Copy the **Webhook Secret** → add to env as `PAYSTACK_WEBHOOK_SECRET`

In your Spring Boot controller, validate every webhook:

```java
@PostMapping("/payments/webhook/paystack")
public ResponseEntity<Void> handleWebhook(
    @RequestHeader("X-Paystack-Signature") String signature,
    @RequestBody String rawBody
) {
    // MUST validate signature before doing anything else
    String expectedSig = hmacSha512(rawBody, paystackWebhookSecret);
    if (!MessageDigest.isEqual(
            expectedSig.getBytes(),
            signature.getBytes())) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // Parse and process event...
    return ResponseEntity.ok().build();
}
```

Enable these events in Paystack:
- `charge.success`
- `transfer.success`
- `transfer.failed`

---

## Section 10 – Post-Deployment Checklist

After every deployment, verify:

- [ ] `GET https://api.carenest.app/actuator/health` returns `{"status":"UP"}`
- [ ] `POST /auth/register` creates a user and sends verification email
- [ ] `POST /auth/login` returns valid JWT tokens
- [ ] Paystack webhook arrives and is processed correctly (use Paystack test mode)
- [ ] Push notifications reach a test device
- [ ] Database connections are healthy (check Hikari pool in logs)
- [ ] No secrets appear in application logs

---

## Section 11 – Monitoring & Logging

| Concern | Recommendation |
|---|---|
| **Health check** | Spring Boot Actuator at `/actuator/health` |
| **Logs** | Render/Railway both provide log streaming in dashboard |
| **Errors** | Add Sentry Spring Boot SDK for exception tracking |
| **Metrics** | Actuator `/actuator/metrics` — expose to Prometheus if needed later |
| **DB slow queries** | Enable `log_min_duration_statement = 500` in PostgreSQL config |
| **Alerts** | Set up Render health check alerts → email/Slack on downtime |

---

*CareNest Deployment Guide — CodeQuest 2026 — Group 19*
