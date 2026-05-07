import { create } from 'zustand';
import { clearToken } from '../lib/api';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  name: string | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setUser: (user: { id: string; email: string; name: string }) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  email: null,
  name: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const { getToken } = await import('../lib/api');
      const token = await getToken();
      set({ isAuthenticated: !!token, hydrated: true });
    } catch {
      set({ isAuthenticated: false, hydrated: true });
    }
  },

  setUser: (user) =>
    set({
      isAuthenticated: true,
      userId: user.id,
      email: user.email,
      name: user.name,
    }),

  logout: async () => {
    await clearToken();
    set({
      isAuthenticated: false,
      userId: null,
      email: null,
      name: null,
    });
  },
}));
