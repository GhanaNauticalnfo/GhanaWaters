/**
 * Sync-related models for the admin UI
 */

/**
 * Detailed sync log entry with full data - used for displaying sync entry details in the admin panel
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