import axios from 'axios';

// ── Base URL — reads from env in production, falls back to localhost ─────────
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — reads admin_access_token (set by Zustand auth store)
apiClient.interceptors.request.use(
  (config) => {
    // ⚠️ FIX: was reading 'token' — now reads 'admin_access_token' to match
    // the Zustand useAuthStore which saves under 'admin_access_token'
    const token =
      localStorage.getItem('admin_access_token') ||
      localStorage.getItem('token'); // legacy fallback
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — handles 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear all possible token keys used across the codebase
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);
