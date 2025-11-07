/**
 * Performance Entity
 * FSD v2.1: entities/performance/index.ts
 */

// Re-export types
export type {
  Performance,
  PerformanceRequest,
  PerformanceResponse,
  PerformanceSchedule,
  PerformanceScheduleResponse,
  ScheduleStatus,
  AdminPerformanceResponse,
} from '@packages/shared';

// API services
export { performanceService } from './api/performanceService';
