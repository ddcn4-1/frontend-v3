import { apiClient } from '../client';
import { API_CONFIG } from '../../config/api';
import type { VenueDto } from '../../model/venue/types';

export const venueService = {
  async getAllVenues(): Promise<VenueDto[]> {
    return apiClient.get<VenueDto[]>(API_CONFIG.ENDPOINTS.VENUES);
  },

  async createVenue(venueData: VenueDto): Promise<VenueDto> {
    return apiClient.post<VenueDto>(API_CONFIG.ENDPOINTS.VENUES, venueData);
  },

  async getVenueById(venueId: number): Promise<VenueDto> {
    return apiClient.get<VenueDto>(`${API_CONFIG.ENDPOINTS.VENUES}/${venueId}`);
  },

  async updateVenue(venueId: number, venueData: VenueDto): Promise<VenueDto> {
    return apiClient.put<VenueDto>(`${API_CONFIG.ENDPOINTS.VENUES}/${venueId}`, venueData);
  },

  async deleteVenue(venueId: number): Promise<void> {
    return apiClient.delete<void>(`${API_CONFIG.ENDPOINTS.VENUES}/${venueId}`);
  },

  async getSeatMap<T = unknown>(venueId: number): Promise<T> {
    return apiClient.get<T>(`${API_CONFIG.ENDPOINTS.VENUES}/${venueId}/seatmap`);
  },
};

export type VenueService = typeof venueService;
