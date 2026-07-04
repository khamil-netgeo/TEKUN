/**
 * Core Foundation: AuthContext
 *
 * Provides a React Context layer on top of the Zustand authStore.
 * All 12 modules should consume auth state via this context (useAuth hook)
 * rather than importing authStore directly — this ensures a single source
 * of truth and makes future auth provider swaps transparent.
 *
 * Usage:
 *   import { useAuth } from '@/context/AuthContext';
 *   const { user, isAuthenticated, login, logout, hasPermission } = useAuth();
 */

import React, { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useAuthStore, type User, type UserPermissions } from '@/store/authStore';
import api from '@/services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Currently authenticated user, or null if not logged in */
  user: User | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the auth store has finished hydrating from localStorage */
  isLoading: boolean;
  /** Login with email and password — returns user on success */
  login: (email: string, password: string) => Promise<User>;
  /** Logout — revokes token and clears state */
  logout: () => Promise<void>;
  /** Refresh the Sanctum token */
  refreshToken: () => Promise<void>;
  /** Check if user has a specific action permission */
  hasPermission: (permission: string) => boolean;
  /** Check if user has access to a specific module */
  hasModuleAccess: (module: string) => boolean;
  /** Check if user can approve up to a given amount */
  canApprove: (amount: number) => boolean;
  /** Check if user has one of the given roles */
  hasRole: (roles: string | string[]) => boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore();

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;

    // Merge token into user object for authStore compatibility
    const userWithToken: User = { ...user, token };
    store.login(userWithToken, token);

    // Set default Authorization header for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    return userWithToken;
  }, [store]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors — clear state regardless
    } finally {
      store.logout();
      delete api.defaults.headers.common['Authorization'];
    }
  }, [store]);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const response = await api.post('/auth/refresh');
      const { token, user } = response.data;
      const userWithToken: User = { ...user, token };
      store.login(userWithToken, token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch {
      // If refresh fails, force logout
      store.logout();
    }
  }, [store]);

  const hasRole = useCallback((roles: string | string[]): boolean => {
    if (!store.user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(store.user.role);
  }, [store.user]);

  const value: AuthContextValue = {
    user:            store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading:       !useAuthStore.persist.hasHydrated(),
    login,
    logout,
    refreshToken,
    hasPermission:   store.hasPermission,
    hasModuleAccess: store.hasModuleAccess,
    canApprove:      store.canApprove,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useAuth — primary hook for consuming auth context in any component.
 * Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider. Wrap your app with <AuthProvider>.');
  }
  return context;
}

export type { AuthContextValue, User, UserPermissions };
export default AuthContext;
