export * from './auth';
export {
  getAllCookies,
  logCookies,
  checkAuthCookies,
  logAuthState,
  testAuthMeEndpoint,
  testLogoutEndpoint,
} from '@packages/shared/lib/debug';
export type { CookieInfo } from '@packages/shared/lib/debug';

// Shared formatters and utilities
export { formatDate, formatPrice } from './formatters';
export { getStatusColor, getRoleColor, getPaymentStatusColor } from './badge-variants';
