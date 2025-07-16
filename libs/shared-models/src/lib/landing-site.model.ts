import { GeoPoint } from './geo-point.model';

/**
 * Base landing site interface
 */
export interface LandingSite {
  id: number;
  name: string;
  description?: string;
  location: GeoPoint;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: Date;
  updated_at: Date;
}

/**
 * Landing site with enabled flag (backward compatibility)
 */
export interface LandingSiteWithEnabled {
  id?: number;
  name: string;
  description?: string;
  location: GeoPoint;
  enabled: boolean;
  created?: Date;
  last_updated?: Date;
}

/**
 * Input DTO for creating/updating landing sites
 */
export interface LandingSiteInput {
  name: string;
  description?: string;
  location: GeoPoint;
  status?: 'active' | 'inactive' | 'maintenance';
}

/**
 * Input DTO with enabled flag
 */
export interface LandingSiteInputWithEnabled {
  name: string;
  description?: string;
  location: GeoPoint;
  enabled: boolean;
}

/**
 * Response DTO for landing site data from API
 */
export interface LandingSiteResponse {
  id: number;
  name: string;
  description?: string;
  location: GeoPoint;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
  settings?: Record<string, string>;
}