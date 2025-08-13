import { GeoPoint } from '@ghanawaters/shared-models';

export interface CreateLandingSiteDto {
  name: string;
  description?: string;
  location: GeoPoint;
  active?: boolean;
}

export interface UpdateLandingSiteDto {
  name?: string;
  description?: string;
  location?: GeoPoint;
  active?: boolean;
}

export interface LandingSiteResponseDto {
  id: number;
  name: string;
  description?: string;
  location: GeoPoint;
  active: boolean;
  created_at: string;
  updated_at: string;
  settings?: Record<string, string>;
}