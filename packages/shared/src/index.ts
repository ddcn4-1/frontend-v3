/**
 * Shared package public API
 * Exposes curated segments instead of wildcard re-exports to keep boundaries explicit.
 */

// API
export {
  API_BASE,
  apiClient,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  HttpError,
  isAuthError,
  isServerError,
} from './api/client';
export type { FetchOptions } from './api/client';
export { getCurrentUser, normalizeAuthUser, requestLogin, requestLogout } from './api/endpoints';
export type {
  AuthSessionResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from './api/endpoints';
export { bookingService, venueService } from './api/services';
export type { BookingService, VenueService } from './api/services';

// Config
export { commonConfig } from './config/common';
export { API_CONFIG, buildApiUrl } from './config/api';
export {
  COGNITO_SCOPES,
  cognitoEnv,
  getCognitoAuthUrl,
  getCognitoLogoutUrl,
  redirectToCognitoLogout,
} from './config/cognito';

// Model
export * from './model/types';

// Library
export { AuthProvider, useAuth, useAuthState } from './lib/auth';
export type { AuthContextValue, UseAuthStateOptions, UseAuthStateReturn } from './lib/auth';
export {
  checkAuthCookies,
  getAllCookies,
  logAuthState,
  logCookies,
  testAuthMeEndpoint,
  testLogoutEndpoint,
} from './lib/debug';
export type { CookieInfo } from './lib/debug';
