/**
 * Authentication API endpoints
 * FSD v2.1: Shared - API Layer
 *
 * NOTE: Auth endpoints use relative paths to leverage Vite proxy in development
 * and direct API calls in production.
 */

import { HttpError } from '../client';
import type { AuthUser } from '../../model/auth';

interface AuthSessionUserPayload {
  sub?: string;
  username?: string;
  email?: string;
  groups?: string[];
}

export interface AuthSessionResponse {
  authenticated: boolean;
  message?: string;
  user?: AuthSessionUserPayload | null;
  sub?: string;
  username?: string;
  email?: string;
  groups?: string[];
}

export function normalizeAuthUser(session: AuthSessionResponse): AuthUser | null {
  if (!session.authenticated) {
    return null;
  }

  const source =
    session.user ??
    ({
      sub: session.sub,
      username: session.username,
      email: session.email,
      groups: session.groups,
    } satisfies AuthSessionUserPayload);

  if (!source?.sub && !source?.username) {
    return null;
  }

  return {
    id: source.sub ?? '',
    username: source.username ?? '',
    email: source.email,
    groups: source.groups,
  };
}

/**
 * Auth API Base URL
 * - Hardcoded to production API endpoint
 */
const AUTH_API_BASE = 'https://api.ddcn41.com';

/**
 * GET request to auth endpoint with credentials (cookie)
 */
async function authGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`[AUTH] GET ${AUTH_API_BASE}${path} (credentials: include)`);
    const res = await fetch(`${AUTH_API_BASE}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    console.log(`[AUTH] GET ${path} - Status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[AUTH] GET ${path} failed:`, errorText);
      throw new HttpError(`GET ${path} failed: ${res.status} ${res.statusText}`, res.status, res);
    }

    const data: unknown = await res.json();
    console.log(`[AUTH] GET ${path} - Success`);
    return data as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new HttpError(`GET ${path} timed out after ${timeout}ms`, 408);
    }
    throw new HttpError(`GET ${path} network error: ${(error as Error).message}`, 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * POST request to auth endpoint with credentials (cookie)
 */
async function authPost<T>(path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`[AUTH] POST ${AUTH_API_BASE}${path} (credentials: include)`);
    const res = await fetch(`${AUTH_API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : '{}',
      signal: controller.signal,
    });

    console.log(`[AUTH] POST ${path} - Status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[AUTH] POST ${path} failed:`, errorText);
      throw new HttpError(`POST ${path} failed: ${res.status} ${res.statusText}`, res.status, res);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const data: unknown = await res.json();
    console.log(`[AUTH] POST ${path} - Success`);
    return data as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new HttpError(`POST ${path} timed out after ${timeout}ms`, 408);
    }
    throw new HttpError(`POST ${path} network error: ${(error as Error).message}`, 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get current authenticated user
 * @endpoint GET /v2/auth/me
 * @returns AuthUser object or authentication status
 */
export function getCurrentUser(): Promise<AuthSessionResponse> {
  return authGet<AuthSessionResponse>('/v2/auth/me');
}

/**
 * Login request body
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Login response from Lambda
 */
export interface LoginResponse {
  message: string;
  user: AuthUser;
}

/**
 * Login with username and password
 * @endpoint POST /v2/auth/login
 * @returns LoginResponse with user info
 */
export function requestLogin(credentials: LoginRequest): Promise<LoginResponse> {
  return authPost<LoginResponse>('/v2/auth/login', credentials);
}

/**
 * Logout response from Lambda
 */
export interface LogoutResponse {
  message: string;
  cognitoLogoutUrl?: string;
}

/**
 * Logout current user
 * @endpoint POST /v2/auth/logout
 * @returns LogoutResponse with optional cognitoLogoutUrl
 */
export function requestLogout(): Promise<LogoutResponse> {
  return authPost<LogoutResponse>('/v2/auth/logout');
}
