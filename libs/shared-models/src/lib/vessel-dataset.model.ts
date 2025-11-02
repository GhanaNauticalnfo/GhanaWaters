import { VesselTelemetryResponse } from './vessel-telemetry.model';

/**
 * Complete vessel dataset including telemetry
 */
export interface VesselDataset {
  id: number;
  name: string;
  type: string;
  vessel_type_id: number;
  last_seen: Date | null;
  last_position: {
    latitude: number;
    longitude: number;
  } | null;
  created: Date;
  last_updated: Date;
  vessel_telemetry?: VesselTelemetryResponse[];
}

/**
 * Filters for telemetry export
 */
export interface TelemetryExportFilters {
  startDate: string;
  endDate: string;
  vesselIds?: number[];
  vesselTypeIds?: number[];
}

/**
 * Statistics for telemetry export
 */
export interface TelemetryExportStats {
  totalRecords: number;
  dateRange: {
    min: string;
    max: string;
  };
}