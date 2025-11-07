import { createContext, useContext } from 'react';
import type { AuthContextValue } from '@/shared/lib/auth';

export type AdminAuthContextValue = AuthContextValue;

export const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
