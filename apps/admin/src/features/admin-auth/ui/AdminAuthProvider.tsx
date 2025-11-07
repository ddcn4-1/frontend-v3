import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useAuthState } from '@/shared/lib/auth';
import { commonConfig } from '@/shared/config';
import { AdminAuthContext, type AdminAuthContextValue } from '../model/context';

interface AdminAuthProviderProps {
  children: ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const accountsLoginUrl = `${commonConfig.urls.accounts}${commonConfig.routes.accountsLogin}`;
  const logoutUri = typeof window !== 'undefined' ? window.location.origin : undefined;

  const { user, loading, loadUser, logout, refetchUser } = useAuthState({
    logoutUri,
    onUnauthenticated: () => {
      console.warn('[Admin] Not authenticated - redirecting to login');
      if (typeof window !== 'undefined') {
        window.location.href = accountsLoginUrl;
      }
    },
    onAuthError: () => {
      console.warn('[Admin] Auth error - redirecting to login');
      if (typeof window !== 'undefined') {
        window.location.href = accountsLoginUrl;
      }
    },
  });

  const hasInitialised = useRef(false);

  useEffect(() => {
    if (hasInitialised.current) {
      return;
    }
    hasInitialised.current = true;
    loadUser().catch((error) => {
      console.error('[Admin] Failed to load user:', error);
    });
  }, [loadUser]);

  const contextValue = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      loading,
      logout,
      refetchUser,
    }),
    [user, loading, logout, refetchUser],
  );

  return <AdminAuthContext.Provider value={contextValue}>{children}</AdminAuthContext.Provider>;
}
