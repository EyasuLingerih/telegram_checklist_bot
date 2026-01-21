import { create } from 'zustand';
import { api } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (initData: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.validateInitData(initData);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    api.clearToken();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshUser: async () => {
    try {
      const response = await api.getCurrentUser();
      set({ user: response.user });
    } catch {
      // Token might be invalid
      api.clearToken();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
