import { Router } from 'express';
import { hashPassword, verifyPassword, signUser, requireAuth } from '../auth.js';
import { pool } from '../db.js';
import { HttpError } from '../http.js';

export const authRouter = Router();

function setAuthCookie(res, token) {
  res.cookie('buildbond_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new HttpError(400, 'Name is required.');
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new HttpError(400, 'A valid email is required.');
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new HttpError(400, 'Password must be at least 8 characters.');
    }
    if (!['CLIENT', 'CONTRACTOR'].includes(role)) {
      throw new HttpError(400, 'Role must be either CLIENT or CONTRACTOR.');
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(password);

    let result;
    try {
      result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        [cleanName, cleanEmail, passwordHash, role],
      );
    } catch (err) {
      if (err.code === '23505') {
        throw new HttpError(409, 'An account with that email already exists.');
      }
      throw err;
    }

    const user = result.rows[0];
    const token = signUser({ id: user.id, name: user.name, email: user.email, role: user.role });
    setAuthCookie(res, token);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw new HttpError(400, 'Email and password are required.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role FROM users WHERE email = $1`,
      [cleanEmail],
    );

    const user = result.rows[0];
    if (!user) {
      throw new HttpError(401, 'Email or password is incorrect.');
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      throw new HttpError(401, 'Email or password is incorrect.');
    }

    const token = signUser({ id: user.id, name: user.name, email: user.email, role: user.role });
    setAuthCookie(res, token);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('buildbond_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});
