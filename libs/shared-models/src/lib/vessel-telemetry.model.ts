import { GeoPoint } from './geo-point.model';

/**
 * Base vessel telemetry/tracking interface
 */
export interface VesselTelemetry {
  id: number;
  created: Date;
  timestamp: Date;
  vessel_id: number;
  position: GeoPoint;
  speed_knots: number | null;
  heading_degrees: number | null;
  device_id: string | null;
  status: string | null;
}

/**
 * Input DTO for reporting vessel telemetry
 */
export interface VesselTelemetryInput {
  timestamp?: string;
  position: GeoPoint;
  speed_knots?: number;
  heading_degrees?: number;
  status?: string;
}

/**
 * Response DTO for vessel telemetry data from API
 */
export interface VesselTelemetryResponse {
  id: number;
  created: Date;
  timestamp: Date;
  vessel_id: number;
  position: GeoPoint;
  speed_knots: number | null;
  heading_degrees: number | null;
  device_id: string | null;
  status: string | null;
}