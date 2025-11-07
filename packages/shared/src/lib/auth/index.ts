/**
 * Authentication library - Public API
 * FSD v2.1: Shared - Library Layer
 */

export { AuthProvider, useAuth } from './AuthProvider';
export type { AuthContextValue } from './AuthProvider';

export { useAuthState } from './useAuthState';
export type { UseAuthStateOptions, UseAuthStateReturn } from './useAuthState';

// Re-export auth API endpoints and types
import {
  getCurrentUser as apiGetCurrentUser,
  requestLogin as apiRequestLogin,
  requestLogout as apiRequestLogout,
} from '../../api/endpoints/auth';

export {
  apiGetCurrentUser as getCurrentUser,
  apiRequestLogin as requestLogin,
  apiRequestLogout as requestLogout,
};
export type {
  LoginRequest,
  LoginResponse as AuthResponse,
  LogoutResponse,
} from '../../api/endpoints/auth';

// Re-export auth model types
export type { AuthUser as User } from '../../model/auth';

// Auth service object for backward compatibility
export const authService = {
  getCurrentUser: apiGetCurrentUser,
  login: apiRequestLogin,
  logout: apiRequestLogout,
};

// Helper function to get accounts login URL
export function getAccountsLoginUrl(returnUrl?: string): string {
  const accountsUrl = import.meta.env.VITE_ACCOUNTS_URL || 'https://accounts.ddcn41.com';
  const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
  return `${accountsUrl}/login${params}`;
}
