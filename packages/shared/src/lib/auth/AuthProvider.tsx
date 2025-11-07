/**
 * Authentication context provider
 * FSD v2.1: Shared - Library Layer
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser } from '../../model/auth';
import { getCurrentUser, normalizeAuthUser, requestLogout } from '../../api/endpoints/auth';
import { redirectToCognitoLogout } from '../../config/cognito';

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUserState = useCallback(async () => {
    try {
      const authMeResponse = await getCurrentUser();
      const normalizedUser = normalizeAuthUser(authMeResponse);

      if (!normalizedUser) {
        setUser(null);
        return;
      }

      setUser(normalizedUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasInitialised = useRef(false);

  useEffect(() => {
    if (hasInitialised.current) {
      return;
    }
    hasInitialised.current = true;
    void loadCurrentUserState();
  }, [loadCurrentUserState]);

  const logout = useCallback(async () => {
    try {
      // Lambda 로그아웃 API 호출 (GlobalSignOut + .ddcn41.com 쿠키 삭제)
      const response = await requestLogout();
      setUser(null);

      // Lambda에서 반환한 Cognito logout URL 사용 (우선순위 1)
      // 없으면 환경 변수 기반 URL 사용 (fallback)
      if (response.cognitoLogoutUrl) {
        window.location.href = response.cognitoLogoutUrl;
      } else {
        redirectToCognitoLogout();
      }
    } catch (error) {
      // 에러 발생 시에도 로컬 상태 정리 및 Cognito 로그아웃 시도
      console.error('[AuthProvider] Logout error:', error);
      setUser(null);
      redirectToCognitoLogout();
    }
  }, []);

  const refetchUser = useCallback(async () => {
    setLoading(true);
    await loadCurrentUserState();
  }, [loadCurrentUserState]);

  const contextValue = useMemo(
    () => ({ user, loading, logout, refetchUser }),
    [user, loading, logout, refetchUser],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
