import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type {
  BookingDto,
  BookingResponse,
  BookingSeatDto,
  BookingSeatResponse,
  BookingSearchParams,
  CancelBooking200ResponseDto,
  CancelBookingRequestDto,
  CreateBookingRequestDto,
  CreateBookingResponseDto,
  GetBookingDetail200ResponseDto,
  GetBookings200ResponseDto,
} from '../../model/booking/types';
import { transformBooking, transformBookingSeat } from '../../model/booking/types';

interface BookingListResponse {
  bookings: BookingResponse[];
  total?: number;
  page?: number;
}

const buildSeatCode = (seat: BookingSeatDto | BookingSeatResponse): string => {
  const row = seat.rowLabel ?? '';
  const col = seat.colNum ?? '';
  const code = `${row}${col}`.trim();
  return code.length > 0 ? code : '';
};

const parseSeatCodeString = (seatCode?: string | null): string[] => {
  if (!seatCode) return [];

  return seatCode
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

const toSeatDto = (seat: BookingSeatDto | BookingSeatResponse): BookingSeatDto => {
  return 'bookingSeatId' in seat && 'seatId' in seat
    ? transformBookingSeat(seat)
    : (seat as BookingSeatDto);
};

const toBookingDto = (booking: BookingResponse | BookingDto): BookingDto => {
  return 'bookingNumber' in booking && 'seatCodes' in booking
    ? (booking as BookingDto)
    : transformBooking(booking as BookingResponse);
};

const normalizeSeatCodes = (
  booking: BookingDto,
  original?: BookingResponse | BookingDto,
): string[] => {
  const seats = original?.seats ?? booking.seats;
  const seatCodesFromSeats =
    seats?.map((seat) => buildSeatCode(toSeatDto(seat))).filter((code) => code.length > 0) ?? [];

  if (seatCodesFromSeats.length > 0) {
    return seatCodesFromSeats;
  }

  if (booking.seatCodes && booking.seatCodes.length > 0) {
    return booking.seatCodes;
  }

  return parseSeatCodeString(booking.seatCode);
};

const computeSeatCount = (booking: BookingDto, seatCodes: string[]): number => {
  if (typeof booking.seatCount === 'number' && booking.seatCount > 0) {
    return booking.seatCount;
  }

  if (Array.isArray(booking.seats) && booking.seats.length > 0) {
    return booking.seats.length;
  }

  return seatCodes.length;
};

const normalizeBooking = (booking: BookingResponse | BookingDto): BookingDto => {
  const dto = toBookingDto(booking);
  const seatCodes = normalizeSeatCodes(dto, booking);

  return {
    ...dto,
    seats: dto.seats?.map(toSeatDto) ?? [],
    seatCodes,
    seatCode: seatCodes.length > 0 ? seatCodes.join(', ') : (dto.seatCode ?? ''),
    seatCount: computeSeatCount(dto, seatCodes),
  };
};

const buildQueryString = (params?: BookingSearchParams): string => {
  if (!params) return '';

  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (typeof params.page === 'number') searchParams.append('page', params.page.toString());
  if (typeof params.limit === 'number') searchParams.append('limit', params.limit.toString());

  return searchParams.toString();
};

const fetchBookingList = async (endpoint: string, params?: BookingSearchParams) => {
  const query = buildQueryString(params);
  const url = query.length > 0 ? `${endpoint}?${query}` : endpoint;

  const response = await apiClient.get<BookingListResponse>(url);

  return {
    ...response,
    bookings: (response.bookings ?? []).map(normalizeBooking),
  } satisfies GetBookings200ResponseDto;
};

const fetchBookingDetail = async (endpoint: string): Promise<GetBookingDetail200ResponseDto> => {
  const response = await apiClient.get<BookingResponse>(endpoint);
  return normalizeBooking(response);
};

export const bookingService = {
  async getBookings(params?: BookingSearchParams): Promise<GetBookings200ResponseDto> {
    const endpoint = `${API_CONFIG.ENDPOINTS.BOOKINGS}/me`;
    return fetchBookingList(endpoint, params);
  },

  async createBooking(bookingData: CreateBookingRequestDto): Promise<CreateBookingResponseDto> {
    return apiClient.post<CreateBookingResponseDto>(API_CONFIG.ENDPOINTS.BOOKINGS, bookingData);
  },

  async getBookingDetail(bookingId: number): Promise<GetBookingDetail200ResponseDto> {
    return fetchBookingDetail(`${API_CONFIG.ENDPOINTS.BOOKINGS}/${bookingId}`);
  },

  async cancelBooking(
    bookingId: number,
    request?: CancelBookingRequestDto,
  ): Promise<CancelBooking200ResponseDto> {
    return apiClient.patch<CancelBooking200ResponseDto>(
      `${API_CONFIG.ENDPOINTS.BOOKINGS}/${bookingId}/cancel`,
      request,
    );
  },

  async adminGetBookings(params?: BookingSearchParams): Promise<GetBookings200ResponseDto> {
    return fetchBookingList(API_CONFIG.ENDPOINTS.ADMIN_BOOKINGS, params);
  },

  async adminGetBookingDetail(bookingId: number): Promise<GetBookingDetail200ResponseDto> {
    return fetchBookingDetail(`${API_CONFIG.ENDPOINTS.ADMIN_BOOKINGS}/${bookingId}`);
  },
};

export type BookingService = typeof bookingService;
