/**
 * Sync-related interfaces for offline data synchronization
 */

/**
 * Individual sync entity representing a change to a specific entity
 */
export interface SyncEntity {
  entityType: string;
  entityId: string;
  entityAction: 'create' | 'update' | 'delete';
  entityData?: any;
}

/**
 * Sync entry representing a batch of changes within a version range
 */
export interface SyncEntry {
  majorVersion: number;
  fromMinorVersion: number;
  toMinorVersion: number;
  lastUpdate: string;
  hasMoreEntities: boolean;
  entities: SyncEntity[];
}

/**
 * Response from sync reset endpoint
 */
export interface SyncResetResponse {
  success: boolean;
  majorVersion: number;
}

/**
 * Minor version information for sync overview
 */
export interface MinorVersionInfo {
  minorVersion: number;
  size: number;
  timestamp: string;
}

/**
 * Response from sync overview endpoint
 */
export interface SyncOverviewResponse {
  majorVersion: number;
  lastUpdate: string;
  minorVersions: MinorVersionInfo[];
}