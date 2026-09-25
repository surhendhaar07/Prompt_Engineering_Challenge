# XenTriX'26 | Prompt Engineering Challenge Web Application

![XenTriX'26 Logo](frontend/public/xentrix-logo.png)

> **Innovate • Inspire • Elevate**  
> Official College Technical Symposium Platform for the **Prompt Engineering Challenge**.

A production-ready, cyber-tech styled web application engineered with **React, TypeScript, Node.js, Express, Socket.IO, and PostgreSQL / SQLite WASM**.

---

## 🌟 Key Highlights & Features

### 1. Dual Domain Specialization
* **Domain 1: WEB DEVELOPMENT**
* **Domain 2: GEN AI APPLICATION**
* **Admin Domain Allocation**: Assign each participant team individually to **WEB DEVELOPMENT** or **GEN AI APPLICATION**.
* **Domain-Filtered Question Engine**: Teams automatically receive prompt engineering questions tailored to their assigned domain.

---

### 2. Standardized 6-Part Question Bank
Every challenge question is structured into 6 distinct parts:
1. **Title**: The core scenario title
2. **Situation**: Real-world engineering context and business problem background
3. **Your Task**: Specific instructions for what the prompt engineer must command
4. **Requirements**: Functional user stories and interaction rules
5. **Technical Requirements**: Architectural specifications, libraries, schema constraints, security guardrails, and latency targets
6. **Your Submission**: Standardized directive across all questions:
   > *"Write one comprehensive prompt that you would give to an AI coding agent."*

---

### 3. Multi-Format Validation Export Engine
Admin can export full competition evaluation reports with one click in 4 formats:
* 📄 **Word Format (`.docx`)**: Official formatted evaluation dossier with team details, 6-part question, submitted prompt, and integrity metrics.
* 📊 **Excel Format (`.xlsx`)**: Multi-sheet workbook (`Contest Summary` & `Submissions & Questions`) with formulas, duration calculations, and word counts.
* 📑 **PDF Format (`.pdf`)**: Print-ready scorecard formatted with XenTriX'26 headers and code boxes.
* 📋 **CSV Format (`.csv`)**: Clean RFC-4180 comma-separated data.

---

### 4. Server-Authoritative 30-Minute Timer & State Machine
* **Server Time as Ground Truth**: Timer is strictly computed using server timestamps (`started_at` & `expires_at`).
* **Reload & Reconnection Resilience**: Refreshing or closing browser seamlessly resumes exact remaining time without resetting.
* **4-Tier Urgency Visual States**:
  * `> 10 Minutes`: Electric Blue / Cyan calm glow
  * `5 – 10 Minutes`: Amber warning state
  * `< 5 Minutes`: Orange-red strong alert state
  * `< 1 Minute`: Urgent blinking red pulse
* **Automated Expiry Engine**: Background server worker (4s cycle) auto-submits responses when `current_server_time >= expires_at`.

---

### 5. Live Anti-Cheat Proctoring & Surveillance
* **Tab-Switch & Blur Tracking**: Detects when participant navigates away or switches tabs.
* **Fullscreen Enforcement**: Detects fullscreen exits and presents an alert overlay.
* **Clipboard & Context-Menu Guard**: Intercepts copy, cut, paste attempts, right-clicks, and keyboard shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `F12`).
* **Real-time Alert Broadcasting**: Security events are transmitted instantly to the Admin Control Center via WebSockets.

---

### 6. Full Administrative Control Center
* **Live Overview Telemetry**: Real-time counter cards (Total Teams, Online, In Progress, Completed, Alerts, Active Questions).
* **Live Monitoring Grid**: Active timers, online status, assigned questions, and violation counters.
* **Team Management**: Create teams with domain allocation, edit team, change/reset passwords (hashed with bcrypt, never plain text), and inspect detailed team dossiers.
* **Question Bank Manager**: Full CRUD for 6-part questions with domain tagging and active pool toggles.
* **Challenge Reset / Reassign**: Dynamically reassign questions or reset challenges with full administrative audit logging.
* **Audit Ledger**: Immutable log of all administrative actions.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Socket.IO Client, Canvas Confetti, Vite |
| **Backend** | Node.js, Express.js, TypeScript, Socket.IO, Bcrypt.js, JSON Web Tokens (JWT), Rate Limiting |
| **Database** | Built-in SQLite WASM (`sql.js`) with zero external database configuration needed |
| **Document Export** | `docx` (Word), `xlsx` (Excel), `pdfkit` (PDF), custom CSV serializer |

