/**
 * Shared API configuration
 * Centralises endpoint prefixes and allows services to override base URLs/timeouts.
 */

import { API_BASE } from '../api/client';
import { commonConfig } from './common';

type ApiEndpointMap = Record<string, string>;

interface ServiceConfig {
  BASE_URL?: string;
  TIMEOUT?: number;
  ENDPOINTS?: ApiEndpointMap;
}

interface ServicesConfig {
  ASG?: ServiceConfig;
}

const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 10000);

const ENDPOINT_PREFIX = import.meta.env.VITE_API_PREFIX ?? '/v1';

const buildEndpoint = (segment: string) => `${ENDPOINT_PREFIX}${segment}`;

const ENDPOINTS: ApiEndpointMap = {
  PERFORMANCES: buildEndpoint('/performances'),
  ADMIN_PERFORMANCES: buildEndpoint('/admin/performances'),
  VENUES: buildEndpoint('/venues'),
  USERS: buildEndpoint('/admin/users'),
  PUBLIC_USERS: buildEndpoint('/public/users'),
  BOOKINGS: buildEndpoint('/bookings'),
  ADMIN_BOOKINGS: buildEndpoint('/admin/bookings'),
  SEATS: buildEndpoint('/seats'),
  SCHEDULES: buildEndpoint('/schedules'),
  QUEUE: buildEndpoint('/queue'),
  AUTH: buildEndpoint('/auth'),
  ADMIN_AUTH: buildEndpoint('/admin/auth'),
  ASG_OVERVIEW: `${import.meta.env.VITE_ASG_ENDPOINT_PREFIX ?? '/v1/admin/dashboard/overview'}`,
  ASG: `${import.meta.env.VITE_ASG_LIST_PREFIX ?? '/v1/admin/asg'}`,
};

const SERVICES: ServicesConfig = {
  ASG: {
    BASE_URL: import.meta.env.VITE_ASG_API_BASE ?? API_BASE,
    TIMEOUT: Number(import.meta.env.VITE_ASG_API_TIMEOUT ?? DEFAULT_TIMEOUT),
    ENDPOINTS: {
      ASG_OVERVIEW: import.meta.env.VITE_ASG_ENDPOINT_PREFIX ?? '/v1/admin/dashboard/overview',
      ASG: import.meta.env.VITE_ASG_LIST_PREFIX ?? '/v1/admin/asg',
    },
  },
};

export const API_CONFIG = {
  BASE_URL: API_BASE,
  TIMEOUT: DEFAULT_TIMEOUT,
  ENDPOINTS,
  SERVICES,
  common: commonConfig,
} as const;

export function buildApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    return `${API_CONFIG.BASE_URL}/${path}`;
  }
  return `${API_CONFIG.BASE_URL}${path}`;
}

export type ApiConfig = typeof API_CONFIG;
