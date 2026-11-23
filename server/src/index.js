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

// 127.0.0.1 is right for local development, but a hosted platform routes traffic
// into the container from outside the loopback interface, so production binds
// to every interface. HOST overrides both if a platform needs a specific one.
const host = process.env.HOST || (config.isProduction ? '0.0.0.0' : '127.0.0.1');

const server = app.listen(config.port, host, () => {
  console.log(`\nBuildBond API listening on http://${host}:${config.port}`);
  console.log('Health check: http://' + host + ':' + config.port + '/api/health\n');
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