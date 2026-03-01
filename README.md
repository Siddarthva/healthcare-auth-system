# 🛡️ MedAuth: Zero-Trust Healthcare Access Platform

Protecting sensitive medical data through strict authentication, ephemeral keys, and immutable audit trails.

---

## 🛑 The Problem: Healthcare Data Security

Modern healthcare systems suffer from **Premature Trust**. Standard applications grant wide-ranging access based on static, easily compromised passwords. When emergencies occur, rigid security protocols either lock providers out of critical patient data or, conversely, over-provision access, leading to catastrophic data breaches and HIPAA violations.

## 💡 The Solution: MedAuth

**MedAuth** is a production-grade, full-stack healthcare security platform engineered around **Zero-Trust Principles**. 

We replace static trust with dynamic, verifiable communication channels and time-bound ephemeral access. MedAuth proves identity through multi-step trust onboarding, executes authorizations via granular **ABAC (Attribute-Based Access Control)**, and provides a secure **"Break-Glass"** override for medical emergencies—ensuring privacy and availability coexist.

---

## 🏗️ System Architecture

MedAuth utilizes a decoupled client-server architecture, prioritizing separation of concerns and defense-in-depth.

### � High-Level Component Flow
```mermaid
graph TD
    subgraph Client_Space ["User Interface Layer"]
        UI[React/Vite Dashboard]
        Verify[OTP Verification In-line]
    end

    subgraph Defense_Perimeter ["Gateway & Security"]
        LR[Rate Limiter]
        Val[Zod Schema Validator]
        Auth[JWT / CASL Auth Middleware]
    end

    subgraph Service_Logic ["Business Domain"]
        AS[Auth Service]
        PS[Patient Service]
        ES[Emergency Access Handler]
    end

    subgraph Infrastructure_Layer ["Persistence & Trust"]
        DB[(PostgreSQL)]
        RD[(Redis Ephemeral Store)]
        SMTP[Email Trust Channel]
    end

    UI --> LR
    LR --> Val
    Val --> Auth
    Auth --> AS & PS & ES
    AS --> RD & SMTP
    PS & ES --> DB
    ES --> RD
```

---

## 🔒 Security Operations & Workflows

### 1. The Multi-Step Trust Onboarding (Inline Verification)
Verification is not an afterthought; it is the gateway. MedAuth enforces a synchronous OTP verification flow during registration to ensure every active account is backed by a verified communication channel.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant R as Redis
    participant E as Email System

    U->>F: Enter Credentials
    F->>B: POST /register
    B->>B: Hash Password (Argon2)
    B->>R: Store OTP (TTL 5m)
    B->>E: Dispatch OTP to User
    B-->>F: HTTP 201 (Step 1 Complete)
    F->>F: Switch to Inline OTP UI
    U->>F: Enter 6-Digit Code
    F->>B: POST /verify-otp
    B->>R: Fetch & Compare
    B->>R: Delete OTP (Prevent Replay)
    B->>B: Mark User verified = true
    B-->>F: HTTP 200 (Identity Confirmed)
    F->>U: Auto-Login & Redirect
```

### 2. Authorization Logic: CASL ABAC & RBAC
MedAuth doesn't just check roles; it checks **Attributes**.
*   **RBAC**: "Is this a Doctor?"
*   **ABAC**: "Is this Doctor assigned to this specific Patient?"

```mermaid
graph LR
    User((User)) --> Request{Resource Request}
    Request --> JWT[JWT Decryption]
    JWT --> Policy[CASL Policy Engine]
    
    subgraph Policy_Rules
        R1[Role Check]
        R2[Assignment Match]
        R3[Consent Check]
    end
    
    Policy --> R1 & R2 & R3
    R1 & R2 & R3 --> Dec[Decision]
    Dec -->|Allow| Data[(Medical Records)]
    Dec -->|Deny| Error[403 Forbidden]
```

### 3. Emergency Break-Glass Workflow
In critical care, seconds count. MedAuth allows authorized staff to bypass standard assignment boundaries through a strictly audited "Break-Glass" mechanism.

```mermaid
stateDiagram-v2
    [*] --> Access_Denied: Unassigned Patient
    Access_Denied --> Emergency_Form: Doctor Triggers Override
    Emergency_Form --> Verification: Submit Justification
    Verification --> Access_Granted: Temporary (2HR) Window
    
    state Access_Granted {
        [*] --> Timer_Start
        Timer_Start --> Permission_Active
        Permission_Active --> Permission_Expired: 2 Hours Elapsed
    }
    
    Access_Granted --> Audit_Log: Immutable Record Created
    Permission_Expired --> [*]: Access Revoked
```

---

## 🛠️ Technology Stack & Justifications

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend** | **Node.js / Express** | High concurrency for real-time telemetry. |
| **Type Safety** | **TypeScript** | Eliminates runtime authorization type errors. |
| **ORM** | **Prisma** | Deterministic, type-safe database access layer. |
| **Hashing** | **Argon2** | Industry-standard protection against GPU cracking. |
| **Validation** | **Zod** | Enforces data contract before logic execution. |
| **Cache** | **Redis** | Millisecond-level TTL enforcement for ephemeral secrets. |
| **Frontend** | **React 19 (Vite)** | Atomic component structure with instant HMR. |
| **Styling** | **Tailwind CSS** | Design system token adherence with no runtime CSS cost. |

---

## 📂 Project Structure
```text
/healthcare-auth-system
├── /backend
│   ├── /prisma           # DB schema & Seed (deterministic data)
│   ├── /src
│   │   ├── /modules      # Domain Logic (Auth, Emergency, Audit)
│   │   ├── /policies     # CASL ABAC Definitions
│   │   ├── /services     # Redis & SMTP Handlers
│   │   └── /middleware   # The Security Perimeter (JWT, Audit, Zod)
├── /frontend
│   ├── /src
│   │   ├── /pages        # Onboarding Portal & Dashboard
│   │   ├── /store        # Zustand Security Store
│   │   └── /services     # Axios Security Interceptors
```

---

## 🚀 Installation & Local Development

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env # Configure DB, Redis, and SMTP
npx prisma db seed # Primes DB with Admin/Staff accounts
npm run dev
```

### 2. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev # Runs on locked port 5173
```

---

## 🎯 The Pitch Scenario
1.  **Strict Onboarding**: Register an account. Observe the **Inline OTP** verification—no verification, no access.
2.  **Boundaries**: Log in as a Doctor. Attempt to view an unassigned patient (Blocked by ABAC).
3.  **Emergency**: Trigger **Break-Glass** with a justification. Gain instant, time-bound access.
4.  **Accountability**: Switch to Admin. View the **Audit logs** to see the immutable trail of the emergency bypass.

---

## 📄 License
Licensed under the MIT License. Built for the Hackathon Stage-2 Submission.
