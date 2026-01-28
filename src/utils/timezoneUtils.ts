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

// ============= EXTRACCIÓN UTC - DEPRECADO =============
// ⚠️ ADVERTENCIA: Estas funciones causan errores off-by-one para servicios
// después de las 18:00 CDMX. Usar getCDMX* de cdmxDateUtils.ts en su lugar.

/**
 * @deprecated Use getCDMXDayOfWeek from cdmxDateUtils for CDMX-aware extraction
 * Obtiene día de la semana (0-6, 0=Domingo) de un string ISO de DB
 * ⚠️ Causa off-by-one para servicios nocturnos en CDMX
 */
export const getUTCDayOfWeek = (isoString: string): number => {
  if (!isoString) return 0;
  return new Date(isoString).getUTCDay();
};

/**
 * @deprecated Use getCDMXDayOfMonth from cdmxDateUtils for CDMX-aware extraction
 * Obtiene día del mes (1-31) de un string ISO de DB
 * ⚠️ Causa off-by-one para servicios nocturnos en CDMX
 */
export const getUTCDayOfMonth = (isoString: string): number => {
  if (!isoString) return 1;
  return new Date(isoString).getUTCDate();
};

/**
 * @deprecated Use getCDMXMonth from cdmxDateUtils for CDMX-aware extraction
 * Obtiene mes (0-11) de un string ISO de DB
 * ⚠️ Causa off-by-one para servicios nocturnos en CDMX
 */
export const getUTCMonth = (isoString: string): number => {
  if (!isoString) return 0;
  return new Date(isoString).getUTCMonth();
};

/**
 * @deprecated Use getCDMXYear from cdmxDateUtils for CDMX-aware extraction
 * Obtiene año de un string ISO de DB
 * ⚠️ Causa off-by-one para servicios nocturnos en CDMX
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

// ============= MANEJO DE RETRASO DE DATOS =============

/**
 * DATA_LAG_DAYS: Días de retraso en la alimentación de datos
 * La BDD se alimenta de manera histórica, no en tiempo real.
 * Si hoy es día 20, los datos solo cubren hasta día 19.
 */
export const DATA_LAG_DAYS = 1;

/**
 * Obtiene el día actual ajustado por retraso de datos
 * Para cálculos de pace, pro-rata y métricas que dependen de datos reales
 * 
 * @returns Día del mes con datos disponibles (hoy - DATA_LAG_DAYS)
 * 
 * @example
 * // Si hoy es día 20:
 * getDataCurrentDay() // 19 (datos hasta ayer)
 */
export const getDataCurrentDay = (): number => {
  const today = new Date().getDate();
  return Math.max(1, today - DATA_LAG_DAYS);
};

/**
 * Obtiene días restantes del mes considerando el retraso de datos
 * Para cálculos de pace necesario y proyecciones
 * 
 * @returns Días desde el último día con datos hasta fin de mes
 * 
 * @example
 * // Si hoy es día 20 en un mes de 31 días:
 * getDataDaysRemaining() // 12 (31 - 19)
 */
export const getDataDaysRemaining = (): number => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return daysInMonth - getDataCurrentDay();
};

/**
 * Obtiene la fecha del último día con datos disponibles
 * Útil para mostrar en UI "Datos actualizados hasta..."
 * 
 * @returns Date object del día con datos más reciente
 */
export const getLastDataDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() - DATA_LAG_DAYS);
  return date;
};
