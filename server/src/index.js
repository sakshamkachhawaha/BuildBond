import { app } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

try {
  await pool.query('SELECT 1');
} catch (error) {
  console.error('\nBuildBond cannot start: PostgreSQL is not reachable.');
  console.error(error.message);
  console.error(
    '\nStart the database with: open -a Postgres\n' +
      'Then check it with: /Applications/Postgres.app/Contents/Versions/18/bin/pg_isready\n',
  );
  process.exit(1);
}

const server = app.listen(config.port, '127.0.0.1', () => {
  console.log(`\nBuildBond API listening on http://127.0.0.1:${config.port}`);
  console.log('Health check: http://127.0.0.1:' + config.port + '/api/health\n');
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`\n${signal} received. Shutting down...`);

  server.close(async () => {
    await pool.end();
    console.log('Server and database pool closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Shutdown took too long; forcing exit.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));