/**
 * HTTP client utilities - DRY refactored version
 * FSD v2.1: Shared - API Layer
 */

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export interface FetchOptions extends RequestInit {
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Core request handler with timeout and error handling
 * Eliminates duplication across HTTP methods
 */
async function executeRequest<T>(
  method: string,
  path: string,
  options?: FetchOptions,
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timeout = options?.timeout ?? 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: HeadersInit = {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    };

    const requestConfig: RequestInit = {
      method,
      credentials: 'include',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...options,
    };

    // Special handling for POST with empty body
    if (method === 'POST' && body === undefined) {
      const res = await fetch(`${API_BASE}${path}`, {
        ...requestConfig,
        headers: { Accept: 'application/json' },
      });

      // Retry with empty JSON body if API Gateway rejects
      if (!res.ok && (res.status === 400 || res.status === 415)) {
        const retryRes = await fetch(`${API_BASE}${path}`, {
          ...requestConfig,
          headers,
          body: '{}',
        });
        return handleResponse<T>(method, path, retryRes);
      }

      return handleResponse<T>(method, path, res);
    }

    const res = await fetch(`${API_BASE}${path}`, requestConfig);
    return handleResponse<T>(method, path, res);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new HttpError(`${method} ${path} timed out after ${timeout}ms`, 408);
    }
    throw new HttpError(`${method} ${path} network error: ${(error as Error).message}`, 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Handle response parsing and error handling
 */
async function handleResponse<T>(method: string, path: string, res: Response): Promise<T> {
  if (method !== 'GET') {
    console.log(`[HTTP] ${method} ${path} - Status: ${res.status}`);
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[HTTP] ${method} ${path} failed:`, errorText);
    throw new HttpError(
      `${method} ${path} failed: ${res.status} ${res.statusText}`,
      res.status,
      res,
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  // Handle empty content - only check for explicit '0', not null
  const contentLength = res.headers.get('content-length');
  if (contentLength === '0') {
    return undefined as T;
  }

  // Parse JSON response
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const data: unknown = await res.json();
    if (method === 'GET') {
      console.log(`[HTTP] ${method} ${path} - Response data:`, data);
    }
    return data as T;
  }

  // If content-type is not JSON, try to parse anyway for backward compatibility
  try {
    const data: unknown = await res.json();
    return data as T;
  } catch {
    return undefined as T;
  }
}

/**
 * GET request with credentials
 */
export async function apiGet<T>(path: string, options?: FetchOptions): Promise<T> {
  console.log(`[HTTP] GET ${API_BASE}${path} (credentials: include)`);
  return executeRequest<T>('GET', path, options);
}

/**
 * POST request with credentials
 */
export async function apiPost<T>(path: string, body?: unknown, options?: FetchOptions): Promise<T> {
  return executeRequest<T>('POST', path, options, body);
}

/**
 * PUT request with credentials
 */
export async function apiPut<T>(path: string, body: unknown, options?: FetchOptions): Promise<T> {
  return executeRequest<T>('PUT', path, options, body);
}

/**
 * PATCH request with credentials
 */
export async function apiPatch<T>(path: string, body: unknown, options?: FetchOptions): Promise<T> {
  return executeRequest<T>('PATCH', path, options, body);
}

/**
 * DELETE request with credentials
 */
export async function apiDelete<T>(
  path: string,
  body?: unknown,
  options?: FetchOptions,
): Promise<T> {
  return executeRequest<T>('DELETE', path, options, body);
}

/**
 * Check if error is authentication-related (401/403)
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 401 || error.status === 403);
}

/**
 * Check if error is server-related (5xx)
 */
export function isServerError(error: unknown): boolean {
  return error instanceof HttpError && error.status >= 500 && error.status < 600;
}
