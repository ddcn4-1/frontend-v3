export type ScheduleStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'ENDED'
  | 'SOLDOUT'
  | 'UPCOMING';

// Backend API Response types (snake_case)
export interface PerformanceScheduleResponse {
  scheduleId: number;
  showDatetime: string;
  availableSeats?: number | null;
  totalSeats?: number | null;
  status?: ScheduleStatus;
  basePrice?: number | null;
}

export interface PerformanceResponse {
  performanceId: number;
  title: string;
  venue: string;
  venueName?: string;
  venueId?: number;
  theme?: string;
  posterUrl?: string;
  price?: number;
  basePrice?: number;
  status?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  runningTime?: number | null;
  venueAddress?: string | null;
  schedules?: PerformanceScheduleResponse[];
  totalBookings?: number;
  revenue?: number;
}

// Frontend DTO types (camelCase)
export interface PerformanceScheduleDto {
  scheduleId: number;
  showDatetime: string;
  availableSeats?: number | null;
  totalSeats?: number | null;
  status?: ScheduleStatus;
  basePrice?: number | null;
}

export interface PerformanceDto {
  performanceId: number;
  title: string;
  venue: string;
  venueName?: string;
  venueId?: number;
  theme?: string;
  posterUrl?: string;
  price?: number;
  basePrice?: number;
  status?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  runningTime?: number | null;
  venueAddress?: string | null;
  schedules?: PerformanceScheduleDto[];
  totalBookings?: number;
  revenue?: number;
}

// Legacy alias for backward compatibility
export type Performance = PerformanceDto;
export type PerformanceSchedule = PerformanceScheduleDto;

export interface PerformanceRequest {
  venueId: number;
  title: string;
  description?: string;
  theme?: string;
  posterUrl?: string;
  startDate: string;
  endDate: string;
  runningTime?: number;
  basePrice?: number;
  status?: string;
  schedules?: {
    scheduleId?: number;
    showDatetime: string;
    totalSeats?: number;
    availableSeats?: number;
    status?: ScheduleStatus;
  }[];
}

export interface AdminPerformanceResponse {
  performanceResponse: PerformanceResponse;
  revenue?: number;
  totalBookings?: number;
}

// Transformer functions
export function transformPerformanceSchedule(
  response: PerformanceScheduleResponse,
): PerformanceScheduleDto {
  return {
    scheduleId: response.scheduleId,
    showDatetime: response.showDatetime,
    availableSeats: response.availableSeats,
    totalSeats: response.totalSeats,
    status: response.status,
    basePrice: response.basePrice,
  };
}

export function transformPerformance(response: PerformanceResponse): PerformanceDto {
  return {
    performanceId: response.performanceId,
    title: response.title,
    venue: response.venue,
    venueName: response.venueName,
    venueId: response.venueId,
    theme: response.theme,
    posterUrl: response.posterUrl,
    price: response.price,
    basePrice: response.basePrice,
    status: response.status,
    description: response.description,
    startDate: response.startDate,
    endDate: response.endDate,
    runningTime: response.runningTime,
    venueAddress: response.venueAddress,
    schedules: response.schedules?.map(transformPerformanceSchedule),
    totalBookings: response.totalBookings,
    revenue: response.revenue,
  };
}
