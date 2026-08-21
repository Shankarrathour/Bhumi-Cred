import axios from 'axios';

console.log("[apiClient] Module Start");

// ── API Base URL ────────────────────────────────────────────────────────────
// Physical device on same Wi-Fi → needs LAN IP (not localhost)
// Current machine IP: 10.179.136.159
const _FALLBACK_URL = 'http://10.179.136.159:8000/v1';

const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const isTunnel = envUrl && (envUrl.includes('loca.lt') || envUrl.includes('localtunnel'));
export const API_BASE_URL = (envUrl && !isTunnel) ? envUrl : _FALLBACK_URL;

console.log('[apiClient] API_BASE_URL:', API_BASE_URL);

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
  timeout: 30000,
});

// ── Request logging & header adjustments ──────────────────────────────────────
api.interceptors.request.use((config: any) => {
  let token = _accessToken;
  if (!token) {
    try {
      const authState = require('../store/authStore').useAuthStore.getState();
      token = authState.accessToken;
      if (token && !_accessToken) {
        _accessToken = token;
        _refreshToken = authState.refreshToken;
      }
    } catch (e) {}
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    if (typeof config.headers?.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Remove explicit Content-Type header when sending FormData or multipart requests.
  const isFormData = config.data && typeof FormData !== 'undefined' && config.data instanceof FormData;
  const isMultipart = config.headers && (
    (typeof config.headers['Content-Type'] === 'string' && config.headers['Content-Type'].includes('multipart/form-data')) ||
    (typeof config.headers['content-type'] === 'string' && config.headers['content-type'].includes('multipart/form-data'))
  );

  if (isFormData || isMultipart) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  console.log(
    `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    config.data ?? '',
  );
  return config;
});

// ── Response / error logging ──────────────────────────────────────────────────
let _isRefreshing = false;
let _refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isInvalidTokenError =
      (typeof error.response?.data?.message === 'string' &&
        error.response?.data?.message.includes('Token is not a farmer token'));

    const is401WithRefreshToken =
      error.response?.status === 401 &&
      !isInvalidTokenError &&
      originalRequest &&
      !originalRequest._retry &&
      !!_refreshToken;

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

      // Handle deleted or blocked farmer account (404, 403, 401)
      const errCode = error.response.data?.error_code;
      const errMsg = typeof error.response.data?.message === 'string' ? error.response.data.message.toLowerCase() : '';
      const isFarmerDeletedOrBlocked =
        errCode === 'FARMER_NOT_FOUND' ||
        errCode === 'FARMER_BLOCKED' ||
        (error.response.status === 404 && errMsg.includes('farmer')) ||
        (error.response.status === 403 && (errMsg.includes('blocked') || errMsg.includes('suspended'))) ||
        (error.response.status === 401 && errMsg.includes('token is not a farmer token'));

      if (isFarmerDeletedOrBlocked) {
        try {
          console.warn('[apiClient] Account deleted/deactivated by admin or token invalidated. Triggering auto-logout...');
          const authStore = require('../store/authStore').useAuthStore.getState();
          authStore.logout();
        } catch (e) {
          console.log('[apiClient] Failed to auto-logout deleted farmer', e);
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
      // Suppress console.warn for expected/handled business flows and token expirations
      const isExpectedError =
        error.response.status === 401 ||
        isInvalidTokenError ||
        (error.response.status === 404 && error.response.data?.error_code === 'REGISTRATION_NOT_FOUND') ||
        (error.response.status === 404 && error.response.data?.error_code === 'MOBILE_NOT_REGISTERED');

      if (!isExpectedError) {
        console.warn(
          `[API] ERROR ${error.response.status} ${originalRequest?.url}`,
          JSON.stringify(error.response.data),
        );
      } else {
        console.log(
          `[API] Expected error handled for ${originalRequest?.url} (${error.response.status} - ${error.response.data?.error_code || 'N/A'})`
        );
      }
    } else if (error.request) {
      // Request was made but no response received — network unreachable
      console.warn(
        `[API] NETWORK ERROR — no response received.\n` +
        `  URL   : ${API_BASE_URL}${originalRequest?.url}\n` +
        `  Reason: ${error.message}\n` +
        `  Make sure the backend is running with:  python run.py\n` +
        `  Backend must bind 0.0.0.0:8000 (not 127.0.0.1) to be reachable from a device.`,
      );
    } else {
      console.warn(`[API] REQUEST SETUP ERROR: ${error.message}`);
    }

    if (is401WithRefreshToken) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({
            resolve: (newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        console.log(`[API] Requesting new tokens via /auth/refresh...`);
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: _refreshToken,
        });
        const { access_token, refresh_token } = data;
        setAuthTokens(access_token, refresh_token);
        _onRefresh?.(access_token, refresh_token);
        console.log(`[API] Token refresh succeeded. Retrying queued requests.`);
        _refreshQueue.forEach((cb) => cb.resolve(access_token));
        _refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (err) {
        console.warn(`[API] Token refresh failed. User will be logged out.`, err);
        setAuthTokens(null, null);
        _onUnauthorized?.();
        _refreshQueue.forEach((cb) => cb.reject(err));
        _refreshQueue = [];
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
