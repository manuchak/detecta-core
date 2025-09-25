/**
 * UUID Helper utilities for consistent UUID handling across the app
 */

/**
 * Validates if a string is a valid UUID format
 */
export const isValidUuid = (uuid?: string): boolean => {
  if (!uuid) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
};

/**
 * Generates a new UUID using crypto.randomUUID() with fallback
 */
export const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Validates and returns a UUID or generates a new one if invalid
 */
export const ensureValidUuid = (uuid?: string): string => {
  if (isValidUuid(uuid)) {
    return uuid!;
  }
  return generateUuid();
};

/**
 * Safely returns a UUID for database operations, undefined if invalid
 */
export const safeUuidForDatabase = (uuid?: string): string | undefined => {
  return isValidUuid(uuid) ? uuid : undefined;
};