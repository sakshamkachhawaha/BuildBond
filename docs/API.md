# API reference

All routes are under `/api` and use JSON. Errors have the form `{ "error": "message" }`. The user is identified by the `buildbond_token` httpOnly cookie that register and login set. There is no `Authorization` header.

## Status codes

| Code | Meaning |
|------|---------|
| 200, 201, 204 | Success |
| 400 | Invalid input |
| 401 | Not logged in, or wrong email or password |
| 403 | Logged in, but the wrong role or not the right person for this action |
| 404 | Not found, including projects the caller is not part of |
| 409 | The action is not allowed in the current state |
| 413 | Request body over 100 kb |
| 500 | Unexpected server error |

## Health

`GET /api/health` returns `{ "ok": true, "service": "buildbond-api" }`.

## Auth

| Method | Path | Body | Result |
|--------|------|------|--------|
| POST | `/api/auth/register` | `name` (2-80 chars), `email`, `password` (8-72 chars), `role` (`CLIENT` or `CONTRACTOR`) | `201` with `{ user }` and the cookie. `409` if the email is taken. |
| POST | `/api/auth/login` | `email`, `password` | `200` with `{ user }` and the cookie |
| POST | `/api/auth/logout` | none | `204`, cookie cleared |
| GET | `/api/auth/me` | none | `{ user }` |

## Projects

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/api/projects` | Any logged-in user | Projects the user is part of, newest first. Each has status, totals (`total_paise`, `deposited_paise`, `released_paise`, `held_paise`), milestone counts, the other party's name and an `action_needed` flag. |
| POST | `/api/projects` | Client | Create a project. Body: `title` (3-120 chars), optional `description` (up to 1000), `milestones`: a list of 2 to 5 items, each `{ title, amount_paise }`. The total is the sum of the amounts. Returns `201 { id }`. |
| GET | `/api/projects/:id` | Client or contractor of that project | Full detail: `project`, `milestones` (each with its proofs), `ledger`, `events`, `disputes`. |
| POST | `/api/projects/:id/accept` | Contractor | Take an open project. It becomes `ACTIVE`. `409` if it was already taken. |
| POST | `/api/projects/:id/fund` | Client of the project | Record the demo deposit for the full total. Needs an accepted contractor. `409` if already funded. |

## Jobs

`GET /api/jobs` (contractors only) lists open projects that have no contractor, with the client's name and milestone count.

## Milestones

All of these need an `ACTIVE`, funded project.

| Method | Path | Who | Body |
|--------|------|-----|------|
| POST | `/api/projects/:projectId/milestones/:milestoneId/proofs` | Assigned contractor | `url` (must start with http:// or https://), optional `note` (up to 1000 chars). Only allowed when the milestone is `PENDING` or `REJECTED`. Returns `201`. |
| POST | `/api/projects/:projectId/milestones/:milestoneId/approve` | Client | none. Needs a `SUBMITTED` milestone. Releases the amount and may complete the project. |
| POST | `/api/projects/:projectId/milestones/:milestoneId/reject` | Client | `note`: the reason (required). Needs a `SUBMITTED` milestone. |

## Disputes

| Method | Path | Who | Body |
|--------|------|-----|------|
| POST | `/api/projects/:projectId/disputes` | Client or contractor of the project | `milestone_id`, `reason` (10-1000 chars). The project must be `ACTIVE` and the milestone not yet released. Returns `201 { id }` and sets the project to `DISPUTED`. |
| POST | `/api/projects/:projectId/disputes/:disputeId/withdraw` | The person who raised it | none. Returns the project to `ACTIVE`. `403` for the other party, `404` for outsiders. |

## Notes

- Money values are integer paise in every request and response.
- There is no endpoint for uploading files and none for exports. Proofs are URLs.