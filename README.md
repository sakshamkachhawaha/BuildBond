# BuildBond

BuildBond tracks milestone-based payments for physical projects such as a home renovation. The contractor submits proof for each milestone, the client approves or rejects it, and approval records a release in a simulated escrow ledger. No real money is involved.

## The problem

When someone hires a contractor for a large job, payment usually depends on trust. Clients pay without a clear record of what was finished, contractors have no record to point to when they are blamed for delays, and when a dispute starts the evidence is spread across chats, receipts and phone galleries. Task tools like Trello and payment tools like UPI each cover one half. Neither ties proof of work to payment progress.

## What the app does

A client creates a project with 2 to 5 ordered milestones, each with an amount. A contractor accepts it from the jobs board and the client funds the demo escrow. After that, each milestone goes through the same loop:

1. The contractor submits a proof URL and a note.
2. The client approves it, which releases that milestone's amount in the ledger, or rejects it with a reason.
3. After a rejection the contractor can submit a new proof. The old one stays in the history.
4. Either side can raise a dispute on a milestone. This freezes the project until the person who raised it withdraws it.

Every action is written to an activity timeline for the project, so both sides see the same record. When the last milestone is released, the project is marked completed.

Proofs are stored as URLs. The app does not upload or host files.

## Tech stack

| Part | Technology |
|------|------------|
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL, queried with `pg` (no ORM) |
| Auth | bcryptjs password hashes, JWT in an httpOnly cookie |
| Money | Integer paise, append-only ledger table |
| Testing | `scripts/smoke.mjs`, an end-to-end HTTP test that `npm run verify` runs against a fresh database |

## Setup

You need Node.js 18 or newer, npm, and a running PostgreSQL (14 or newer).

```bash
git clone https://github.com/sakshamkachhawaha/BuildBond.git
cd BuildBond

# create an empty database
createdb buildbond

# install root, server and web dependencies
npm run setup

# configure the server
cp server/.env.example server/.env
# edit server/.env: set JWT_SECRET (16+ characters) and DATABASE_URL

# create tables and demo data
npm run db:setup

# start the API (port 4000) and the web app (port 5173) together
npm run dev
```

Open http://localhost:5173. Use `localhost` rather than `127.0.0.1`, because the login cookie is tied to the host name you logged in on.

If your Postgres needs a username or password, put them in the URL, for example `postgres://user:password@localhost:5432/buildbond`.

You can also run the two halves separately with `npm run dev:server` and `npm run dev:web`.

### Environment variables

Set these in `server/.env`. See `server/.env.example`.

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | At least 16 characters. Changing it logs everyone out. |
| `PORT` | no | Defaults to 4000. The Vite proxy in `web/vite.config.js` expects 4000. |
| `NODE_ENV` | no | Set to `production` to mark the auth cookie `secure`. |

Tokens last 7 days. The value is fixed in `server/src/config.js`.

### Demo accounts

`npm run db:setup` creates two accounts, both with the password `password123`:

| Role | Email |
|------|-------|
| Client | client@buildbond.dev |
| Contractor | contractor@buildbond.dev |

It also seeds two projects. *Sharma Kitchen Renovation* is active and funded (Rs 1,50,000). Step 1 is already released, step 2 has a proof waiting for review, and step 3 is pending. *Mehta Bathroom Remodel* (Rs 80,000) is open and shows up on the contractor's jobs board.

Run `npm run db:setup` again at any time to reset the data. The reset script refuses to run on any database that is not named `buildbond`.

## Running the tests

```bash
npm run verify
```

This resets and seeds the `buildbond` database, starts the API on port 4100, runs `scripts/smoke.mjs` against it, then restores the demo data. The smoke test makes 56 checks, covering:

- registration, login and role restrictions
- double accept, double fund and double approve returning `409`
- blocking proof submission and approval before the project is funded
- rejection requiring a reason, and resubmission after a rejection
- disputes freezing the project, and only the raiser being able to withdraw one
- the ledger adding up to the project total once the last milestone is released
- the activity timeline recording each step

`npm run verify` wipes the local `buildbond` database. To run only the smoke test against a server that is already running, use `BASE_URL=http://127.0.0.1:4000 npm run smoke`.

## A short walkthrough

1. Log in as the client and open the kitchen project.
2. Reject step 2 with a reason.
3. Log in as the contractor and resubmit step 2.
4. Log in as the client and approve it. A release appears in the ledger and the held balance drops.
5. Raise a dispute on step 3. The project becomes Disputed and the proof and approve buttons disappear. Withdraw the dispute.
6. As the contractor, submit proof for step 3. As the client, approve it. The project becomes Completed and the held balance is zero.

## Project layout

```
server/
  db/            schema.sql, reset.mjs, seed.mjs
  src/
    app.js       Express setup and error handling
    auth.js      password hashing, JWT cookie, requireAuth / requireRole
    access.js    project lookup and ownership checks
    domain.js    status constants, milestone transitions, ledger totals
    validate.js  input validation
    routes/      auth, projects, jobs, milestones, disputes
web/
  src/
    pages/       Login, Register, Dashboard, Jobs, NewProject, ProjectDetail
    components/  Nav, Guard, Badge, Milestone, Ledger, Timeline
    api.js       fetch wrapper
    auth.jsx     auth context
scripts/         smoke.mjs, verify.mjs
docs/            ARCHITECTURE.md, API.md
```

## More documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): state machine, ledger design, database tables and the reasoning behind them
- [docs/API.md](docs/API.md): every endpoint with request bodies and error codes

## Limitations

- The ledger is a simulation. BuildBond never holds or moves real money.
- Proofs are links. The app does not check what is behind them.
- Review is manual. There is no automated verification of the work.
- Disputes only freeze a project. There is no mediator and no resolution step, and only the person who raised one can withdraw it.
- A project has one contractor, 2 to 5 milestones, and cannot be edited after it is created.
- The project page refetches after each action. There are no live updates, notifications or chat.
- Logging out clears the cookie, but a copied token stays valid until it expires.
- Missing: email verification, password reset, rate limiting, file uploads, deployment.
- `INTEGER` columns cap a project at about Rs 2.14 crore. A real system would use `BIGINT`.

## Ideas for later

- File uploads for proof photos
- A real payment or escrow provider, with webhooks checked against the ledger
- A mediator role for disputes
- Contractor ratings based on completed milestones

## Team

| Name | Role | GitHub |
|------|------|--------|
| Saksham Kachhawaha | Team lead, frontend, logistics and workflow | [@sakshamkachhawaha](https://github.com/sakshamkachhawaha) |
| Barnak Das | Database and escrow logic | [@Barnakdas-tech](https://github.com/Barnakdas-tech) |
| Arnav Bansal | Auth, API and security | [@arnavbansal12](https://github.com/arnavbansal12) |
| Saksham Paliwal | Frontend, docs and QA | [@sakshampaliwal21](https://github.com/sakshampaliwal21) |

## License

MIT. See [LICENSE](LICENSE).