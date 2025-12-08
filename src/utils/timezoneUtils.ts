/**
 * Utilidades centralizadas para manejo consistente de fechas y timezones
 * 
 * ⚠️ REGLA FUNDAMENTAL:
 * - Datos de DB (fecha_hora_cita, created_at) vienen en UTC
 * - Para comparaciones de FECHA desde DB usamos getUTC*() o parseISO()
 * - Para formateo de UI con date-fns usamos parseISO() o format()
 * - NUNCA usar toISOString().split('T')[0] - causa bugs de timezone
 * 
 * @example
 * // Para datos de DB (string ISO):
 * const dayOfWeek = getUTCDayOfWeek(service.fecha_hora_cita);
 * const dateStr = toDateStringFromUTC(service.fecha_hora_cita);
 * 
 * // Para fechas locales (Date objects):
 * const today = getTodayString();
 * const dateStr = getLocalDateString(new Date());
 */

import { format, parseISO } from 'date-fns';

// ============= CONVERSIÓN SEGURA DE FECHA =============

/**
 * Extrae fecha YYYY-MM-DD de un objeto Date de forma consistente
 * Usa zona local del navegador - para fechas generadas localmente
 * 
 * @param date - Objeto Date
 * @returns String en formato YYYY-MM-DD
 * 
 * @example
 * toDateString(new Date()) // "2025-12-08"
 */
export const toDateString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Extrae fecha YYYY-MM-DD de un string ISO/UTC (desde DB)
 * parseISO interpreta el string correctamente evitando shift de timezone
 * 
 * @param isoString - String ISO de la DB (ej: "2025-12-08T10:00:00.000Z")
 * @returns String en formato YYYY-MM-DD
 * 
 * @example
 * toDateStringFromUTC("2025-12-08T23:00:00.000Z") // "2025-12-08" (no "2025-12-09")
 */
export const toDateStringFromUTC = (isoString: string): string => {
  if (!isoString) return '';
  return format(parseISO(isoString), 'yyyy-MM-dd');
};

// ============= EXTRACCIÓN UTC SEGURA DESDE STRINGS DE DB =============

/**
 * Obtiene día de la semana (0-6, 0=Domingo) de un string ISO de DB
 * Usa getUTCDay() para evitar shift de timezone
 * 
 * @param isoString - String ISO de la DB
 * @returns Número 0-6 (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * 
 * @example
 * getUTCDayOfWeek("2025-12-08T10:00:00.000Z") // 1 (Lunes)
 */
export const getUTCDayOfWeek = (isoString: string): number => {
  if (!isoString) return 0;
  return new Date(isoString).getUTCDay();
};

/**
 * Obtiene día del mes (1-31) de un string ISO de DB
 * Usa getUTCDate() para evitar shift de timezone
 * 
 * @param isoString - String ISO de la DB
 * @returns Número 1-31
 * 
 * @example
 * getUTCDayOfMonth("2025-12-08T23:00:00.000Z") // 8 (no 9)
 */
export const getUTCDayOfMonth = (isoString: string): number => {
  if (!isoString) return 1;
  return new Date(isoString).getUTCDate();
};

/**
 * Obtiene mes (0-11) de un string ISO de DB
 * Usa getUTCMonth() para evitar shift de timezone
 * 
 * @param isoString - String ISO de la DB
 * @returns Número 0-11 (0=Enero, 11=Diciembre)
 * 
 * @example
 * getUTCMonth("2025-12-31T23:00:00.000Z") // 11 (Diciembre, no Enero)
 */
export const getUTCMonth = (isoString: string): number => {
  if (!isoString) return 0;
  return new Date(isoString).getUTCMonth();
};

/**
 * Obtiene año de un string ISO de DB
 * Usa getUTCFullYear() para evitar shift de timezone
 * 
 * @param isoString - String ISO de la DB
 * @returns Año completo (ej: 2025)
 * 
 * @example
 * getUTCYear("2025-01-01T00:00:00.000Z") // 2025 (no 2024)
 */
export const getUTCYear = (isoString: string): number => {
  if (!isoString) return new Date().getFullYear();
  return new Date(isoString).getUTCFullYear();
};

// ============= PARA FECHAS LOCALES (inputs, UI actual) =============

/**
 * Obtiene fecha actual en formato YYYY-MM-DD (zona local)
 * Para inputs HTML date, defaultValues, comparaciones con "hoy"
 * 
 * @returns String YYYY-MM-DD de hoy
 * 
 * @example
 * getTodayString() // "2025-12-08"
 */
export const getTodayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Obtiene fecha local en formato YYYY-MM-DD
 * Para comparaciones de rango con fechas generadas localmente
 * 
 * @param date - Objeto Date local
 * @returns String YYYY-MM-DD
 * 
 * @example
 * getLocalDateString(new Date()) // "2025-12-08"
 */
export const getLocalDateString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Obtiene fecha de ayer en formato YYYY-MM-DD (zona local)
 * Útil para datos con 1 día de retraso
 * 
 * @returns String YYYY-MM-DD de ayer
 */
export const getYesterdayString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return format(yesterday, 'yyyy-MM-dd');
};

// ============= COMPARACIÓN DE FECHAS =============

/**
 * Verifica si un string ISO de DB corresponde a un mes/año específico
 * Usa métodos UTC para evitar bugs de timezone
 * 
 * @param isoString - String ISO de la DB
 * @param month - Mes a comparar (1-12, no 0-11)
 * @param year - Año a comparar
 * @returns true si coincide
 */
export const isInMonthYear = (isoString: string, month: number, year: number): boolean => {
  if (!isoString) return false;
  const date = new Date(isoString);
  return date.getUTCMonth() + 1 === month && date.getUTCFullYear() === year;
};

/**
 * Verifica si un string ISO de DB corresponde al día actual o anterior
 * Considera el retraso de datos (1 día)
 * 
 * @param isoString - String ISO de la DB
 * @param dayOfMonth - Día del mes a comparar (1-31)
 * @returns true si el día <= dayOfMonth
 */
export const isOnOrBeforeDay = (isoString: string, dayOfMonth: number): boolean => {
  if (!isoString) return false;
  return new Date(isoString).getUTCDate() <= dayOfMonth;
};

// ============= CONSTANTES DE DÍAS =============

export const WEEKDAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

export const WEEKDAY_NAMES_FULL_ES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 
  'Jueves', 'Viernes', 'Sábado'
] as const;

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

export const MONTH_NAMES_SHORT_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
] as const;
