import { apiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import type {
  AdminPerformanceResponse,
  PerformanceDto,
  PerformanceRequest,
} from '@packages/shared';
import { transformPerformance } from '@packages/shared';

interface PresignedUrlResponse {
  presignedUrl: string;
  imageKey: string;
}

const transformAdminPerformance = (response: AdminPerformanceResponse): PerformanceDto => {
  const base = transformPerformance(response.performanceResponse);

  return {
    ...base,
    description: base.description ?? 'default text',
    posterUrl: base.posterUrl ?? '',
    theme: base.theme ?? '',
    price: base.price ?? 0,
    basePrice: base.basePrice ?? base.price ?? 0,
    status: base.status ?? 'UPCOMING',
    runningTime: base.runningTime ?? 0,
    venueName: base.venueName ?? base.venue,
    totalBookings: response.totalBookings ?? base.totalBookings,
    revenue: response.revenue ?? base.revenue,
  };
};

const uploadImage = async (image: File | null): Promise<string> => {
  if (!image) return '';

  const presignedResponse = await apiClient.post<PresignedUrlResponse>(
    `${API_CONFIG.ENDPOINTS.ADMIN_PERFORMANCES}/upload-url`,
    {
      imageName: image.name,
      imageType: image.type,
    },
  );

  const uploadResult = await fetch(presignedResponse.presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': image.type,
    },
    body: image,
  });

  if (!uploadResult.ok) {
    throw new Error('파일 업로드 실패');
  }

  return presignedResponse.imageKey;
};

export const adminPerformanceService = {
  async getPerformances(): Promise<PerformanceDto[]> {
    try {
      const response = await apiClient.get<AdminPerformanceResponse[]>(
        API_CONFIG.ENDPOINTS.ADMIN_PERFORMANCES,
      );

      if (!Array.isArray(response)) {
        return [];
      }

      return response.map(transformAdminPerformance);
    } catch (error) {
      console.error('Failed to fetch admin performances:', error);
      return [];
    }
  },

  async createPerformance(
    payload: PerformanceRequest,
    image: File | null,
  ): Promise<PerformanceDto | undefined> {
    try {
      const posterKey = await uploadImage(image);
      const response = await apiClient.post<AdminPerformanceResponse>(
        API_CONFIG.ENDPOINTS.ADMIN_PERFORMANCES,
        {
          ...payload,
          posterUrl: posterKey,
        },
      );

      return transformAdminPerformance(response);
    } catch (error) {
      console.error('Failed to create performance:', error);
      return undefined;
    }
  },

  async updatePerformance(
    performanceId: number,
    payload: PerformanceRequest,
    image: File | null,
  ): Promise<PerformanceDto | undefined> {
    try {
      const posterKey = await uploadImage(image);
      const response = await apiClient.put<AdminPerformanceResponse>(
        `${API_CONFIG.ENDPOINTS.ADMIN_PERFORMANCES}/${performanceId}`,
        {
          ...payload,
          posterUrl: posterKey,
        },
      );

      return transformAdminPerformance(response);
    } catch (error) {
      console.error('Failed to update performance:', error);
      return undefined;
    }
  },

  async deletePerformance(performanceId: number): Promise<boolean> {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.ADMIN_PERFORMANCES}/${performanceId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete performance:', error);
      return false;
    }
  },
};

export type AdminPerformanceService = typeof adminPerformanceService;
