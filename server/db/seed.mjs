import '../src/config.js';
import { pool } from '../src/db.js';

try {
  console.log('Database seed is ready for demo fixtures.');
} finally {
  await pool.end();
}

