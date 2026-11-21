import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const thisFolder = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(thisFolder, '..', '.env');

dotenv.config({ path: envFile });

function required(name) {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        'Copy server/.env.example to server/.env and fill it in.',
    );
  }

  return value.trim();
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 16) {
  throw new Error('JWT_SECRET must be at least 16 characters long.');
}

const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PORT must be a valid port number, got "${process.env.PORT}".`);
}

export const config = Object.freeze({
  port,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  cookieName: 'buildbond_token',

  jwtExpiresIn: '7d',

  bcryptRounds: 10,
});
