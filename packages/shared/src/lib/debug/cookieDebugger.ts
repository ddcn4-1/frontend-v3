/**
 * Cookie debugging utility
 * FSD v2.1: Shared Layer - Library Segment
 *
 * Use this to inspect cookies and diagnose authentication issues
 */

export interface CookieInfo {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
}

/**
 * Parse all cookies from document.cookie
 * Note: HttpOnly cookies won't appear here (they're server-side only)
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (typeof document === 'undefined') {
    return cookies;
  }

  document.cookie.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  return cookies;
}

/**
 * Log all visible cookies to console
 */
export function logCookies(): void {
  const cookies = getAllCookies();
  console.log('📊 [Cookie Debugger] Visible cookies:', cookies);
  console.log('📊 [Cookie Debugger] Cookie count:', Object.keys(cookies).length);

  if (Object.keys(cookies).length === 0) {
    console.warn(
      '⚠️ [Cookie Debugger] No cookies found. HttpOnly cookies are not visible to JavaScript.',
    );
  }
}

/**
 * Check if authentication cookies exist
 * Note: HttpOnly cookies (id_token, access_token, refresh_token) won't be visible
 */
export function checkAuthCookies(): void {
  const cookies = getAllCookies();
  const authCookieNames = ['id_token', 'access_token', 'refresh_token'];

  console.log('🔍 [Cookie Debugger] Checking auth cookies...');

  authCookieNames.forEach((name) => {
    if (cookies[name]) {
      console.log(`✅ [Cookie Debugger] ${name}: EXISTS (visible)`);
    } else {
      console.log(`⚠️ [Cookie Debugger] ${name}: NOT VISIBLE (may be HttpOnly)`);
    }
  });

  console.log('ℹ️ [Cookie Debugger] HttpOnly cookies are not accessible via JavaScript');
  console.log('ℹ️ [Cookie Debugger] Check Network tab → Cookies to see all cookies');
}

/**
 * Log authentication state for debugging
 */
import type { AuthUser } from '../../model/auth';
import type { AuthSessionResponse } from '../../api/endpoints/auth';
import { normalizeAuthUser } from '../../api/endpoints/auth';

function isAuthSessionResponse(value: unknown): value is AuthSessionResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'authenticated' in value &&
    typeof (value as { authenticated: unknown }).authenticated === 'boolean'
  );
}

export function logAuthState(user: AuthUser | null, loading: boolean): void {
  console.log('🔐 [Auth State]', {
    authenticated: !!user,
    loading,
    user: user
      ? {
          id: user.id,
          username: user.username,
          email: user.email,
          groups: user.groups,
        }
      : null,
  });
}

/**
 * Test /v2/auth/me endpoint
 */
export async function testAuthMeEndpoint(): Promise<void> {
  const apiBase = import.meta.env.VITE_API_BASE || 'https://api.ddcn41.com';
  const url = `${apiBase}/v2/auth/me`;

  console.log(`🧪 [Cookie Debugger] Testing ${url}...`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Important: send cookies
      headers: {
        Accept: 'application/json',
      },
    });

    console.log('📡 [Cookie Debugger] Response status:', response.status);
    console.log(
      '📡 [Cookie Debugger] Response headers:',
      Object.fromEntries(response.headers.entries()),
    );

    const data: unknown = await response.json();
    console.log('📡 [Cookie Debugger] Response body:', data);

    if (isAuthSessionResponse(data) && data.authenticated) {
      console.log('✅ [Cookie Debugger] User is authenticated');
      const normalizedUser = normalizeAuthUser(data);
      console.log('👤 [Cookie Debugger] User data:', normalizedUser);
    } else {
      console.warn('⚠️ [Cookie Debugger] User is NOT authenticated');
      if (isAuthSessionResponse(data) && data.message) {
        console.warn('⚠️ [Cookie Debugger] Message:', data.message);
      }
    }
  } catch (error) {
    console.error('❌ [Cookie Debugger] Request failed:', error);
  }
}

/**
 * Test logout endpoint
 */
export async function testLogoutEndpoint(): Promise<void> {
  const apiBase = import.meta.env.VITE_API_BASE || 'https://api.ddcn41.com';
  const url = `${apiBase}/v2/auth/logout`;

  console.log(`🧪 [Cookie Debugger] Testing ${url}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    console.log('📡 [Cookie Debugger] Logout response status:', response.status);
    console.log('📡 [Cookie Debugger] Set-Cookie headers:', response.headers.get('set-cookie'));

    const data: unknown = await response.json();
    console.log('📡 [Cookie Debugger] Logout response body:', data);
  } catch (error) {
    console.error('❌ [Cookie Debugger] Logout request failed:', error);
  }
}
