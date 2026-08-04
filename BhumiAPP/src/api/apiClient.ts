import axios from 'axios';

console.log("[apiClient] Module Start");

// Change to your machine's local IP when running on a physical device or Android emulator.
// iOS simulator and web can use localhost directly.
// export const API_BASE_URL = 'http://localhost:8000/v1';
// export const API_BASE_URL = 'https://zenvora-bhumi.onrender.com/v1';
// export const API_BASE_URL = 'http://10.251.9.58:8000/v1';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://zenvora-bhumi.onrender.com/v1';

// Module-level token state — avoids circular imports with authStore.
let _accessToken: string | null = null;
let _refreshToken: string | null = null;
let _onRefresh: ((newAccessToken: string, newRefreshToken: string) => void) | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setAuthTokens(access: string | null, refresh: string | null): void {
  _accessToken = access;
  _refreshToken = refresh;
}

export function setAuthCallbacks(
  onRefresh: (newAccess: string, newRefresh: string) => void,
  onUnauthorized: () => void,
): void {
  _onRefresh = onRefresh;
  _onUnauthorized = onUnauthorized;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request logging ───────────────────────────────────────────────────────────
api.interceptors.request.use((config: any) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  console.log(
    `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    config.data ?? '',
  );
  return config;
});

// ── Response / error logging ──────────────────────────────────────────────────
let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
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

      // Format 422 Validation Errors
      if (error.response.status === 422 && error.response.data?.errors) {
        const validationMsg = error.response.data.errors
          .map((e: any) => `${e.field || 'Field'}: ${e.message}`)
          .join('\n');
        // Re-inject the formatted message into the detail/message field so all UI components catch it
        error.response.data.detail = validationMsg;
        error.response.data.message = validationMsg;
      }
      // Server returned an HTTP error (4xx / 5xx)
      console.warn(
        `[API] ERROR ${error.response.status} ${originalRequest?.url}`,
        JSON.stringify(error.response.data),
      );
    } else if (error.request) {
      // Request was made but no response received — network unreachable
      console.error(
        `[API] NETWORK ERROR — no response received.\n` +
        `  URL   : ${API_BASE_URL}${originalRequest?.url}\n` +
        `  Reason: ${error.message}\n` +
        `  Make sure the backend is running with:  python run.py\n` +
        `  Backend must bind 0.0.0.0:8000 (not 127.0.0.1) to be reachable from a device.`,
      );
    } else {
      console.error(`[API] REQUEST SETUP ERROR: ${error.message}`);
    }

    if (error.response?.status === 401 && !originalRequest._retry && _refreshToken) {
      if (_isRefreshing) {
        return new Promise((resolve) => {
          _refreshQueue.push((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: _refreshToken,
        });
        const { access_token, refresh_token } = data;
        setAuthTokens(access_token, refresh_token);
        _onRefresh?.(access_token, refresh_token);
        _refreshQueue.forEach((cb) => cb(access_token));
        _refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch {
        setAuthTokens(null, null);
        _onUnauthorized?.();
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
