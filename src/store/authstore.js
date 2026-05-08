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
