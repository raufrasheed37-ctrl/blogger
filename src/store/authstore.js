import { create } from 'zustand';
import { clearAuthTokenCookie, readAuthTokenCookie, setAuthTokenCookie } from '@/utils/auth-cookie';

const useAuthStore = create((set) => ({
  // State
  user: null,
  token: null,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Determine backend API base URL
  _apiBase: (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',

  // Login action
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const apiBase = useAuthStore.getState()._apiBase;
      const apiRoot = apiBase && apiBase.endsWith('/api') ? apiBase : `${apiBase.replace(/\/$/, '')}/api`;
      const res = await fetch(`${apiRoot}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      set({ user: data.user, token: data.token, isLoading: false });
      localStorage.setItem('token', data.token);
      setAuthTokenCookie(data.token);
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Register action
  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const apiBase = useAuthStore.getState()._apiBase;
      const apiRoot = apiBase && apiBase.endsWith('/api') ? apiBase : `${apiBase.replace(/\/$/, '')}/api`;
      const res = await fetch(`${apiRoot}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      set({ user: data.user, token: data.token, isLoading: false });
      localStorage.setItem('token', data.token);
      setAuthTokenCookie(data.token);
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Logout action
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
    clearAuthTokenCookie();
  },

  // Load from localStorage on app start
  hydrate: () => {
    const token = localStorage.getItem('token') || readAuthTokenCookie();
    if (token) set({ token });
    if (token) setAuthTokenCookie(token);
  },
}));

export default useAuthStore;

export function getClientAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    useAuthStore.getState().token ||
    localStorage.getItem("token") ||
    readAuthTokenCookie()
  );
}

export function isClientAuthenticated() {
  return Boolean(getClientAuthToken());
}
