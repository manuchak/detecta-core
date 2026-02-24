import { startOfMonth, subMonths, format, min } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Utility para cálculos de fecha MTD (Month-To-Date)
 * Asegura comparaciones justas: mismo día del mes actual vs mes anterior
 */

export interface MTDRange {
  start: string;
  end: string;
}

/**
 * Obtiene el rango del mes actual desde día 1 hasta hoy
 */
export function getCurrentMTDRange(now: Date = new Date()): MTDRange {
  const cdmxNow = formatInTimeZone(now, 'America/Mexico_City', 'yyyy-MM-dd');
  const cdmxYear = parseInt(cdmxNow.substring(0, 4));
  const cdmxMonth = parseInt(cdmxNow.substring(5, 7));
  return {
    start: `${cdmxYear}-${String(cdmxMonth).padStart(2, '0')}-01`,
    end: cdmxNow
  };
}

/**
 * Obtiene el rango del mes anterior desde día 1 hasta el mismo día del mes actual
 * Esto permite comparaciones justas MTD vs MTD
 */
export function getPreviousMTDRange(now: Date = new Date()): MTDRange {
  const cdmxNow = formatInTimeZone(now, 'America/Mexico_City', 'yyyy-MM-dd');
  const currentDay = parseInt(cdmxNow.substring(8, 10));
  
  const prevMonthDate = subMonths(now, 1);
  const cdmxPrev = formatInTimeZone(prevMonthDate, 'America/Mexico_City', 'yyyy-MM-dd');
  const prevYear = parseInt(cdmxPrev.substring(0, 4));
  const prevMonth = parseInt(cdmxPrev.substring(5, 7));
  
  // Día equivalente del mes anterior (o último día si el mes anterior es más corto)
  const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const equivalentDay = Math.min(currentDay, prevMonthLastDay);

  return {
    start: `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`,
    end: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(equivalentDay).padStart(2, '0')}`
  };
}

/**
 * Obtiene el día actual del mes
 */
export function getCurrentDay(now: Date = new Date()): number {
  return now.getDate();
}

/**
 * Formatea la etiqueta de comparación MTD
 */
export function getMTDLabel(now: Date = new Date()): string {
  const day = getCurrentDay(now);
  return `MTD día ${day}`;
}
