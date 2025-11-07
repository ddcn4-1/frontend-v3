import { createContext, useContext } from 'react';
import type { AuthContextValue } from '@/shared/lib/auth';

export interface ClientAuthContextValue extends AuthContextValue {
  login: () => void;
}

export const ClientAuthContext = createContext<ClientAuthContextValue | undefined>(undefined);

export function useClientAuth(): ClientAuthContextValue {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within ClientAuthProvider');
  }
  return context;
}
