# Architecture

BuildBond is a React single-page app talking to an Express API, which stores everything in PostgreSQL.

```
Browser (React, Vite dev server :5173)
   |  fetch /api/...  (httpOnly JWT cookie)
   v
Vite proxy  -->  Express API :4000  -->  PostgreSQL
```

In development, Vite forwards `/api` to the API, so the browser sees one origin. That is why the cookie works without any CORS setup.

## Terms

| Term | Meaning |
|------|---------|
| Milestone | One ordered step of a project, with its own amount |
| Proof | A URL and note the contractor submits for a milestone |
| Ledger | Append-only rows recording the deposit and each release |
| Held balance | Deposited minus released |
| Dispute | A freeze raised on a milestone by the client or contractor |
| Paise | Integer money unit. 100 paise = Rs 1. |

## Statuses

**Project:** `OPEN` (no contractor yet) -> `ACTIVE` (accepted) -> `COMPLETED` (every milestone released). A dispute moves an active project to `DISPUTED`, and withdrawing it moves it back to `ACTIVE`.

**Milestone:**

```
PENDING --submit proof--> SUBMITTED --approve--> RELEASED
                              |
                           reject
                              v
                          REJECTED --resubmit--> SUBMITTED
```

The allowed moves live in one table, `MILESTONE_TRANSITIONS` in `server/src/domain.js`. Routes call `assertMilestoneTransition` before changing anything, so a request that tries to skip a step (for example `PENDING` straight to `RELEASED`) gets a `409`.

**Proof:** `SUBMITTED` -> `APPROVED` or `REJECTED`.
**Dispute:** `OPEN` -> `WITHDRAWN`.

## Money

Money moves in two places only:

- **One deposit** when the client funds the project, for the full project total.
- **One release** per milestone when the client approves its proof.

There is no balance column. `deposited`, `released` and `held` are calculated from the `ledger_entries` rows (`summarizeLedger` in `domain.js`), so they cannot drift out of sync with the history.

Two partial unique indexes enforce the rules in the database itself:

- `one_deposit_per_project` allows a single `DEPOSIT` row per project.
- `one_release_per_milestone` allows a single `RELEASE` row per milestone.

Even if a route had a bug, the database would refuse a double payment.

Amounts are stored as integer paise, never floats. They are `INTEGER` columns, which caps a project at 2,147,483,647 paise (about Rs 2.14 crore). The validators enforce the same limit.

## Approving a milestone

Approval is the one request that changes money, so it runs as a single transaction (`server/src/routes/milestones.js`):

1. Check the caller is the client and the project is active and funded.
2. Lock the project row with `SELECT ... FOR UPDATE` and confirm it is still `ACTIVE`.
3. Lock and re-read the milestone, and confirm it is still `SUBMITTED`.
4. Mark the milestone `RELEASED` and the proof `APPROVED`.
5. Insert the `RELEASE` ledger row and an activity event.
6. If that was the last milestone, mark the project `COMPLETED`.

If any step fails, the transaction rolls back and nothing is saved.

## Disputes

A dispute is raised against a specific milestone and needs a reason of at least 10 characters. It does not change the milestone's status. It sets the project to `DISPUTED`. Every proof, approve, reject and fund route requires the project to be `ACTIVE`, so nothing moves until the raiser withdraws the dispute. A milestone that is already released cannot be disputed, and a milestone can have only one open dispute.

## Access control

Authorization checks both role and ownership:

- Role: `requireRole('CLIENT' | 'CONTRACTOR')` in `auth.js`.
- Ownership: `getProjectForUser` in `access.js` only returns a project to its own client or contractor. Anyone else gets `404`, so the API does not reveal that a private project exists.
- Actions: `requireClient` and `requireContractor` check that the caller is the right person on that particular project.

Passwords are hashed with bcrypt (cost 10). The JWT is sent in an httpOnly cookie named `buildbond_token` with `sameSite=lax`, and `secure` is turned on when `NODE_ENV=production`.

## Database tables

The full schema, with constraints and indexes, is in `server/db/schema.sql`.

| Table | Purpose |
|-------|---------|
| `users` | Accounts. `role` is `CLIENT` or `CONTRACTOR`; email is unique. |
| `projects` | A job. `contractor_id` is null until accepted, and a CHECK stops a user being both client and contractor. |
| `milestones` | Ordered steps with an amount. `(project_id, position)` is unique. |
| `proofs` | Every proof ever submitted, including rejected ones. A partial unique index allows only one `SUBMITTED` proof per milestone. |
| `ledger_entries` | Deposits and releases. A CHECK ties `DEPOSIT` to no milestone and `RELEASE` to one. |
| `events` | The activity timeline, written in the same transaction as the change it describes. |
| `disputes` | Freeze records. One `OPEN` dispute per milestone. |

## Frontend

Routes are defined in `web/src/App.jsx`: `/login`, `/register`, `/` (dashboard), `/jobs` (contractors only), `/projects/new` (clients only) and `/projects/:id`. `Guard.jsx` redirects visitors who are not logged in or who have the wrong role. The UI hides actions that are not valid, but the API checks them again, so hiding a button is never the only protection.