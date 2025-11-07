/**
 * Common Configuration
 * FSD v2.1: Shared Layer - Config Segment
 *
 * Shared configuration used across all apps
 */

export const commonConfig = {
  // API
  apiBase: import.meta.env.VITE_API_BASE || 'https://api.ddcn41.com',

  // Cookie
  cookieDomain: import.meta.env.VITE_COOKIE_DOMAIN || '.ddcn41.com',

  // Common App URLs
  urls: {
    accounts: import.meta.env.VITE_ACCOUNTS_URL || 'https://local.accounts.ddcn41.com',
    client: import.meta.env.VITE_CLIENT_URL || 'https://local.ddcn41.com',
    admin: import.meta.env.VITE_ADMIN_URL || 'https://local.admin.ddcn41.com',
  },

  // Common Routes
  routes: {
    accountsLogin: '/login',
    accountsSelect: '/select',
    home: '/',
  },
} as const;
