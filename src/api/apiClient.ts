/**
 * API Client -- axios instance with JWT interceptors
 *
 * - baseURL: VITE_API_BASE_URL (.env -> '/api')
 *   dev mode: Vite server.proxy forwards /api -> Spring Boot
 *   prod mode: Electron loads from same origin or direct URL
 *
 * - Request interceptor: attaches Authorization: Bearer {accessToken}
 * - Response interceptor: 401 -> silent token refresh -> retry original request
 *
 * Tokens are kept in-memory (NOT localStorage) to mitigate XSS.
 */

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// In-memory token store (XSS-safe: never touches localStorage)
// ---------------------------------------------------------------------------

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Called after login or token refresh to persist tokens in memory. */
export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  refreshToken = refresh;
}

/** Called on logout or session expiry. */
export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

/** Expose for guards / devtools that need to check auth state. */
export function getAccessToken(): string | null {
  return accessToken;
}

// ---------------------------------------------------------------------------
// Request interceptor -- attach Authorization header
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  // request error -- just reject
  (error: unknown) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor -- 401 token refresh + retry
// ---------------------------------------------------------------------------

/**
 * Prevent multiple concurrent refresh calls.
 * While a refresh is in-flight, queue all failing requests and replay
 * them once the new token arrives.
 */
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed(): void {
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  // 2xx -- pass through
  (response) => response,

  // non-2xx
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Guard: no config or not a 401 -- reject immediately
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Guard: the refresh call itself returned 401 -- avoid infinite loop
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearTokens();
      window.location.hash = '#/login';
      return Promise.reject(error);
    }

    // --- Token refresh flow ---

    if (!isRefreshing) {
      isRefreshing = true;

      try {
        // Call the refresh endpoint with the current refresh token.
        // This uses a raw axios call (not apiClient) to avoid triggering
        // the interceptor recursively.
        const { data } = await axios.post<{ accessToken: string }>(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
        );

        // Store the new access token
        accessToken = data.accessToken;
        isRefreshing = false;

        // Replay all queued requests with the new token
        onTokenRefreshed(data.accessToken);
      } catch {
        isRefreshing = false;
        onRefreshFailed();
        clearTokens();
        window.location.hash = '#/login';
        return Promise.reject(error);
      }
    }

    // Queue this request until the refresh completes
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken: string) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        resolve(apiClient(originalRequest));
      });
    });
  },
);

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default apiClient;
