import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getToken } from '../lib/api';

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
    const token = await getToken();
    if (token) {
      set({ isAuthenticated: true, hydrated: true });
    } else {
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
    await SecureStore.deleteItemAsync('auth_token');
    set({
      isAuthenticated: false,
      userId: null,
      email: null,
      name: null,
    });
  },
}));
