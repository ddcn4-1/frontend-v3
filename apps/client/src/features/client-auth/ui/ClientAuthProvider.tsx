import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useAuthState } from '@/shared/lib/auth';
import { commonConfig } from '@/shared/config';
import { ClientAuthContext, type ClientAuthContextValue } from '../model/context';

interface ClientAuthProviderProps {
  children: ReactNode;
}

export function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  const { user, loading, loadUser, logout, refetchUser } = useAuthState({
    logoutUri: window.location.origin,
    onUnauthenticated: () => {
      console.log('[Client] Not authenticated - anonymous mode');
    },
    onAuthError: () => {
      console.warn('[Client] Auth error - staying on page');
    },
  });

  const hasInitialised = useRef(false);

  useEffect(() => {
    if (hasInitialised.current) {
      return;
    }
    hasInitialised.current = true;
    void loadUser();
  }, [loadUser]);

  const login = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    const accountsLoginUrl = `${commonConfig.urls.accounts}${commonConfig.routes.accountsLogin}`;
    window.location.href = `${accountsLoginUrl}?returnUrl=${returnUrl}`;
  };

  const contextValue = useMemo<ClientAuthContextValue>(
    () => ({
      user,
      loading,
      logout,
      refetchUser,
      login,
    }),
    [user, loading, logout, refetchUser],
  );

  return <ClientAuthContext.Provider value={contextValue}>{children}</ClientAuthContext.Provider>;
}
