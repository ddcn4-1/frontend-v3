/**
 * Authentication model types
 * FSD v2.1: Model Layer (Shared)
 */

/**
 * User authentication information returned from /v2/auth/me
 */
export interface AuthUser {
  /** User identifier */
  id: string;
  /** Display username */
  username: string;
  /** User email (optional) */
  email?: string;
  /** User groups (optional) */
  groups?: string[];
  /** User role (optional, derived from groups) */
  role?: 'ADMIN' | 'USER' | 'DEV' | 'DEVOPS';
}

/**
 * Authentication error response
 */
export interface AuthError {
  error: string;
  message: string;
}
