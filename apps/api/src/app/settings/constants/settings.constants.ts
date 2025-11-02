/**
 * Constants for application settings keys
 * 
 * This ensures type safety and consistency across frontend and backend
 * when working with settings. This file mirrors the shared-models constants
 * but is available for the backend Node.js environment.
 */
export const SETTING_KEYS = {
  DATABASE_TELEMETRY_RETENTION_DAYS: 'database.telemetry.retention_days'
} as const;

/**
 * Default values for settings
 */
export const SETTING_DEFAULTS = {
  [SETTING_KEYS.DATABASE_TELEMETRY_RETENTION_DAYS]: '365'
} as const;

/**
 * Array of allowed setting keys for validation
 */
export const ALLOWED_SETTING_KEYS = Object.values(SETTING_KEYS);

/**
 * Type for valid setting keys
 */
export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];