import type { DirectoryUser, Quote, QuotePayload } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  userId: string | null,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (userId) headers['X-User-Id'] = userId;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listUsers: (): Promise<DirectoryUser[]> => request('/users', null),

  listQuotes: (userId: string): Promise<Quote[]> =>
    request('/quotes', userId),

  getQuote: (userId: string, id: string): Promise<Quote> =>
    request(`/quotes/${id}`, userId),

  createQuote: (userId: string, dto: QuotePayload): Promise<Quote> =>
    request('/quotes', userId, { method: 'POST', body: JSON.stringify(dto) }),

  updateQuote: (
    userId: string,
    id: string,
    dto: QuotePayload,
  ): Promise<Quote> =>
    request(`/quotes/${id}`, userId, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  syncQuote: (userId: string, id: string): Promise<Quote> =>
    request(`/quotes/${id}/sync`, userId, { method: 'POST' }),
};
