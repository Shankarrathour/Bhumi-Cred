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
    const token =
      localStorage.getItem('admin_access_token') ||
      localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
      if (typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      }
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
      console.log('[Admin Axios] 401 for', error.config?.url, '— clearing stale tokens, redirecting to login');
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      // Redirect to login only if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/auth')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
