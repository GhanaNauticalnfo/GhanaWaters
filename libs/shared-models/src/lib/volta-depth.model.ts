/**
 * Volta depth tile interface
 */
export interface VoltaDepthTile {
  id: number;
  tile_x: number;
  tile_y: number;
  tile_z: number;
  min_depth: number;
  max_depth: number;
  feature_count: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Volta depth tile feature interface
 */
export interface VoltaDepthTileFeature {
  id: number;
  tile_id: number;
  depth: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Tile info for upload
 */
export interface TileUploadInfo {
  x: number;
  y: number;
  z: number;
  features: number;
  depths: string;
}

/**
 * Tile metadata info
 */
export interface TileInfo {
  id: string;
  numberOfFeatures: number;
  created: Date | string;
  lastUpdated: Date | string;
  version: number;
}

/**
 * Upload response DTO
 */
export interface UploadResponse {
  uploadId: string;
  deducedTileId: string;
  isUpdate: boolean;
  featureCount: number;
  message: string;
  currentVersion?: number;
}

/**
 * Commit upload DTO
 */
export interface CommitUpload {
  uploadId: string;
}

/**
 * Tile definition with geometric boundaries
 */
export interface TileDefinition {
  type: 'Feature';
  properties: {
    id: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
    row_index: number;
    col_index: number;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}