import { assert } from './http.js';

export function text(value, field, { min = 1, max = 500 } = {}) {

  assert(typeof value === 'string', 400, `${field} must be text.`);

  const cleaned = value.trim();

  assert(cleaned.length >= min, 400, `${field} must be at least ${min} characters.`);
  assert(cleaned.length <= max, 400, `${field} must be at most ${max} characters.`);

  return cleaned;
}

export function email(value) {
  const cleaned = text(value, 'Email', { min: 3, max: 254 }).toLowerCase();

  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);

  assert(looksLikeEmail, 400, 'Enter a valid email address.');
  return cleaned;
}

export function password(value) {
  assert(typeof value === 'string', 400, 'Password must be text.');
  assert(value.length >= 8, 400, 'Password must be at least 8 characters.');
  assert(value.length <= 72, 400, 'Password must be at most 72 characters.');
  return value;
}

export function oneOf(value, allowed, field) {
  assert(
    typeof value === 'string' && allowed.includes(value),
    400,
    `${field} must be one of: ${allowed.join(', ')}.`,
  );

  return value;
}

export function positiveInteger(value, field) {
  const max = 2_147_483_647;

  assert(
    Number.isInteger(value) && value > 0,
    400,
    `${field} must be a positive whole number of paise.`,
  );

  assert(value <= max, 400, `${field} is too large for this demo.`);
  return value;
}


export function httpUrl(value) {
  const cleaned = text(value, 'Proof URL', { min: 8, max: 2000 });

  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch {
    assert(false, 400, 'Proof URL must be a valid URL, for example https://example.com/photo.jpg');
  }

  assert(
    parsed.protocol === 'http:' || parsed.protocol === 'https:',
    400,
    'Proof URL must start with http:// or https://.',
  );

  return cleaned;
}