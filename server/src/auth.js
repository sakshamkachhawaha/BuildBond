import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { HttpError } from './http.js';

export const hashPassword = (password) => bcrypt.hash(password, 10);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);
export const signUser = (user) => jwt.sign(user, config.jwtSecret, { expiresIn: '7d' });

export function requireAuth(request, _response, next) {
  try {
    const token = request.cookies?.buildbond_token;
    if (!token) throw new HttpError(401, 'Authentication required');
    request.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Invalid session'));
  }
}

export const requireRole = (...roles) => (request, _response, next) => {
  if (!roles.includes(request.user?.role)) return next(new HttpError(403, 'Forbidden'));
  next();
};

