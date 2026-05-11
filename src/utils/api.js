import axios from 'axios';
import useAuthStore, { getClientAuthToken } from '@/store/authstore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Axios instance with automatic auth token injection
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  // Prefer in-memory store token, fallback to localStorage/cookie token
  const token = useAuthStore.getState().token || getClientAuthToken();

  // Debug: log token presence (do not log full token in production)
  try {
    // eslint-disable-next-line no-console
    console.debug('[api] request', { url: config.url, hasToken: Boolean(token) });
  } catch (e) {}

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    try {
      // eslint-disable-next-line no-console
      console.debug('[api] no auth token available for request', { url: config.url });
    } catch (e) {}
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API Error';
    throw new Error(message);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }),

  getMe: () =>
    api.get('/auth/me'),
};

// Blog endpoints
export const blogAPI = {
  getAll: () => api.get('/posts'),

  getById: (id) => api.get(`/posts/${id}`),

  getByAuthor: (authorId) => api.get(`/posts/author/${authorId}`),

  create: (title, content, excerpt, author) =>
    api.post('/posts', { title, content, excerpt, author }),

  update: (id, title, content, excerpt) =>
    api.put(`/posts/${id}`, { title, content, excerpt }),

  delete: (id) =>
    api.delete(`/posts/${id}`),
};

// Subscribe endpoints
export const subscribeAPI = {
  toggle: (authorId) => api.post('/subscribe', { authorId }),
};
