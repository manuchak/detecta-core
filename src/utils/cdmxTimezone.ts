/**
 * Centralized CDMX Timezone Utilities
 * 
 * All operational services use Mexico City timezone (America/Mexico_City).
 * Note: CDMX eliminated daylight saving time in 2023, so UTC-6 is permanent.
 */

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

export const TIMEZONE_CDMX = 'America/Mexico_City';
// CDMX standard offset (no DST since 2023)
export const CDMX_OFFSET = '-06:00';

/**
 * Formats a database timestamp (UTC) in CDMX local time with Spanish locale
 * @param isoString - ISO timestamp from database
 * @param formatStr - date-fns format string (default: 'HH:mm')
 */
export function formatCDMXTime(isoString: string, formatStr: string = 'HH:mm'): string {
  return formatInTimeZone(isoString, TIMEZONE_CDMX, formatStr, { locale: es });
}

/**
 * Builds an ISO timestamp with CDMX offset for saving to database
 * @param dateStr - Date in format YYYY-MM-DD
 * @param timeStr - Time in format HH:mm
 */
export function buildCDMXTimestamp(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00${CDMX_OFFSET}`;
}

/**
 * Gets the hour from a timestamp formatted in CDMX timezone
 */
export function getCDMXHour(isoString: string): string {
  return formatInTimeZone(isoString, TIMEZONE_CDMX, 'HH:mm', { locale: es });
}

/**
 * Gets the date from a timestamp formatted in CDMX timezone
 */
export function getCDMXDate(isoString: string): string {
  return formatInTimeZone(isoString, TIMEZONE_CDMX, 'yyyy-MM-dd', { locale: es });
}

/**
 * Gets a Date object representing the CDMX zoned time
 */
export function getZonedCDMXTime(isoString: string): Date {
  return toZonedTime(isoString, TIMEZONE_CDMX);
}
