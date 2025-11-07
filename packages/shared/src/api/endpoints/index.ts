/**
 * API endpoints - Public API
 * FSD v2.1: Shared - API Layer
 */

export { getCurrentUser, normalizeAuthUser, requestLogin, requestLogout } from './auth';
export type { AuthSessionResponse, LoginRequest, LoginResponse, LogoutResponse } from './auth';
