/**
 * Select page hook
 * FSD v2.1: Pages Layer - Library Segment
 */

import { useEffect, useMemo } from 'react';
import { useAuth } from '@shared/lib/auth';
import { useNavigate } from 'react-router-dom';

export function useSelectPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!auth.loading && !auth.user) {
      navigate('/login', { replace: true });
    }
  }, [auth.loading, auth.user, navigate]);

  // Handle logout and redirect to /login
  const handleLogout = async () => {
    await auth.logout();
    // After Cognito logout redirect, user will end up at /login
  };

  // Check for admin access (case-insensitive)
  const hasAdminAccess = useMemo(() => {
    return auth.user?.groups?.some((group) => group.toLowerCase() === 'admin') || false;
  }, [auth.user?.groups]);

  return {
    auth,
    handleLogout,
    hasAdminAccess,
  };
}
