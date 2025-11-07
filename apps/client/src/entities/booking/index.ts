/**
 * Booking Entity
 * FSD v2.1: entities/booking/index.ts
 */

// Re-export types
export type { Booking, BookingDto, AdminBooking } from '@packages/shared';

// API services
export { bookingService } from './api/bookingService';
export type { BookingService } from './api/bookingService';
