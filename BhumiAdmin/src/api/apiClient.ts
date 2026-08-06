import axios from 'axios';

// ── Base URL — reads from env in production, falls back to localhost ─────────
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1';

let _accessToken: string | null = localStorage.getItem('admin_access_token');
let _refreshToken: string | null = localStorage.getItem('admin_refresh_token');
let _onRefresh: ((newAccess: string, newRefresh: string) => void) | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setAdminTokens(access: string | null, refresh: string | null): void {
  _accessToken = access;
  _refreshToken = refresh;
  if (access) {
    localStorage.setItem('admin_access_token', access);
  } else {
    localStorage.removeItem('admin_access_token');
  }
  if (refresh) {
    localStorage.setItem('admin_refresh_token', refresh);
  } else {
    localStorage.removeItem('admin_refresh_token');
  }
}

export function setAdminCallbacks(
  onRefresh: (newAccess: string, newRefresh: string) => void,
  onUnauthorized: () => void,
): void {
  _onRefresh = onRefresh;
  _onUnauthorized = onUnauthorized;
}

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${_accessToken}`
    } as any;
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      // Filter out Hindi messages
      const HINDI_PATTERN = /[\u0900-\u097F]/;
      const data = error.response.data;
      if (data) {
        if (data.message && HINDI_PATTERN.test(data.message)) {
          data.message = 'An unexpected error occurred. Please try again.';
        }
        if (data.detail && typeof data.detail === 'string' && HINDI_PATTERN.test(data.detail)) {
          data.detail = 'An unexpected error occurred. Please try again.';
        }
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry && _refreshToken) {
      if (_isRefreshing) {
        return new Promise((resolve) => {
          _refreshQueue.push((newToken) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`
            };
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(adminApi(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
          refresh_token: _refreshToken,
        });
        const { access_token, refresh_token } = data;
        setAdminTokens(access_token, refresh_token);
        _onRefresh?.(access_token, refresh_token);
        _refreshQueue.forEach((cb) => cb(access_token));
        _refreshQueue = [];
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${access_token}`
        };
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return adminApi(originalRequest);
      } catch {
        setAdminTokens(null, null);
        _onUnauthorized?.();
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default adminApi;
