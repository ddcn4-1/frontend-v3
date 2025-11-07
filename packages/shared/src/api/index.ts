/**
 * API layer - Public API
 * FSD v2.1: Shared - API Layer
 */

// HTTP Client
export {
  apiClient,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  isAuthError,
  isServerError,
  HttpError,
  API_BASE,
} from './client';
export type { FetchOptions } from './client';

// Endpoints
export { getCurrentUser, normalizeAuthUser, requestLogout } from './endpoints';
export type { AuthSessionResponse } from './endpoints';
