import { assert } from './http.js';

export function requiredString(value, field) {
  assert(typeof value === 'string' && value.trim().length > 0, 400, `${field} is required`);
  return value.trim();
}

