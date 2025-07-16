import { DeviceResponse } from './device.model';

/**
 * WebSocket event interfaces for real-time communication
 */

/**
 * Event emitted when a device is activated
 */
export interface DeviceActivatedEvent {
  vesselId: number;
  device: DeviceResponse;
}

/**
 * Event emitted when a vessel position is updated
 */
export interface PositionUpdateEvent {
  vesselId: number;
  lat: number;
  lng: number;
  timestamp: string;
}

/**
 * Generic error event for WebSocket connections
 */
export interface WebSocketErrorEvent {
  code?: string;
  message: string;
  details?: any;
}