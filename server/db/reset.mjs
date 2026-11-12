import { readFileSync } from 'node:fs';
import pg from 'pg';
import { config } from '../src/config.js';

const { Client } = pg;
const schemaSql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const client = new Client({ connectionString: config.databaseUrl });

try {
  await client.connect();
  await client.query(schemaSql);
} finally {
  await client.end().catch(() => {});
}
