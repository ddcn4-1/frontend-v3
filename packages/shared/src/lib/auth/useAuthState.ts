/**
 * Authentication state management hook
 * FSD v2.1: Shared - Library Layer
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { isAuthError } from '../../api/client';
import type { AuthUser } from '../../model/auth';
import { getCurrentUser, normalizeAuthUser, requestLogout } from '../../api/endpoints/auth';
import { redirectToCognitoLogout } from '../../config/cognito';

export interface UseAuthStateOptions {
  /**
   * Callback when user is not authenticated
   */
  onUnauthenticated?: () => void;
  /**
   * Callback when authentication fails with error
   */
  onAuthError?: (error: unknown) => void;
  /**
   * Custom logout URI for Cognito redirect
   */
  logoutUri?: string;
}

export interface UseAuthStateReturn {
  user: AuthUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

/**
 * Shared auth state management hook
 * Can be used by apps to build custom AuthProviders
 */
export function useAuthState(options: UseAuthStateOptions = {}): UseAuthStateReturn {
  const { onUnauthenticated, onAuthError, logoutUri } = options;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const onUnauthenticatedRef = useRef(onUnauthenticated);
  const onAuthErrorRef = useRef(onAuthError);

  useEffect(() => {
    onUnauthenticatedRef.current = onUnauthenticated;
  }, [onUnauthenticated]);

  useEffect(() => {
    onAuthErrorRef.current = onAuthError;
  }, [onAuthError]);

  const loadUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();

      const normalizedUser = normalizeAuthUser(response);

      if (!normalizedUser) {
        setUser(null);
        onUnauthenticatedRef.current?.();
        return;
      }

      setUser(normalizedUser);
    } catch (error) {
      if (isAuthError(error)) {
        setUser(null);
        onAuthErrorRef.current?.(error);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await requestLogout();
    } finally {
      setUser(null);
      redirectToCognitoLogout(logoutUri);
    }
  }, [logoutUri]);

  const refetchUser = useCallback(async () => {
    setLoading(true);
    await loadUser();
  }, [loadUser]);

  return {
    user,
    loading,
    setUser,
    setLoading,
    loadUser,
    logout,
    refetchUser,
  };
}
