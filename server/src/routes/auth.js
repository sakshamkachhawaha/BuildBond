import { Router } from 'express';
import {
  clearAuthCookie,
  hashPassword,
  issueToken,
  publicUser,
  requireAuth,
  setAuthCookie,
  verifyPassword,
} from '../auth.js';
import { query } from '../db.js';
import { HttpError } from '../http.js';
import { email, oneOf, password, text } from '../validate.js';

const router = Router();

router.post('/register', async (req, res) => {
  const name = text(req.body?.name, 'Name', { min: 2, max: 80 });
  const address = email(req.body?.email);
  const plainPassword = password(req.body?.password);
  const role = oneOf(req.body?.role, ['CLIENT', 'CONTRACTOR'], 'Role');

  const passwordHash = await hashPassword(plainPassword);

  let result;

  try {
    result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, address, passwordHash, role],
    );
  } catch (error) {

    if (error.code === '23505') {
      throw new HttpError(409, 'An account with that email already exists.');
    }
    throw error;
  }

  const user = result.rows[0];

  setAuthCookie(res, issueToken(user));

  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const address = email(req.body?.email);
  const plainPassword = password(req.body?.password);

  const result = await query('SELECT * FROM users WHERE email = $1', [address]);
  const user = result.rows[0];

  if (!user) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }

  const passwordMatches = await verifyPassword(plainPassword, user.password_hash);

  if (!passwordMatches) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }

  setAuthCookie(res, issueToken(user));

  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;