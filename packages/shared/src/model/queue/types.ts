import type { ApiResponse } from '../common/api';

export type QueueTokenStatus = 'WAITING' | 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface HeartbeatRequest {
  performanceId: number;
  scheduleId: number;
}

export interface TokenIssueRequest {
  performanceId: number;
}

export interface TokenActivateRequest {
  token: string;
  performanceId: number;
  scheduleId: number;
}

export interface SessionReleaseRequest {
  performanceId: number;
  scheduleId: number;
  userId?: number;
  reason?: string;
}

export interface QueueStatusResponse {
  token: string;
  status: QueueTokenStatus;
  positionInQueue?: number | null;
  estimatedWaitTime?: number | null;
  isActiveForBooking?: boolean;
  bookingExpiresAt?: string | null;
  performanceTitle?: string | null;
}

export interface QueueCheckResponse {
  requiresQueue: boolean;
  canProceedDirectly: boolean;
  sessionId?: string;
  message?: string;
  currentActiveSessions?: number;
  maxConcurrentSessions?: number;
  estimatedWaitTime?: number;
  currentWaitingCount?: number;
  reason?: string;
}

export interface TokenIssueResponse {
  token: string;
  status: QueueTokenStatus;
  queuePosition?: number;
  estimatedWaitTime?: number;
}

export type ApiResponseQueueCheck = ApiResponse<QueueCheckResponse>;
export type ApiResponseQueueStatus = ApiResponse<QueueStatusResponse>;
export type ApiResponseQueueStatusList = ApiResponse<QueueStatusResponse[]>;
export type ApiResponseTokenIssue = ApiResponse<TokenIssueResponse>;
