const API_URL = '/api';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  if (response.status === 204) return undefined as T;
  const payload: { data?: T; error?: { message?: string } } = await response.json() as { data?: T; error?: { message?: string } };
  if (!response.ok) throw new ApiError(payload.error?.message ?? 'Something went wrong. Please try again.', response.status);
  if (!('data' in payload)) throw new ApiError('The server returned an unexpected response.', response.status);
  return payload.data as T;
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
