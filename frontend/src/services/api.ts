const API_BASE = '/api';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

export function getStoredSessionToken(): string | null {
  return localStorage.getItem('astro_session_token');
}

export function setStoredSessionToken(token: string | null): void {
  if (token) {
    localStorage.setItem('astro_session_token', token);
  } else {
    localStorage.removeItem('astro_session_token');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredSessionToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && (data.error === 'SESSION_REVOKED' || data.error === 'SESSION_EXPIRED')) {
      setStoredSessionToken(null);
      window.dispatchEvent(
        new CustomEvent('astro:session_terminated', {
          detail: { error: data.error, message: data.message },
        })
      );
    }
    throw new ApiError(data.message || 'API request failed', data.error || 'API_ERROR', response.status);
  }

  return data as T;
}
