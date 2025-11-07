export interface SeatMapJson {
  sections: SeatMapSection[];
  pricing?: Record<string, number>;
  alphabet?: string;
  metadata?: Record<string, unknown>;
}

export interface SeatMapSection {
  name?: string;
  zone?: string | null;
  grade?: string;
  rows: number;
  cols: number;
  rowLabelFrom: string;
  seatStart?: number;
  metadata?: Record<string, unknown>;
}

export interface Venue {
  venue_id: number;
  venue_name: string;
  address?: string;
  description?: string;
  total_capacity?: number;
  contact?: string;
  seat_map_json?: SeatMapJson | string | null;
}

export interface VenueDto {
  venueId: number;
  venueName: string;
  address?: string;
  description?: string;
  totalCapacity?: number;
  contact?: string;
  seatMapJson?: SeatMapJson | string | null;
}

export type VenueResponse = VenueDto;
