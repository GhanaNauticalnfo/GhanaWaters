// libs/map/src/lib/layers/nwnm/nw-nm.models.ts
import {
    Feature,
    FeatureCollection,
    Geometry,
    GeoJsonProperties
} from 'geojson';

/**
 * Language-specific description for NW/NM messages
 */
export interface NwNmMessageDescription {
  lang: string;
  title?: string;
  subject?: string;
  details?: string;
  description?: string;
  name?: string;
  source?: string;
}

/**
 * Geographic area affected by the message
 */
export interface NwNmArea {
  id?: number;
  name?: string;
  descs?: NwNmMessageDescription[];
  parent?: NwNmArea;
}

/**
 * Chart reference in NW/NM messages
 */
export interface NwNmChart {
  chartNumber?: string;
  internationalNumber?: string;
}

/**
 * Reference to another message
 */
export interface NwNmReference {
  messageId: string;
  type?: 'REPETITION' | 'REPETITION_NEW_TIME' | 'CANCELLATION' | 'UPDATE';
  descs?: NwNmMessageDescription[];
}

export interface NwNmMessagePart {
  type?: string;
  // Allow geometry to be a FeatureCollection (most common from Niord), Feature, or direct Geometry
  geometry?: FeatureCollection<Geometry, GeoJsonProperties> | Feature<Geometry | null, GeoJsonProperties> | Geometry;
  eventDates?: any[];
  descs?: NwNmMessageDescription[];
}

export interface NwNmMessage {
  // Core identifiers
  id: number | string;
  shortId?: string;

  // Type and status
  mainType: 'NW' | 'NM';
  type?: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'VERIFIED' | 'CANCELLED' | 'EXPIRED' | 'DELETED';

  // Content (single language or primary)
  title?: string;
  description?: string;

  // Multi-language content
  descs?: NwNmMessageDescription[];

  // Dates
  publishDateFrom?: string;
  publishDateTo?: string;
  followUpDate?: string;

  // Geographic info
  areas?: NwNmArea[];

  // Message structure
  parts?: NwNmMessagePart[];

  // References and charts
  references?: NwNmReference[];
  charts?: NwNmChart[];

  // Original information flag
  originalInformation?: boolean;
}

/**
 * Defines the properties specific to NW-NM features.
 * We define it directly instead of extending GeoJsonProperties to avoid TS2312.
 */
export interface NwNmFeatureProperties {
    // Core identifiers
    id: number | string;
    messageId?: number | string;
    shortId?: string;

    // Type and status
    mainType: 'NW' | 'NM';
    type?: string;
    status?: string;

    // Content
    title?: string;
    description?: string;

    // Dates
    publishDateFrom?: string;
    publishDateTo?: string;

    // Additional data
    areas?: any[];
    descs?: any[];
    parts?: any[];
    references?: any[];
    charts?: any[];

    // Original information flag
    originalInformation?: boolean;

    // Use 'unknown' instead of 'any' for better type safety
    // Allows merging with properties from the original GeoJSON feature
    [key: string]: unknown;
}


/**
 * Type alias for a GeoJSON Feature specific to NW-NM data.
 * Uses a type alias instead of an empty interface extending Feature.
 */
export type NwNmFeature = Feature<Geometry | null, NwNmFeatureProperties>;
