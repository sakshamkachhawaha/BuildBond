# 🏗️ BuildBond

**Milestone-based proof-of-work and payment tracking for high-value physical projects.**

> Capstone Project · Advanced Programming and Data Engineering

![Status](https://img.shields.io/badge/status-MVP%20built-brightgreen)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20PostgreSQL-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📌 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Key Features (MVP)](#-key-features-mvp)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Design](#-database-design)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Verification](#-verification)
- [API Overview](#-api-overview)
- [Current Limitations](#-current-limitations)
- [Roadmap](#-roadmap)
- [Contributors](#-contributors)
- [License](#-license)

---

## 🚨 The Problem

When people hire contractors for big jobs such as home renovation, custom
manufacturing or event setup, the whole arrangement runs on informal trust:

- Clients pay without clear proof that work has been completed.
- Contractors get blamed for delays with no objective record of what was done
  and when.
- When a dispute happens, evidence is scattered across chats, receipts and phone
  galleries, which makes resolution slow and unfair.

Existing tools either manage tasks (Trello, Asana) or process payments (UPI,
Stripe). Almost none connect **proof of work** with **payment progress**.

## 💡 Our Solution

BuildBond breaks a project into clear **milestones** (for example
*Demolition → Plumbing → Painting*). At each stage:

1. The contractor submits **evidence**: a proof URL and a note describing what
   was completed.
2. The client **reviews** it and either approves or rejects it with a reason.
3. Approval marks the milestone **released** and records a matching release in
   the simulated ledger. Rejection sends it back to the contractor to redo and
   resubmit.
4. Either participant can raise a **dispute**, which freezes the project before
   any more money moves. Only the person who raised it can withdraw it.
5. Every project action is timestamped and stored in an append-only activity
   trail, so both sides share the same record.

The MVP stores a **proof URL** rather than uploading files. That keeps the first
version focused on the two things that matter most here: a strict **money state
machine** and an auditable **ledger**. File storage is on the roadmap, not
pretended to exist.

## ✨ Key Features (MVP)

- 👥 **Role-based accounts**: separate Client and Contractor experiences, bcrypt
  password hashes and a JWT in an httpOnly cookie.
- 📋 **Project and milestone creation**: 2–5 ordered milestones, an amount per
  milestone, and a total derived from those amounts.
- 🔗 **Evidence links**: the contractor submits a proof URL plus a note; the full
  proof history stays attached to the milestone.
- ✅ **Approval workflow**: the client approves to release or rejects with a
  required reason, guarded by a strict state machine.
- 🔁 **Resubmission**: a rejected milestone returns to the contractor, who can
  submit a new proof without losing the old one.
- 🧊 **Dispute freeze**: either participant can freeze the project; the raiser
  can withdraw the dispute and unfreeze it.
- 💰 **Append-only simulated ledger**: one deposit per project, one release per
  milestone; the held balance is always derived from the rows.
- 🧾 **Activity timeline**: every project mutation writes a human-readable event
  in the same database transaction.
- 🔐 **Guarded API**: role checks and per-project ownership checks, with clear
  `400`, `401`, `403`, `404` and `409` responses.
- 📱 **Responsive UI**: the same app works on a laptop and at 390 px without
  horizontal page overflow.
- 🧪 **Automated verification**: 56 end-to-end HTTP checks with
  `npm run verify`.


## 🔄 How It Works

```text
Client creates project + 2–5 milestones
            │
            ▼
Contractor accepts the project              OPEN → ACTIVE
            │
            ▼
Client funds the demo escrow                one DEPOSIT row
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│  Milestone lifecycle                                         │
│                                                              │
│  PENDING ──submit proof──▶ SUBMITTED ──approve──▶ RELEASED   │
│                               │  ▲                           │
│                     reject    │  │ resubmit                  │
│                  (with reason)▼  │                           │
│                            REJECTED                          │
│                                                              │
│  Proof:   SUBMITTED → APPROVED or REJECTED                   │
│  Dispute: OPEN → WITHDRAWN; the project is DISPUTED meanwhile│
└──────────────────────────────────────────────────────────────┘
            │
            ▼
All milestones released → project COMPLETED
```

**Money changes hands in exactly two places:**

- **One deposit** when the client funds the project. The amount is the full
  project total, and a unique index makes a second deposit impossible.
- **One release per milestone** when the client approves its proof. A second
  release for the same milestone is impossible at the database level.

`held = deposited - released`. There is no mutable balance column; the three
numbers on screen are always computed from the ledger rows.

A dispute does **not** change a milestone's status. It changes the project to
`DISPUTED`, and every money/proof route checks `ACTIVE` before doing anything.
The raiser must withdraw it before work resumes.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, plain CSS |
| Backend | Node.js 22, Express 5 |
| Database | PostgreSQL 18 via Postgres.app |
| Auth | JWT in an httpOnly cookie, bcryptjs (cost 10) |
| Data access | Raw SQL through `pg`; no ORM |
| Money | Integer paise; append-only ledger |
| Verification | Node `fetch` smoke test + `scripts/verify.mjs` |
| File storage | None — proof URLs are stored as text |
| Real-time | None — the page refetches after each action |
| Reports | None — the ledger and activity trail are in-app |


## 🧱 System Architecture

```text
┌──────────────────────────────────┐
│ Browser                          │
│ React 19 + Vite 8                │
│ React Router 7                   │
└────────────────┬─────────────────┘
                 │ fetch("/api/...", credentials: "include")
                 │ httpOnly JWT cookie
                 ▼
┌──────────────────────────────────┐        ┌──────────────────────────────┐
│ Vite dev server :5173            │───────▶│ Express 5 API :4000          │
│ proxies /api → 127.0.0.1:4000    │        │ auth + role/ownership checks │
└──────────────────────────────────┘        │ validation + state machine   │
                                            │ ledger + transactions        │
                                            └──────────────┬───────────────┘
                                                           │ SQL (pg)
                                                           ▼
                                            ┌──────────────────────────────┐
                                            │ PostgreSQL 18                │
                                            │ 7 tables, constraints,       │
                                            │ append-only ledger           │
                                            └──────────────────────────────┘
```

**Design decisions**

- **State machine in the backend.** The browser hides invalid actions, but the
  API re-checks every transition. A direct request cannot jump from `PENDING`
  to `RELEASED`; it gets a `409`.
- **Append-only ledger.** Deposits and releases are inserted, never updated or
  deleted. History is auditable, and the balance is derived.
- **Atomic release.** Approving a milestone runs one transaction: lock the
  project row, lock and re-read the milestone, compute the balance, update the
  milestone only from `SUBMITTED`, mark the proof approved, insert the release
  row and the event, and complete the project if it was the last milestone. Any
  failure rolls everything back.
- **Database as the last line of defence.** Partial unique indexes allow one
  deposit per project and one release per milestone. A JavaScript bug cannot
  double-pay.
- **Authorization is role plus ownership.** Being a contractor is not enough to
  submit proof for someone else's project. Non-participants get `404`, not a
  hint that a private project exists.
- **Same-origin by proxy.** Vite forwards `/api` to the API, so the httpOnly
  cookie is first-party in development and no CORS package is needed.

## 🗄️ Database Design

| Table | Purpose | Key columns and constraints |
|---|---|---|
| `users` | Accounts for clients and contractors | `id`, `name`, `email` (unique), `password_hash`, `role` (`CLIENT`/`CONTRACTOR`) |
| `projects` | A job between one client and one contractor | `id`, `client_id`, `contractor_id`, `title`, `total_paise`, `status` (`OPEN`/`ACTIVE`/`DISPUTED`/`COMPLETED`), `contractor_id <> client_id` |
| `milestones` | Ordered payment steps | `id`, `project_id`, `position`, `title`, `amount_paise`, `status` (`PENDING`/`SUBMITTED`/`REJECTED`/`RELEASED`), unique `(project_id, position)` |
| `proofs` | Every proof submission, including history | `id`, `milestone_id`, `submitted_by`, `url`, `note`, `status`, `review_note`, `reviewed_by`; at most one `SUBMITTED` proof per milestone |
| `ledger_entries` | Append-only simulated money movements | `id`, `project_id`, `milestone_id`, `kind` (`DEPOSIT`/`RELEASE`), `amount_paise`; one deposit per project, one release per milestone |
| `events` | Human-readable activity trail | `id`, `project_id`, `actor_id`, `kind`, `message`, `created_at` |
| `disputes` | Freeze records raised by a participant | `id`, `project_id`, `milestone_id`, `raised_by`, `reason`, `status` (`OPEN`/`WITHDRAWN`); at most one open dispute per milestone |

> 📝 Schema file: [`server/db/schema.sql`](server/db/schema.sql). Every table,
> column, constraint and index is commented there.

Money is stored as an **integer number of paise** (1 rupee = 100 paise), never
as a float. `INTEGER` supports a project total up to about **₹2.14 crore**,
which is enough for this demo; a production system would use `BIGINT`.

The ledger has no `balance` column on purpose. `deposited`, `released` and
`held` are derived from the rows, so they cannot drift out of sync.

## 📁 Project Structure

```text
buildbond/
├── package.json                  # root scripts: setup, db:*, dev:*, verify, smoke
├── README.md
├── LICENSE
├── .gitignore
├── docs/
│   ├── READING-GUIDE.md          # the course: what to read, in what order
│   └── GLOSSARY.md               # every term a beginner needs
├── scripts/
│   ├── smoke.mjs                 # full HTTP scenario, no test framework
│   └── verify.mjs                # reset → seed → start → smoke → restore
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── db/
│   │   ├── schema.sql            # tables, constraints, indexes
│   │   ├── reset.mjs             # guarded destructive reset
│   │   └── seed.mjs              # demo users + active project + open job
│   └── src/
│       ├── config.js             # env loading + fail-fast validation
│       ├── db.js                 # connection pool + withTransaction
│       ├── http.js               # HttpError, assert, parseId
│       ├── validate.js           # server-side input validation
│       ├── auth.js               # bcrypt, JWT, cookie, requireAuth, requireRole
│       ├── access.js             # project membership + role guards
│       ├── domain.js             # statuses, transitions, ledger summary
│       ├── app.js                # middleware pipeline + routers
│       ├── index.js              # listen + graceful shutdown
│       └── routes/
│           ├── auth.js
│           ├── projects.js
│           ├── jobs.js
│           ├── milestones.js     # proof submission, reject, atomic release
│           └── disputes.js       # freeze + withdraw
└── web/
    ├── package.json
    ├── vite.config.js            # /api proxy → 127.0.0.1:4000
    ├── index.html
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx
        ├── App.jsx               # routes
        ├── api.js                # fetch wrapper
        ├── auth.jsx              # AuthContext + useAuth
        ├── format.js             # ₹, paise, dates
        ├── styles.css
        ├── components/           # Nav, guard, badge, milestone, ledger, timeline
        └── pages/                # Login, Register, Dashboard, Jobs,
                                  # NewProject, ProjectDetail
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 22.12+** (`node --version`)
- **PostgreSQL 18** via [Postgres.app](https://postgresapp.com/) on macOS.
  PostgreSQL 14+ should also work; the commands below use version 18.
- npm 10+

### 1. Clone or open the project

```bash
git clone https://github.com/<your-username>/buildbond.git
cd buildbond

# Or, if you already have the local folder:
# cd ~/Desktop/buildbond
```

### 2. Start PostgreSQL and create the database

```bash
open -a Postgres
sleep 2
/Applications/Postgres.app/Contents/Versions/18/bin/pg_isready -h 127.0.0.1
/Applications/Postgres.app/Contents/Versions/18/bin/createdb -h 127.0.0.1 buildbond
```

If Postgres.app quits immediately, start the server directly:

```bash
/Applications/Postgres.app/Contents/Versions/18/bin/pg_ctl \
  -D "$HOME/Library/Application Support/Postgres/var-18" \
  -l /tmp/buildbond-postgres.log start
```

`createdb` prints "already exists" if the database is already there. That is
fine.

### 3. Install dependencies

```bash
npm run setup
```

This runs `npm install` inside `server/` and `web/`.

### 4. Configure the environment

```bash
# Skip this if server/.env already exists.
cp server/.env.example server/.env
```

Edit `server/.env` and set a long `JWT_SECRET`. The full list is in
[Environment Variables](#-environment-variables).

### 5. Create the schema and demo data

```bash
npm run db:setup
```

This drops and recreates the BuildBond tables, then inserts the demo accounts.
The reset script refuses to run against any database not named `buildbond`.

### 6. Run the app

Use two terminals:

```bash
# terminal 1 — backend
npm run dev:server
```

```bash
# terminal 2 — frontend
npm run dev:web
```

- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:4000`

> Use `localhost`, not `127.0.0.1`, in the browser. The login cookie is
> host-only; switching host names after logging in will make the browser look
> logged out.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Client | `client@buildbond.dev` | `password123` |
| Contractor | `contractor@buildbond.dev` | `password123` |

The seed creates:

- **Sharma Kitchen Renovation** — active, funded, ₹1,50,000 total. Step 1 is
  released, step 2 has a proof waiting for review, step 3 is pending.
- **Mehta Bathroom Remodel** — open, ₹80,000, no contractor yet. It appears on
  the contractor's jobs board.

Reset the demo at any time with `npm run db:setup`.

## 🔐 Environment Variables

Copy `.env.example` to `.env` inside `server/` and fill in:

```env
PORT=4000
DATABASE_URL=postgres://localhost:5432/buildbond
JWT_SECRET=replace-this-with-a-long-random-string
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes (16+ chars) | Signs the login token; change it and existing logins become invalid |
| `PORT` | No (default 4000) | API port; the Vite proxy targets 4000 |

`.env` is ignored by git. `.env.example` is committed. The server exits with a
clear message if a required variable is missing.

The following variables from the original design are **not used** in this MVP:

- `JWT_EXPIRES_IN` — token lifetime is fixed at seven days in
  [`server/src/config.js`](server/src/config.js).
- `UPLOAD_DIR` — proofs are URLs, not uploaded files.
- `CLIENT_URL` — Vite proxies `/api` on the same origin, so there is no CORS
  configuration.

The login cookie is `httpOnly`, `sameSite=lax`, `secure=false` in development
and `secure=true` when `NODE_ENV=production`.

## ✅ Verification

```bash
npm run verify
```

This is the important command. It:

1. resets the local `buildbond` database,
2. seeds the demo,
3. starts the API on port **4100** (so it does not fight your dev server),
4. runs [`scripts/smoke.mjs`](scripts/smoke.mjs) against it,
5. stops the API and restores clean demo data.

The smoke test exercises the real HTTP API and asserts **56** behaviours,
including:

- registration, login, cookie sessions and role checks;
- a client cannot accept a job; a contractor cannot create a project;
- accepting, funding and approving twice all return `409`;
- proof submission and approval are blocked until the client funds;
- a milestone cannot be approved before a proof exists;
- rejection requires a reason and a rejected milestone can be resubmitted;
- a dispute freezes the project and blocks proof submission;
- only the dispute raiser can withdraw it;
- releasing the final milestone completes the project;
- the ledger invariant holds exactly: deposited = released = total, held = ₹0;
- the activity trail records the rejection, dispute, withdrawal and completion.

`npm run verify` is **destructive to the local `buildbond` database** by design.
It restores the demo seed at the end.

To run only the smoke test against a server you already started:

```bash
BASE_URL=http://127.0.0.1:4000 npm run smoke
```

### Quick demo (three minutes)

1. Log in as the **client** and open the kitchen project.
2. Reject step 2 with a reason. The proof moves to **Rejected**.
3. Sign out, log in as the **contractor**, open the project and resubmit step 2.
4. Sign out, log in as the client and approve step 2. A release row appears in
   the ledger and the held balance drops.
5. Raise a dispute on step 3. The project becomes **Disputed**; the proof and
   approve actions disappear. Withdraw the dispute as the client.
6. Sign in as the contractor, submit a proof for step 3. Sign in as the client,
   approve step 3. The project becomes **Completed**, with deposited equal to
   released and held at ₹0.

The UI was browser-tested for both roles, rejection/resubmission, dispute
freeze/withdrawal, completion, project creation, accepting, funding, and the
dashboard and project detail at 390 px.

## 🔌 API Overview

All routes return JSON. Errors use `{ "error": "message" }`. Authentication is
the httpOnly cookie set by register/login, not an `Authorization` header.

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/auth/register` | Create an account and set the login cookie | Public |
| POST | `/api/auth/login` | Verify the password and set the login cookie | Public |
| POST | `/api/auth/logout` | Clear the login cookie | Any |
| GET | `/api/auth/me` | Return the current user | Logged in |
| GET | `/api/projects` | Role-aware dashboard summaries | Logged in |
| GET | `/api/jobs` | Open projects with no contractor | Contractor |
| POST | `/api/projects` | Create a project + 2–5 milestones | Client |
| GET | `/api/projects/:id` | Full project, milestones, proofs, ledger, events, disputes | Participant |
| POST | `/api/projects/:id/accept` | Accept an open project | Contractor |
| POST | `/api/projects/:id/fund` | Record the demo deposit for the full total | Client |
| POST | `/api/projects/:projectId/milestones/:milestoneId/proofs` | Submit a proof URL + note | Assigned contractor |
| POST | `/api/projects/:projectId/milestones/:milestoneId/approve` | Approve the proof and release the milestone | Client |
| POST | `/api/projects/:projectId/milestones/:milestoneId/reject` | Reject with a required note | Client |
| POST | `/api/projects/:projectId/disputes` | Raise a dispute and freeze the project | Participant |
| POST | `/api/projects/:projectId/disputes/:disputeId/withdraw` | Withdraw the dispute and unfreeze | Raiser |

Status codes: `200`, `201`, `204`, `400` validation, `401` not logged in,
`403` wrong role/owner, `404` not found (including private projects),
`409` invalid state, `500` unexpected.

There is no evidence-upload endpoint and no report endpoint in this MVP; proofs
are URLs submitted through the route above, and the ledger/activity trail are
read from `GET /api/projects/:id`.

## ⚠️ Current Limitations

We want to be upfront about what this MVP is and is not:

- **No real money moves.** The payment ledger is a simulation. BuildBond does
  not hold or transfer real funds and is not a regulated financial service.
- **Proofs are URLs, not uploads.** The app stores a link and a note. It does
  not download, host or verify the evidence behind the link.
- **Review is manual.** There is no computer vision, OCR or AI verification.
- **Disputes freeze, but are not adjudicated.** There is no arbitrator and no
  "win" state. Only the person who raised a dispute can withdraw it.
- **No real-time updates.** The project page refetches after each action; there
  are no WebSockets, notifications or chat.
- **No PDF/export, email, SMS, admin panel or mobile app.**
- **No deployment.** The app is designed to run locally for the course demo.
- **One contractor per project.** There is no project editing after creation,
  no partial milestone payments and no revision limit.
- **Logout is cookie clearing.** A token that was already copied remains valid
  until it expires (seven days). A production app would add server-side
  revocation or short-lived sessions.
- **Basic security only.** No email verification, password reset, 2FA, rate
  limiting, file scanning or deployment hardening.
- **Integer paise limit.** `INTEGER` supports about ₹2.14 crore per project; a
  production system would use `BIGINT`.
- **The activity trail is not legal evidence.** It is an in-app record. The
  ledger is the source of truth for money; events only explain what happened.

## 🗺️ Roadmap

**Phase 1: MVP **
- [ ] Auth and role-based access
- [ ] Project and milestone creation
- [ ] Proof URL submission with history
- [ ] Approval/rejection/resubmission workflow with a state machine
- [ ] Dispute freeze and raiser-only withdrawal
- [ ] Simulated append-only ledger with money invariants
- [ ] Activity timeline
- [ ] Responsive client and contractor UI
- [ ] Seed data + 56-check automated verification + teaching docs
- [ ] File uploads with private storage (future)
- [ ] Real-time updates via WebSockets (future)
- [ ] PDF project/report export (future)

**Phase 2: Real payments**
- [ ] Integrate a regulated payment/escrow partner (for example Stripe Connect
      or Razorpay) for actual fund holding
- [ ] Reconcile provider webhooks against the ledger
- [ ] Address compliance and regulatory requirements before handling real funds

**Phase 3: AI assistance**
- [ ] Computer vision to help flag when required work is not visible in photos,
      always with a human decision
- [ ] RAG over contracts and local building codes to draft defect notices
- [ ] AI-generated dispute summaries from the timeline and evidence
- [ ] Agentic reminders for stalled or delayed milestones

**Phase 4: Scale**
- [ ] Mobile app with in-app camera and geotagged uploads
- [ ] Third-party mediator role for dispute resolution
- [ ] Contractor reputation scores based on completed milestones
- [ ] Deployment hardening: HTTPS, rate limits, backups, monitoring


## 👥 Contributors

| Name | Role | GitHub |
|---|---|---|
| Saksham Kachhawaha | Team-Lead, Frontend,  | [@sakshamkachhawaha](https://github.com/sakshamkachhawaha) |
| Barnak Das | Database & escrow logic | [@Barnakdas-tech](https://github.com/Barnakdas-tech) |
| Arnav Bansal | Auth, API & security | [@arnavbansal12](https://github.com/arnavbansal12) |
| Saksham Paliwal | Frontend, docs & QA | [@sakshampaliwal21](https://github.com/sakshampaliwal21) |

**Course:** Advanced Programming and Data Engineering
**Institution:** Newton School of Technology


## 📄 License
 
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
 
---