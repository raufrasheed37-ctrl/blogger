import { create } from "zustand";

import {
  clearAuthTokenCookie,
  readAuthTokenCookie,
  setAuthTokenCookie,
} from "@/utils/auth-cookie";

const useAuthStore = create((set) => ({
  // STATE
  user: null,
  token: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  // ACTIONS
  setUser: (user) => set({ user }),

  setToken: (token) =>
    set({ token }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setError: (error) =>
    set({ error }),

  // API BASE
  _apiBase:
    process.env
      .NEXT_PUBLIC_API_URL ||
    "http://localhost:5000",

  // LOGIN
  login: async (
    email,
    password
  ) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const apiBase =
        useAuthStore.getState()
          ._apiBase;

      const res = await fetch(
        `${apiBase}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Login failed"
        );
      }

      set({
        user: data.user,
        token: data.token,
        isLoading: false,
      });

      localStorage.setItem(
        "token",
        data.token
      );

      setAuthTokenCookie(
        data.token
      );
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  // REGISTER
  register: async (
    email,
    password,
    name
  ) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const apiBase =
        useAuthStore.getState()
          ._apiBase;

      const res = await fetch(
        `${apiBase}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            name,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Registration failed"
        );
      }

      set({
        user: data.user,
        token: data.token,
        isLoading: false,
      });

      localStorage.setItem(
        "token",
        data.token
      );

      setAuthTokenCookie(
        data.token
      );
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  // LOGOUT
  logout: () => {
    set({
      user: null,
      token: null,
    });

    localStorage.removeItem(
      "token"
    );

    clearAuthTokenCookie();
  },

  // HYDRATE
  hydrate: async () => {
    if (typeof window === "undefined") {
      return;
    }

    set({ isLoading: true });

    const token =
      localStorage.getItem("token") ||
      readAuthTokenCookie();

    if (!token) {
      set({ token: null, user: null, isLoading: false, isHydrated: true });
      return;
    }

    setAuthTokenCookie(token);
    set({ token });

    try {
      const apiBase = useAuthStore.getState()._apiBase;
      const response = await fetch(`${apiBase}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to restore session");
      }

      set({ user: data.user || data, isLoading: false, isHydrated: true });
    } catch (error) {
      localStorage.removeItem("token");
      clearAuthTokenCookie();
      set({ token: null, user: null, isLoading: false, isHydrated: true, error: error.message });
    }
  },
}));

export default useAuthStore;

export function getClientAuthToken() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  return (
    useAuthStore.getState()
      .token ||
    localStorage.getItem(
      "token"
    ) ||
    readAuthTokenCookie()
  );
}

export function isClientAuthenticated() {
  return Boolean(
    getClientAuthToken()
  );
}
