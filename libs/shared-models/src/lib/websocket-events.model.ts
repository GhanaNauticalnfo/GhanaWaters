import { DeviceResponse } from './device.model';

/**
 * WebSocket event interfaces for real-time communication
 */

/**
 * Event emitted when a device is activated in the admin UI
 */
export interface DeviceActivatedEvent {
  vesselId: number;
  device: DeviceResponse;
}

/**
 * Event emitted when a vessel position is updated used by the shared-map component
 */
export interface PositionUpdateEvent {
  vesselId: number;
  vesselName: string;
  vesselType: string;
  vesselTypeId?: number;
  vesselTypeColor: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  status: string | null;
  timestamp: string | Date;
}

/**
 * Event emitted when sync data is updated
 */
export interface SyncNotification {
  major_version: number;
  minor_version: number;
  timestamp: Date;
}

/**
 * Generic error event for WebSocket connections
 */
export interface WebSocketErrorEvent {
  code?: string;
  message: string;
  details?: unknown;
}