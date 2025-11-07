/**
 * Library layer - Public API
 * FSD v2.1: Shared - Library Layer
 */

// Authentication
export { AuthProvider, useAuth, useAuthState } from './auth';
export type { AuthContextValue, UseAuthStateOptions, UseAuthStateReturn } from './auth';

// Debug utilities
export {
  getAllCookies,
  logCookies,
  checkAuthCookies,
  logAuthState,
  testAuthMeEndpoint,
  testLogoutEndpoint,
} from './debug';
export type { CookieInfo } from './debug';
