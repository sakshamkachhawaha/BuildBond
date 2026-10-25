-- BuildBond database schema.
-- Domain tables and constraints are added here as the backend is implemented.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CLIENT', 'CONTRACTOR')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

