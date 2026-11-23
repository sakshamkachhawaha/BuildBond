# Deployment

Live app: **https://buildbond.onrender.com**

| Piece | Where | Notes |
|---|---|---|
Frontend + API | Render, one web service | The Express process serves `web/dist` and `/api` from the same origin, so the session cookie is first-party and there is no CORS layer. |
Database | Supabase (PostgreSQL 17) | Schema from `server/db/schema.sql`, demo data from `server/db/seed.mjs`. |
Build | `npm --prefix server install --omit=dev && npm --prefix web install --include=dev && npm --prefix web run build` | `--include=dev` matters: `NODE_ENV=production` would otherwise skip vite. |
Start | `node server/src/index.js` | Binds `0.0.0.0` because `NODE_ENV=production`. |

## Environment variables

Set on the Render service, never committed:

```
NODE_ENV=production
DATABASE_URL=postgresql://...@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
JWT_SECRET=<64 hex characters>
```

The app talks to Supabase through the transaction pooler on port 6543, which is the
port that behaves well when many short-lived connections arrive. TLS is on; the
provider's CA is not in node-postgres's bundle, so `server/src/db.js` disables CA
verification for non-local hosts and strips `sslmode` from the URL so the driver
does not re-apply its own policy.

## Applying the schema to a fresh database

```bash
psql "$DIRECT_URL" -f server/db/schema.sql     # session pooler, port 5432
DATABASE_URL="$DIRECT_URL" node server/db/seed.mjs
```

`server/db/reset.mjs` refuses to run unless the database is named `buildbond`, so on
a managed database apply `schema.sql` directly as above.

## Demo accounts

`client@buildbond.dev` and `contractor@buildbond.dev`, password `password123`.

## Checking a deployment

```bash
curl -s https://buildbond.onrender.com/api/health          # {"ok":true,...}
curl -s https://buildbond.onrender.com/ | head -3          # the SPA
curl -s -c /tmp/c -X POST https://buildbond.onrender.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"client@buildbond.dev","password":"password123"}'
curl -s -b /tmp/c https://buildbond.onrender.com/api/projects
```

## Free-tier behaviour

The Render instance sleeps after inactivity, so the first request after a quiet
period takes 30 to 60 seconds while the container starts. The page loads first and
the API call resolves shortly after; nothing errors, it is only slow once.
