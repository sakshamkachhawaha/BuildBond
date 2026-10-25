import { app } from './app.js';
import { config } from './config.js';

const server = app.listen(config.port, '127.0.0.1', () => {
  console.log(`BuildBond API listening on http://127.0.0.1:${config.port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

