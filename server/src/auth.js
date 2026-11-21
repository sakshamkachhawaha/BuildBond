import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { query } from './db.js';
import { HttpError } from './http.js';

export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, config.bcryptRounds);
}

export function verifyPassword(plainPassword, storedHash) {
  return bcrypt.compare(plainPassword, storedHash);
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function issueToken(user) {
  return jwt.sign(
    { sub: String(user.id) },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

export function setAuthCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
  });
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[config.cookieName];

    if (!token) {
      throw new HttpError(401, 'Please log in to continue.');
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new HttpError(401, 'Your session has expired. Please log in again.');
    }

    const userId = Number(payload.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new HttpError(401, 'Invalid session. Please log in again.');
    }

    const result = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [userId],
    );

    if (result.rowCount === 0) {
      throw new HttpError(401, 'Your account no longer exists.');
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    try {
      if (!req.user) {
        throw new HttpError(401, 'Please log in to continue.');
      }

      if (!roles.includes(req.user.role)) {
        const readable = roles.map((role) => role.toLowerCase()).join(' or ');
        throw new HttpError(403, `This action is only available to a ${readable}.`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
