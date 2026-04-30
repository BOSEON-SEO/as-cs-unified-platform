/**
 * Auth Store -- zustand v5 with localStorage persist
 *
 * Manages:
 *   - user profile (id, name, role, email)
 *   - JWT tokens (access + refresh)
 *   - isLoggedIn derived state
 *   - login / logout / setToken actions
 *
 * Persist: localStorage key "auth-store"
 *   Only user profile is persisted (tokens stay in-memory via apiClient).
 *   On page refresh, user info restores from localStorage but tokens
 *   require a fresh /auth/refresh call.
 *
 * Token flow:
 *   login()  -> POST /auth/login -> setTokens(apiClient) + set user
 *   logout() -> clearTokens(apiClient) + clear user + redirect
 *   setToken() -> setTokens(apiClient) only (for silent refresh)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRole } from '@/types/index.ts';
import apiClient, { setTokens, clearTokens } from '@/api/apiClient.ts';

// ---------------------------------------------------------------------------
// Types (TS 6.x: no enum, union + as const only)
// ---------------------------------------------------------------------------

export interface AuthUser {
  userId: number;
  username: string;
  name: string;
  role: UserRole;
  email: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface AuthState {
  // -- state --
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;

  // -- actions --
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  setToken: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  setUser: (user: AuthUser) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // -- initial state --
      user: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,

      // -- login --
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.post<LoginResponse>(
            '/auth/login',
            credentials,
          );

          // Store tokens in apiClient's in-memory store
          setTokens(data.accessToken, data.refreshToken);

          set({
            user: data.user,
            isLoggedIn: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : '로그인에 실패했습니다.';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      // -- logout --
      logout: () => {
        clearTokens();
        set({
          user: null,
          isLoggedIn: false,
          error: null,
        });
        window.location.hash = '#/login';
      },

      // -- setToken (for silent refresh / external token injection) --
      setToken: (accessToken: string, refreshToken: string) => {
        setTokens(accessToken, refreshToken);
      },

      // -- clearError --
      clearError: () => {
        set({ error: null });
      },

      // -- setUser (for /auth/me profile refresh) --
      setUser: (user: AuthUser) => {
        set({ user, isLoggedIn: true });
      },
    }),

    // -- persist config --
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist user profile -- tokens stay in apiClient memory
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    },
  ),
);
