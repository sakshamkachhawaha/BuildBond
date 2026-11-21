export class HttpError extends Error {
  constructor(status, message) {
    super(message); 
    this.name = 'HttpError'; 
    this.status = status; 
  }
}

export function assert(condition, status, message) {
  if (!condition) {
    throw new HttpError(status, message);
  }
}

export function parseId(value, field = 'id') {
  const number = Number(value);
  
  assert(
    Number.isInteger(number) && number > 0 && number <= 2_147_483_647,
    400,
    `${field} must be a positive whole number.`,
  );

  return number;
}
