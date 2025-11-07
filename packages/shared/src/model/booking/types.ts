import type { ApiResponse } from '../common/api';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface BookingSearchParams {
  status?: string;
  page?: number;
  limit?: number;
}

// Backend API Response types (snake_case)
export interface BookingSeatResponse {
  bookingSeatId: number;
  bookingId: number;
  seatId: number;
  seatPrice?: number;
  grade?: string;
  zone?: string;
  rowLabel?: string;
  colNum?: string;
  createdAt?: string;
}

export interface BookingResponse {
  bookingId: number;
  bookingNumber: string;
  userId: number;
  userName?: string;
  userPhone?: string;
  scheduleId: number;
  performanceTitle?: string;
  venueName?: string;
  showDate?: string;
  seatCount?: number;
  totalAmount?: number;
  seats?: BookingSeatResponse[];
  seatCodes?: string[];
  seatCode?: string;
  seatZone?: string;
  status?: BookingStatus;
  expiresAt?: string;
  bookedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Frontend DTO types (camelCase)
export interface BookingSeatDto {
  bookingSeatId: number;
  bookingId: number;
  seatId: number;
  seatPrice?: number;
  grade?: string;
  zone?: string;
  rowLabel?: string;
  colNum?: string;
  createdAt?: string;
}

export interface BookingDto {
  bookingId: number;
  bookingNumber: string;
  userId: number;
  userName?: string;
  userPhone?: string;
  scheduleId: number;
  performanceTitle?: string;
  venueName?: string;
  showDate?: string;
  seatCount?: number;
  totalAmount?: number;
  seats?: BookingSeatDto[];
  seatCodes?: string[];
  seatCode?: string;
  seatZone?: string;
  status?: BookingStatus;
  expiresAt?: string;
  bookedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Booking = BookingDto;

export interface AdminBooking extends BookingDto {
  userEmail?: string;
}

export interface GetBookings200ResponseDto {
  bookings: BookingDto[];
  total?: number;
  page?: number;
}

export type GetBookingDetail200ResponseDto = BookingDto;

export interface CancelBooking200ResponseDto {
  message?: string;
  bookingId: number;
  status: string;
  cancelledAt?: string;
  refundAmount?: number;
}

export interface SeatSelectorDto {
  grade: string;
  zone: string;
  rowLabel: string;
  colNum: string;
}

export interface CreateBookingRequestDto {
  scheduleId: number;
  seats: SeatSelectorDto[];
  queueToken?: string;
}

export interface CancelBookingRequestDto {
  reason: string;
}

export interface CreateBookingResponseDto {
  bookingId: number;
  bookingNumber: string;
  userId: number;
  scheduleId: number;
  seatCount: number;
  totalAmount: number;
  status: string;
  expiresAt?: string;
  bookedAt?: string;
  seats: BookingSeatDto[];
}

export type ApiResponseBooking = ApiResponse<BookingDto>;
export type ApiResponseBookingList = ApiResponse<GetBookings200ResponseDto>;
export type ApiResponseBookingDetail = ApiResponse<GetBookingDetail200ResponseDto>;
export type ApiResponseCancelBooking = ApiResponse<CancelBooking200ResponseDto>;
export type ApiResponseCreateBooking = ApiResponse<CreateBookingResponseDto>;

// Transformer functions
export function transformBookingSeat(response: BookingSeatResponse): BookingSeatDto {
  return {
    bookingSeatId: response.bookingSeatId,
    bookingId: response.bookingId,
    seatId: response.seatId,
    seatPrice: response.seatPrice,
    grade: response.grade,
    zone: response.zone,
    rowLabel: response.rowLabel,
    colNum: response.colNum,
    createdAt: response.createdAt,
  };
}

export function transformBooking(response: BookingResponse): BookingDto {
  return {
    bookingId: response.bookingId,
    bookingNumber: response.bookingNumber,
    userId: response.userId,
    userName: response.userName,
    userPhone: response.userPhone,
    scheduleId: response.scheduleId,
    performanceTitle: response.performanceTitle,
    venueName: response.venueName,
    showDate: response.showDate,
    seatCount: response.seatCount,
    totalAmount: response.totalAmount,
    seats: response.seats?.map(transformBookingSeat),
    seatCodes: response.seatCodes,
    seatCode: response.seatCode,
    seatZone: response.seatZone,
    status: response.status,
    expiresAt: response.expiresAt,
    bookedAt: response.bookedAt,
    cancelledAt: response.cancelledAt,
    cancellationReason: response.cancellationReason,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}
