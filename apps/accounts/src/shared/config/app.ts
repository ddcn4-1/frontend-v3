/**
 * Accounts App Configuration
 * FSD v2.1: Shared Layer - Config Segment
 *
 * Exposes runtime configuration that can be safely consumed across layers.
 */

import { commonConfig } from '@packages/shared/config/common';

const ensureString = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return fallback;
};

const appUrlEnv: unknown = import.meta.env.VITE_APP_URL;
const cognitoUserPoolIdEnv: unknown = import.meta.env.VITE_COGNITO_USER_POOL_ID;

export const appConfig = {
  // App-specific URL
  appUrl: ensureString(appUrlEnv, commonConfig.urls.accounts),

  // Common URLs from shared config
  clientUrl: commonConfig.urls.client,
  adminUrl: commonConfig.urls.admin,

  // API from shared config
  apiBase: commonConfig.apiBase,

  // Cognito (for display only) - app-specific
  cognitoUserPoolId: ensureString(cognitoUserPoolIdEnv, 'ap-northeast-2_U5OVPrFCS'),

  // Cookie from shared config
  cookieDomain: commonConfig.cookieDomain,

  // Routes
  routes: {
    login: commonConfig.routes.accountsLogin,
    select: commonConfig.routes.accountsSelect,
  },
} as const;
