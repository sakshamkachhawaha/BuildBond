import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

// Hosted PostgreSQL providers (Supabase, Heroku, Render) present a certificate
// chain signed by their own CA, which node-postgres does not ship. The connection
// is still TLS-encrypted; only CA verification is skipped. Local development has
// no TLS at all, so sslmode is stripped and nothing is passed in.
const parsedUrl = new URL(config.databaseUrl);
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
const ssl = isLocalHost ? undefined : { rejectUnauthorized: false };
parsedUrl.searchParams.delete('sslmode');

export const pool = new Pool({
  connectionString: parsedUrl.toString(),
  ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error.message);
});

export function query(text, params) {
  return pool.query(text, params);
}

export async function withTransaction(work) {

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); 

    const result = await work(client);

    await client.query('COMMIT'); 
    return result;
  } catch (error) {

    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError.message);
    }

    throw error;
  } finally {
    client.release();
  }
}