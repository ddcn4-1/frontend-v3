/**
 * Admin App Configuration
 * FSD v2.1: App Layer - Config
 */

import { commonConfig } from '@/shared/config';

const ensureString = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return fallback;
};

const appUrlEnv: unknown = import.meta.env.VITE_APP_URL;

const accountsUrl = ensureString(commonConfig.urls.accounts, 'https://local.accounts.ddcn41.com');
const clientUrl = ensureString(commonConfig.urls.client, 'https://local.ddcn41.com');
const adminUrl = ensureString(commonConfig.urls.admin, 'https://local.admin.ddcn41.com');
const apiBase = ensureString(commonConfig.apiBase, 'https://api.ddcn41.com');
const cookieDomain = ensureString(commonConfig.cookieDomain, '.ddcn41.com');
const homeRoute = ensureString(commonConfig.routes.home, '/');
const accountsSelectRoute = ensureString(commonConfig.routes.accountsSelect, '/select');

export const appConfig = {
  // App-specific URL
  appUrl: ensureString(appUrlEnv, adminUrl),

  // Common URLs from shared config
  accountsUrl,
  clientUrl,

  // API from shared config
  apiBase,

  // Cookie from shared config
  cookieDomain,

  // Routes
  routes: {
    home: homeRoute,
    accountsSelect: accountsSelectRoute,
  },
} as const;
