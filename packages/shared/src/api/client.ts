/**
 * HTTP client for API communication with external AWS Lambda endpoints
 * FSD v2.1: Shared - API Layer
 *
 * Features:
 * - Cookie-based authentication (credentials: include)
 * - CORS support with api.ddcn41.com
 * - Timeout and error handling
 * - Request/response logging
 */

// Re-export DRY refactored HTTP client
export {
  API_BASE,
  HttpError,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  isAuthError,
  isServerError,
} from './http-client';
export type { FetchOptions } from './http-client';

// Import types for usage in apiClient
import type { FetchOptions } from './http-client';
import { API_BASE, apiGet, apiPost, apiPut, apiPatch, apiDelete } from './http-client';

/**
 * Shared API client instance
 * Provides consistent interface for API communication
 */
export const apiClient = {
  /**
   * GET request with credentials
   */
  get: <T>(path: string, options?: FetchOptions): Promise<T> => {
    return apiGet<T>(path, options);
  },

  /**
   * POST request with credentials
   */
  post: <T>(path: string, body?: unknown, options?: FetchOptions): Promise<T> => {
    return apiPost<T>(path, body, options);
  },

  /**
   * PUT request with credentials
   */
  put: <T>(path: string, body: unknown, options?: FetchOptions): Promise<T> => {
    return apiPut<T>(path, body, options);
  },

  /**
   * PATCH request with credentials
   */
  patch: <T>(path: string, body: unknown, options?: FetchOptions): Promise<T> => {
    return apiPatch<T>(path, body, options);
  },

  /**
   * DELETE request with credentials
   */
  delete: <T>(path: string, body?: unknown, options?: FetchOptions): Promise<T> => {
    return apiDelete<T>(path, body, options);
  },

  /**
   * Get base URL
   */
  getBaseUrl: (): string => API_BASE,
};
