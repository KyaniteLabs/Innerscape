import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const TOKEN_KEY = 'auth_token';

const webStorage = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) => { localStorage.setItem(key, value); return Promise.resolve(); },
  deleteItem: (key: string) => { localStorage.removeItem(key); return Promise.resolve(); },
  deleteItemAsync: (key: string) => { localStorage.removeItem(key); return Promise.resolve(); },
};

let secureStore: typeof import('expo-secure-store') | null = null;

async function getStore() {
  if (Platform.OS === 'web') return webStorage;
  if (!secureStore) secureStore = await import('expo-secure-store');
  return secureStore!;
}

export async function getToken(): Promise<string | null> {
  const store = await getStore();
  return store.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  const store = await getStore();
  return store.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  const store = await getStore();
  return store.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
