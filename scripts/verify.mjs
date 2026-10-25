import { spawn } from 'node:child_process';

const server = spawn('node', ['server/src/index.js'], { stdio: 'inherit' });
try {
  await new Promise((resolve) => setTimeout(resolve, 500));
  await import('./smoke.mjs');
} finally {
  server.kill('SIGTERM');
}

