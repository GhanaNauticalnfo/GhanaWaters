/**
 * Sync-related interfaces for offline data synchronization
 */

/**
 * Summary of sync data
 */
export interface SyncSummary {
  totalEntries: number;
  lastSyncVersion: string;
  entityTypes: number;
}

/**
 * Statistics for a specific entity type
 */
export interface EntityStats {
  entityType: string;
  create: number;
  update: number;
  delete: number;
  totalSize: number;
  total: number;
}

/**
 * Recent sync log entry
 */
export interface RecentEntry {
  id: number;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  dataSize: number;
  hasData: boolean;
  timestamp: string | null;
}

/**
 * Detailed sync log entry with full data
 */
export interface SyncEntryDetail {
  id: number;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: string;
  majorVersion: number;
}

/**
 * Response from sync manage endpoint
 */
export interface SyncManageResponse {
  version: string;
  majorVersion: number;
  summary: SyncSummary;
  entityStats: EntityStats[];
  recentEntries: RecentEntry[];
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