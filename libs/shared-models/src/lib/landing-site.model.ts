import { GeoPoint } from './geo-point.model';

/**
 * Base landing site interface
 */
export interface LandingSite {
  id: number;
  name: string;
  description?: string;
  location: GeoPoint;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Input DTO for creating/updating landing sites
 */
export interface LandingSiteInput {
  name: string;
  description?: string;
  location: GeoPoint;
  active?: boolean;
}

/**
 * Response DTO for landing site data from API
 */
export interface LandingSiteResponse {
  id: number;
  name: string;
  description?: string;
  location: GeoPoint;
  active: boolean;
  created_at: string;
  updated_at: string;
  settings?: Record<string, string>;
}