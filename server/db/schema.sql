DROP TABLE IF EXISTS
  disputes,
  events,
  ledger_entries,
  proofs,
  milestones,
  projects,
  users
CASCADE;


CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('CLIENT', 'CONTRACTOR')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE projects (
  id            SERIAL PRIMARY KEY,
  client_id     INTEGER NOT NULL REFERENCES users(id),
  contractor_id INTEGER REFERENCES users(id),

  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  total_paise   INTEGER NOT NULL CHECK (total_paise > 0),
  status        TEXT NOT NULL DEFAULT 'OPEN'
                CHECK (status IN ('OPEN', 'ACTIVE', 'DISPUTED', 'COMPLETED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT contractor_is_not_client
    CHECK (contractor_id IS NULL OR contractor_id <> client_id)
);


CREATE INDEX projects_client_idx     ON projects (client_id);
CREATE INDEX projects_contractor_idx ON projects (contractor_id);
-- The jobs board filters on these two columns together.
CREATE INDEX projects_open_idx       ON projects (status) WHERE status = 'OPEN';


CREATE TABLE milestones (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL CHECK (position >= 1),
  title        TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  status       TEXT NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING', 'SUBMITTED', 'REJECTED', 'RELEASED')),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (project_id, position)
);

CREATE TABLE proofs (
  id           SERIAL PRIMARY KEY,
  milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  url          TEXT NOT NULL,
  note         TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'SUBMITTED'
               CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),

  review_note  TEXT,
  reviewed_by  INTEGER REFERENCES users(id),
  reviewed_at  TIMESTAMPTZ,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_pending_proof_per_milestone
  ON proofs (milestone_id)
  WHERE status = 'SUBMITTED';

CREATE INDEX proofs_milestone_idx ON proofs (milestone_id, created_at DESC);


CREATE TABLE ledger_entries (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id INTEGER REFERENCES milestones(id),
  kind         TEXT NOT NULL CHECK (kind IN ('DEPOSIT', 'RELEASE')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  note         TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ledger_shape CHECK (
    (kind = 'DEPOSIT' AND milestone_id IS NULL) OR
    (kind = 'RELEASE' AND milestone_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX one_deposit_per_project
  ON ledger_entries (project_id)
  WHERE kind = 'DEPOSIT';

CREATE UNIQUE INDEX one_release_per_milestone
  ON ledger_entries (milestone_id)
  WHERE kind = 'RELEASE';

CREATE INDEX ledger_project_idx ON ledger_entries (project_id);

CREATE TABLE events (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_id   INTEGER NOT NULL REFERENCES users(id),
  kind       TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX events_project_idx ON events (project_id, created_at);


CREATE TABLE disputes (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  raised_by    INTEGER NOT NULL REFERENCES users(id),
  reason       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'OPEN'
               CHECK (status IN ('OPEN', 'WITHDRAWN')),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX one_open_dispute_per_milestone
  ON disputes (milestone_id)
  WHERE status = 'OPEN';

CREATE INDEX disputes_project_idx ON disputes (project_id);