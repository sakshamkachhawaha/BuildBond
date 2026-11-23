import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const databaseUrl =
  process.env.DATABASE_URL || 'postgres://localhost:5432/buildbond';

const apiPort = 4100;
const baseUrl = `http://127.0.0.1:${apiPort}`;

function runNodeScript(script, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: root,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        ...extraEnv,
      },
      stdio: 'inherit',
    });

    child.on('error', reject);

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} exited with code ${code}`));
      }
    });
  });
}

async function waitForApi() {
  for (let attempt = 1; attempt <= 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);

      if (response.ok) {
        return;
      }
    } catch {
    }

    await delay(200);
  }

  throw new Error(`The API did not become ready at ${baseUrl} within 10 seconds.`);
}

async function stopServer(server) {
  if (server.exitCode !== null || server.signalCode !== null) {
    return;
  }

  const exited = once(server, 'exit');

  const forceKill = setTimeout(() => {
    server.kill('SIGKILL');
  }, 3000);
  forceKill.unref();

  server.kill('SIGTERM');

  await exited;
  clearTimeout(forceKill);
}

let server = null;

try {
  console.log('\n[1/5] Resetting the buildbond database...');
  await runNodeScript('server/db/reset.mjs');

  console.log('\n[2/5] Seeding demo data...');
  await runNodeScript('server/db/seed.mjs');

  console.log(`\n[3/5] Starting the API on ${baseUrl} ...`);
  server = spawn(process.execPath, ['server/src/index.js'], {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      PORT: String(apiPort),
      JWT_SECRET: 'verify-only-buildbond-secret-1234567890',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  await waitForApi();
  console.log('[4/5] API is ready. Running the smoke test...\n');

  await runNodeScript('scripts/smoke.mjs', { BASE_URL: baseUrl });

  console.log('[5/5] Stopping the API and restoring clean demo data...');
  await stopServer(server);
  server = null;

  await runNodeScript('server/db/reset.mjs');
  await runNodeScript('server/db/seed.mjs');

  console.log('\nVERIFY PASSED - the backend, money rules and demo data are healthy.\n');
  console.log('Demo accounts:');
  console.log('  client@buildbond.dev / password123');
  console.log('  contractor@buildbond.dev / password123\n');
} catch (error) {
  console.error('\nVERIFY FAILED:', error.message);

  if (server) {
    await stopServer(server);
  }

  process.exitCode = 1;
}