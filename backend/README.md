# Healthcare Authentication and Access Control System

A complete production-ready backend project for a secure healthcare authentication and access control system.

## Features Built
1. **Authentication:** JWT Access & Refresh Tokens, Registration, Login, Argon2 Hashing
2. **Authorization:** Role-Based Access Control (RBAC) & Attribute-Based Access Control (ABAC) using CASL
3. **Emergency Access (Break-Glass):** Temporary doctor access to patient records, auto-expiration, Redis cache
4. **Consent Management:** Patients can grant and revoke access for specific hospital staff
5. **Audit Logging:** Exhaustive logging of all sensitive data accesses and mutations
6. **Security:** Helmet, CORS, custom Redis-based Rate Limiter, Zod Validation
7. **Emails:** Nodemailer setup for future OTP integrations / notifications
8. **Logging:** Winston + Morgan setup

## Tech Stack
- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js
- **Database:** PostgreSQL via Prisma ORM
- **Cache / Rate Limit:** Redis (ioredis)
- **Security:** Helmet, JWT, Argon2
- **Validation:** Zod
- **Roles:** `ADMIN`, `DOCTOR`, `NURSE`, `PATIENT`

## Project Structure
```text
src/
 ├─ config/        # Environment, Database, Redis, Logger configs
 ├─ middleware/    # Auth, Validation, Rate Limiting, Error Handle, Audit Logs
 ├─ modules/       # Feature-driven modules (Auth, Users, Patients, Consent, Emergency, Admin)
 ├─ policies/      # CASL Abilities definitions
 ├─ types/         # Global TS definitions
 ├─ utils/         # Error classes, Email utilities
 ├─ app.ts         # Express App setup
 └─ server.ts      # Server bootstrap
```

## How to Run Locally

### 1. Requirements
- Node.js (v18 or LTS)
- PostgreSQL running locally or remotely
- Redis running locally or remotely

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
# Rename the example file or create a .env file
cp .env.example .env

# Verify these inside your .env file
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healthcare?schema=public"
REDIS_URL="redis://localhost:6379"
```

### 4. Database Setup
```bash
# Create the initial schema
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 5. Start Server
```bash
# Development Mode (auto-reloads)
npm run dev

# Production Build
npm run build
npm start
```

## Available Routes (API Summary)

**Auth:** 
- `POST /api/auth/register` (Needs `name`, `email`, `password`, `role`)
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

**Users (Admin Only):**
- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id/status`

**Patients:**
- `GET /api/patients` (Filtered automatically based on RBAC/ABAC)
- `GET /api/patients/:id`

**Consent:**
- `GET /api/consent` 
- `POST /api/consent` (Grant to `staffId`)
- `PATCH /api/consent/:id/revoke`

**Emergency (Doctors Only):**
- `POST /api/emergency` (Requires `patientId`, `reason`)
- `PATCH /api/emergency/:patientId/revoke`

**Audit Logs (Admin Only):**
- `GET /api/admin/audit-logs`