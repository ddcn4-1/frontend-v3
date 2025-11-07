/**
 * Client App Configuration
 * FSD v2.1: App Layer - Config
 */

import { commonConfig } from '@/shared/config';

export const appConfig = {
  // App-specific URL
  appUrl: import.meta.env.VITE_APP_URL || commonConfig.urls.client,

  // Common URLs from shared config
  accountsUrl: commonConfig.urls.accounts,
  adminUrl: commonConfig.urls.admin,

  // API from shared config
  apiBase: commonConfig.apiBase,

  // Cookie from shared config
  cookieDomain: commonConfig.cookieDomain,

  // Routes
  routes: {
    home: commonConfig.routes.home,
    accountsSelect: commonConfig.routes.accountsSelect,
  },
} as const;
