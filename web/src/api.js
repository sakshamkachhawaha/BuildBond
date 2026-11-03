
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status 
   */
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * @param {string} path - starts with "/", for example "/projects/3"
 * @param {{method?: string, body?: unknown}} [options]
 * @returns {Promise<any>} the parsed JSON body, or null for 204 No Content
 * @throws {ApiError} when the network fails or the server returns a non-2xx
 */
export async function api(path, { method = 'GET', body } = {}) {
  let response;

  try {
    response = await fetch(`/api${path}`, {
      method,

      credentials: 'include',

      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },

      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Cannot reach the BuildBond API. Is the server running?',
      0,
    );
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  return data;
}
