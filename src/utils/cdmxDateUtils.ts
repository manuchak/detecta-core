/**
 * Utilidades para extraer componentes de fecha en timezone CDMX
 * 
 * ⚠️ REGLA FUNDAMENTAL:
 * Los timestamps en servicios_custodia.fecha_hora_cita se almacenan en UTC.
 * Un servicio a las 20:00 CDMX se guarda como 02:00 UTC del día siguiente.
 * 
 * Por eso NUNCA usar getUTCDate()/getUTCMonth() para datos que deben
 * alinearse con hora local México - causa error off-by-one en ~35% de servicios.
 * 
 * @example
 * // Servicio real: 27 enero 2026, 20:00 CDMX
 * // Guardado como: "2026-01-28T02:00:00.000Z"
 * 
 * getUTCDate() → 28 (¡INCORRECTO!)
 * getCDMXDayOfMonth() → 27 (✓ CORRECTO)
 */

import { formatInTimeZone } from 'date-fns-tz';

export const TIMEZONE_CDMX = 'America/Mexico_City';

/**
 * Obtiene día del mes (1-31) en timezone CDMX
 * @param isoString - String ISO de la DB (ej: "2026-01-28T02:00:00.000Z")
 * @returns Número 1-31 en hora local CDMX
 * 
 * @example
 * getCDMXDayOfMonth("2026-01-28T02:00:00.000Z") // 27 (no 28)
 */
export const getCDMXDayOfMonth = (isoString: string): number => {
  if (!isoString) return 1;
  return parseInt(formatInTimeZone(isoString, TIMEZONE_CDMX, 'd'), 10);
};

/**
 * Obtiene mes (0-11) en timezone CDMX
 * @param isoString - String ISO de la DB
 * @returns Número 0-11 (0=Enero, 11=Diciembre) en hora local CDMX
 * 
 * @example
 * getCDMXMonth("2026-02-01T05:00:00.000Z") // 0 (Enero, no Febrero)
 */
export const getCDMXMonth = (isoString: string): number => {
  if (!isoString) return 0;
  return parseInt(formatInTimeZone(isoString, TIMEZONE_CDMX, 'M'), 10) - 1;
};

/**
 * Obtiene año en timezone CDMX
 * @param isoString - String ISO de la DB
 * @returns Año completo (ej: 2026) en hora local CDMX
 * 
 * @example
 * getCDMXYear("2026-01-01T05:00:00.000Z") // 2025 (si cruzó medianoche UTC)
 */
export const getCDMXYear = (isoString: string): number => {
  if (!isoString) return new Date().getFullYear();
  return parseInt(formatInTimeZone(isoString, TIMEZONE_CDMX, 'yyyy'), 10);
};

/**
 * Extrae fecha YYYY-MM-DD en timezone CDMX
 * Para agrupaciones por día que deben respetar hora local
 * 
 * @param isoString - String ISO de la DB
 * @returns String en formato YYYY-MM-DD en hora local CDMX
 * 
 * @example
 * getCDMXDateString("2026-01-28T02:00:00.000Z") // "2026-01-27"
 */
export const getCDMXDateString = (isoString: string): string => {
  if (!isoString) return '';
  return formatInTimeZone(isoString, TIMEZONE_CDMX, 'yyyy-MM-dd');
};

/**
 * Verifica si un timestamp corresponde a un mes/año específico en CDMX
 * @param isoString - String ISO de la DB
 * @param month - Mes a comparar (1-12, no 0-11)
 * @param year - Año a comparar
 * @returns true si coincide en timezone CDMX
 */
export const isInMonthYearCDMX = (isoString: string, month: number, year: number): boolean => {
  if (!isoString) return false;
  return getCDMXMonth(isoString) + 1 === month && getCDMXYear(isoString) === year;
};

/**
 * Verifica si un timestamp corresponde al día actual o anterior en CDMX
 * @param isoString - String ISO de la DB
 * @param dayOfMonth - Día del mes a comparar (1-31)
 * @returns true si el día <= dayOfMonth en timezone CDMX
 */
export const isOnOrBeforeDayCDMX = (isoString: string, dayOfMonth: number): boolean => {
  if (!isoString) return false;
  return getCDMXDayOfMonth(isoString) <= dayOfMonth;
};

/**
 * Obtiene día de la semana (0-6, Dom-Sáb) en timezone CDMX
 * @param isoString - String ISO de la DB
 * @returns Número 0=Domingo, 1=Lunes, ..., 6=Sábado en hora local CDMX
 * 
 * @example
 * getCDMXWeekday("2026-01-28T02:00:00.000Z") // 1 (Martes en UTC, pero Lunes en CDMX)
 */
export const getCDMXWeekday = (isoString: string): number => {
  if (!isoString) return 0;
  // 'e' returns 1=Mon..7=Sun in date-fns; convert to 0=Sun..6=Sat
  const eVal = parseInt(formatInTimeZone(isoString, TIMEZONE_CDMX, 'e'), 10);
  return eVal === 7 ? 0 : eVal;
};
