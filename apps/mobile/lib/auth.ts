import { api, setToken, clearToken } from './api';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface UserWithPrefs {
  id: string;
  email: string;
  name: string;
  preferences: {
    theme: string;
    emotionalCheckInReminders: boolean;
    journalPromptFrequency: string;
  } | null;
}

export async function register(email: string, password: string, name: string) {
  const res = await api.post<AuthResponse>('/api/v1/auth/register', { email, password, name });
  await setToken(res.token);
  return res;
}

export async function login(email: string, password: string) {
  const res = await api.post<AuthResponse>('/api/v1/auth/login', { email, password });
  await setToken(res.token);
  return res;
}

export async function getMe() {
  return api.get<UserWithPrefs>('/api/v1/user/me');
}

export async function updatePreferences(prefs: Record<string, unknown>) {
  return api.put<UserWithPrefs>('/api/v1/user/preferences', prefs);
}

export async function logout() {
  await clearToken();
}
