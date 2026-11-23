import { readFileSync } from 'node:fs';
import pg from 'pg';
import { config } from '../src/config.js';

const { Client } = pg;

const databaseName = new URL(config.databaseUrl).pathname.replace(/^\//, '');

if (databaseName !== 'buildbond') {
  console.error(
    `Refusing to reset database "${databaseName}". ` +
      'This script only runs against a database named "buildbond".',
  );
  process.exit(1);
}

const schemaSql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

const client = new Client({ connectionString: config.databaseUrl });

try {
  await client.connect();

  await client.query(schemaSql);

  console.log(`Schema applied to database "${databaseName}".`);
} catch (error) {

  if (error.code === 'ECONNREFUSED') {
    console.error(
      'Could not connect to PostgreSQL. Start Postgres.app first: open -a Postgres',
    );
  } else if (error.code === '3D000') {
    console.error(
      'Database "buildbond" does not exist. Create it with:\n' +
        '/Applications/Postgres.app/Contents/Versions/18/bin/createdb buildbond',
    );
  } else {
    console.error('Could not apply the schema:', error.message);
  }

  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}