import '../src/config.js';
import { pool } from '../src/db.js';

try {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
} finally {
  await pool.end();
}

