export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function assert(condition, status, message) {
  if (!condition) throw new HttpError(status, message);
}

export function parseId(value) {
  const id = Number(value);
  assert(Number.isInteger(id) && id > 0, 400, 'Invalid id');
  return id;
}

