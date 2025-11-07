import { apiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import type {
  Performance,
  PerformanceDto,
  PerformanceSchedule,
  PerformanceScheduleDto,
} from '@packages/shared';

// Backend now returns camelCase directly, so we don't need transformation
// Just add some enhancements for backward compatibility
const enhancePerformance = (response: PerformanceDto): Performance => {
  return {
    ...response,
    description: response.description ?? response.theme ?? '',
    venueName: response.venueName ?? response.venue ?? '',
    basePrice: response.basePrice ?? response.price ?? 0,
  };
};

const enhanceSchedule = (schedule: PerformanceScheduleDto): PerformanceSchedule => {
  return {
    ...schedule,
    totalSeats: schedule.totalSeats ?? 0,
  };
};

export const performanceService = {
  async getPerformanceById(performanceId: number): Promise<Performance> {
    try {
      console.log('API - Requesting performance with ID:', performanceId);

      const endpoint = `${API_CONFIG.ENDPOINTS.PERFORMANCES}/${performanceId}`;
      const backendResponse = await apiClient.get<PerformanceDto>(endpoint);

      console.log('API - Raw backend response:', backendResponse);
      const enhanced = enhancePerformance(backendResponse);
      console.log('API - Enhanced performance:', enhanced);
      return enhanced;
    } catch (error) {
      console.error('API - Failed to fetch performance:', error);
      throw error;
    }
  },

  async getPerformanceSchedules(
    performanceId: number,
  ): Promise<{ schedules: PerformanceSchedule[] }> {
    try {
      console.log('API - Requesting schedules for performance ID:', performanceId);

      const endpoint = `${API_CONFIG.ENDPOINTS.PERFORMANCES}/${performanceId}/schedules`;
      const response = await apiClient.get<{ schedules: PerformanceScheduleDto[] }>(endpoint);

      console.log('API - Schedules response:', response);
      return {
        schedules: (response.schedules ?? []).map(enhanceSchedule),
      };
    } catch (error) {
      console.error('API - Failed to fetch schedules:', error);
      throw error;
    }
  },

  async getAllPerformances(): Promise<Performance[]> {
    try {
      const response = await apiClient.get<PerformanceDto[]>(API_CONFIG.ENDPOINTS.PERFORMANCES);
      return response.map(enhancePerformance);
    } catch (error) {
      console.error('API - Failed to fetch performances:', error);
      throw error;
    }
  },

  async searchPerformances(searchParams: {
    name?: string;
    venue?: string;
    status?: string;
  }): Promise<Performance[]> {
    try {
      const queryString = new URLSearchParams(
        Object.entries(searchParams).filter(([_, value]) => value && value.trim() !== ''),
      ).toString();

      const endpoint = queryString
        ? `${API_CONFIG.ENDPOINTS.PERFORMANCES}/search?${queryString}`
        : API_CONFIG.ENDPOINTS.PERFORMANCES;

      const response = await apiClient.get<PerformanceDto[]>(endpoint);
      console.log('searchPerformances - Backend response:', response);
      const enhanced = response.map(enhancePerformance);
      console.log('searchPerformances - Enhanced performances:', enhanced);
      return enhanced;
    } catch (error) {
      console.error('Failed to search performances:', error);
      return [];
    }
  },
};