---

## 📁 Folder Structure

```text
Prompt_Engineering_Challenge/
├── frontend/
│   ├── public/
│   │   ├── xentrix-logo.png
│   │   └── xentrix-logo.jpg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ConfirmationModal.tsx
│   │   │   ├── FullscreenEnforcer.tsx
│   │   │   ├── AlertBanner.tsx
│   │   │   ├── ExportModal.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── hooks/
│   │   │   └── useAntiCheat.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ParticipantInstructionsPage.tsx
│   │   │   ├── ParticipantChallengePage.tsx
│   │   │   ├── ParticipantCompletionPage.tsx
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── AdminTeamsPage.tsx
│   │   │   ├── AdminQuestionsPage.tsx
│   │   │   ├── AdminChallengesPage.tsx
│   │   │   ├── AdminSubmissionsPage.tsx
│   │   │   ├── AdminActivityPage.tsx
│   │   │   ├── AdminSettingsPage.tsx
│   │   │   └── AdminAuditPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── challengeService.ts
│   │   │   └── adminService.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── challengeController.ts
│   │   │   └── adminController.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── seed.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── challengeRoutes.ts
│   │   │   ├── adminRoutes.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── challengeService.ts
│   │   │   ├── teamService.ts
│   │   │   ├── questionService.ts
│   │   │   ├── activityService.ts
│   │   │   ├── auditService.ts
│   │   │   ├── settingsService.ts
│   │   │   └── exportService.ts
│   │   ├── socket/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── security.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   └── migrations/
│       └── schema.sql
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js v18+ (tested on Node v20/v22/v26)
* npm v9+

### 1. Installation

Install dependencies in both backend and frontend:

```bash
# In backend directory:
cd backend
npm install

# In frontend directory:
cd ../frontend
npm install
```

### 2. Start Development Servers

You can run both backend and frontend concurrently:

```bash
# Terminal 1 - Backend Server (Port 5000):
cd backend
npm run dev

# Terminal 2 - Frontend Client (Port 5173):
cd frontend
npm run dev
```

Visit the application at: **http://localhost:5173**

---

## 🔑 Default Credentials (Pre-Seeded)

### Administrator Account
* **Username:** `admin`
* **Password:** `Admin@XenTriX2026`
* **Destination:** `/admin/dashboard`

### Sample Participant Teams (Dual Domains)

| Team Name | Password | Domain | Team ID |
|---|---|---|---|
| `TEAM_ALPHA` | `xen_alpha_26` | **WEB DEVELOPMENT** | `XT-01` |
| `TEAM_BETA` | `xen_beta_26` | **GEN AI APPLICATION** | `XT-02` |
| `TEAM_GAMMA` | `xen_gamma_26` | **WEB DEVELOPMENT** | `XT-03` |
| `TEAM_DELTA` | `xen_delta_26` | **GEN AI APPLICATION** | `XT-04` |
| `TEAM_OMEGA` | `xen_omega_26` | **WEB DEVELOPMENT** | `XT-05` |
| `TEAM_CYBER` | `xen_cyber_26` | **GEN AI APPLICATION** | `XT-06` |

---

## 🌐 Production Deployment Guide

### Backend & Frontend (Unified Render / Railway / VPS)
* Build Command: `npm run build`
* Start Command: `npm start`
* Port: Default `5000` or `$PORT`
* Zero external database setup needed (persists automatically to disk via SQLite WASM).

### Frontend (Vercel / Netlify)
* Build Command: `npm run build`
* Output Directory: `dist`
* Set API proxy / rewrite to the backend URL.

---

## 🛡️ Contributor Notes
* Built for **XenTriX'26 Technical Symposium**.
* Developed with strict anti-tamper server-controlled timers and immutable audit trails.
