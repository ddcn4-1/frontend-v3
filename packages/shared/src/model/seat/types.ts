import type { SeatMapJson } from '../venue/types';
import type { ApiResponse, ApiResponseBoolean, ApiResponseString } from '../common/api';

export interface SeatDto {
  seatId: number;
  scheduleId: number;
  venueSeatId: number;
  seatRow: string;
  seatNumber: string;
  seatZone?: string | null;
  seatGrade?: string | null;
  price?: number;
  status?: string;
}

export type Seat = SeatDto;

export interface SeatAvailabilityResponse {
  scheduleId: number;
  totalSeats?: number;
  availableSeats?: number;
  seats: SeatDto[];
}

export interface SeatLockRequest {
  seatIds: number[];
  userId: number;
  sessionId?: string;
}

export interface SeatReleaseRequest {
  seatIds: number[];
  userId: number;
  sessionId?: string;
}

export interface SeatConfirmRequest {
  seatIds: number[];
  userId: number;
  bookingId: number;
}

export interface SeatLockResponse {
  success: boolean;
  message?: string;
  expiresAt?: string;
}

export type ApiResponseSeatAvailabilityResponse = ApiResponse<SeatAvailabilityResponse>;
export type ApiResponseSeatLockResponse = ApiResponse<SeatLockResponse>;
export type ApiResponseSeatConfirmResponse = ApiResponseBoolean;
export type ApiResponseSeatReleaseResponse = ApiResponseBoolean;
export type ApiResponseSeatCleanupResponse = ApiResponseString;

export interface SeatMapPayload {
  seatMapJson: SeatMapJson;
}
