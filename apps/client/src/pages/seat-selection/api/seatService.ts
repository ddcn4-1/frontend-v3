import { apiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import type {
  ApiResponseSeatAvailabilityResponse,
  SeatLockRequest,
  ApiResponseSeatLockResponse,
  SeatReleaseRequest,
  SeatConfirmRequest,
  ApiResponseBoolean,
  ApiResponseString,
} from '@packages/shared';

export const seatService = {
  async getScheduleSeats(scheduleId: number): Promise<ApiResponseSeatAvailabilityResponse> {
    return apiClient.get<ApiResponseSeatAvailabilityResponse>(
      `${API_CONFIG.ENDPOINTS.SCHEDULES}/${scheduleId}/seats`,
    );
  },

  async lockScheduleSeats(
    scheduleId: number,
    request: SeatLockRequest,
  ): Promise<ApiResponseSeatLockResponse> {
    return apiClient.post<ApiResponseSeatLockResponse>(
      `${API_CONFIG.ENDPOINTS.SCHEDULES}/${scheduleId}/seats/lock`,
      request,
    );
  },

  async releaseScheduleSeats(
    scheduleId: number,
    request: SeatReleaseRequest,
  ): Promise<ApiResponseBoolean> {
    return apiClient.delete<ApiResponseBoolean>(
      `${API_CONFIG.ENDPOINTS.SCHEDULES}/${scheduleId}/seats/lock`,
      request,
    );
  },

  async checkSeatsAvailability(seatIds: number[]): Promise<ApiResponseBoolean> {
    return apiClient.post<ApiResponseBoolean>(
      `${API_CONFIG.ENDPOINTS.SEATS}/check-availability`,
      seatIds,
    );
  },

  async confirmSeats(request: SeatConfirmRequest): Promise<ApiResponseBoolean> {
    return apiClient.post<ApiResponseBoolean>(`${API_CONFIG.ENDPOINTS.SEATS}/confirm`, request);
  },

  async cancelSeats(seatIds: number[]): Promise<ApiResponseBoolean> {
    return apiClient.post<ApiResponseBoolean>(`${API_CONFIG.ENDPOINTS.SEATS}/cancel`, seatIds);
  },

  async cleanupExpiredLocks(): Promise<ApiResponseString> {
    return apiClient.post<ApiResponseString>(`${API_CONFIG.ENDPOINTS.SEATS}/cleanup-expired`);
  },

  async releaseAllUserLocks(userId: number): Promise<ApiResponseString> {
    return apiClient.delete<ApiResponseString>(
      `${API_CONFIG.ENDPOINTS.PUBLIC_USERS}/${userId}/seat-locks`,
    );
  },
};
