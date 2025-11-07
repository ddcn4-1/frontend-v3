/**
 * useLoginPage Hook
 * FSD v2.1: Pages Layer - Login Page Logic
 */

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth, requestLogin, type LoginRequest, HttpError } from '@packages/shared';
import { useNavigate } from 'react-router-dom';
import { appConfig } from '@shared/config';

interface LoginState {
  username: string;
  password: string;
  isLoading: boolean;
}

export function useLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [loginState, setLoginState] = useState<LoginState>({
    username: '',
    password: '',
    isLoading: false,
  });

  const [errorMessage, setErrorMessage] = useState<string>('');

  // Redirect to /select if already logged in
  useEffect(() => {
    if (!auth.loading && auth.user) {
      console.log('[Login] User already authenticated, redirecting to /select');
      navigate('/select', { replace: true });
    }
  }, [auth.loading, auth.user, navigate]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginState((prev) => ({ ...prev, username: e.target.value }));
    setErrorMessage('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginState((prev) => ({ ...prev, password: e.target.value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setLoginState((prev) => ({ ...prev, isLoading: true }));

    try {
      console.log('[Login] Attempting login...');

      const credentials: LoginRequest = {
        username: loginState.username,
        password: loginState.password,
      };

      const response = await requestLogin(credentials);
      console.log('[Login] Login successful:', response.user);

      // Refetch user state to update AuthProvider
      await auth.refetchUser();

      // Role-based routing
      const userGroups = response.user.groups || [];
      const isAdmin = userGroups.some((group) => group.toLowerCase() === 'admin');

      if (isAdmin) {
        // Admin users stay on /select page
        console.log('[Login] Admin user detected, navigating to /select');
        navigate('/select', { replace: true });
      } else {
        // Regular users redirect to client app
        console.log('[Login] Regular user detected, redirecting to client app');
        window.location.href = appConfig.clientUrl;
      }
    } catch (error: unknown) {
      console.error('[Login] Login failed:', error);

      const httpError = error instanceof HttpError ? error : null;
      const message = httpError?.message ?? (error as Error | undefined)?.message;

      // Handle specific error codes
      if (httpError?.status === 401) {
        if (message?.includes('Incorrect username or password')) {
          setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (message?.includes('User not found')) {
          setErrorMessage('존재하지 않는 사용자입니다.');
        } else if (message?.includes('email not verified')) {
          setErrorMessage('이메일 인증이 필요합니다. 이메일을 확인해주세요.');
        } else {
          setErrorMessage('인증에 실패했습니다. 다시 시도해주세요.');
        }
      } else if (httpError?.status === 400) {
        setErrorMessage('입력 정보를 확인해주세요.');
      } else {
        setErrorMessage('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoginState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Quick fill function for development
  const handleQuickFill = (username: string, password: string) => {
    setLoginState({ username, password, isLoading: false });
    setErrorMessage('');
  };

  return {
    auth,
    loginState,
    handleUsernameChange,
    handlePasswordChange,
    handleSubmit,
    handleQuickFill,
    errorMessage,
  };
}
