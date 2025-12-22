import { startOfMonth, subMonths, format, min } from 'date-fns';

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
  const start = startOfMonth(now);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(now, 'yyyy-MM-dd')
  };
}

/**
 * Obtiene el rango del mes anterior desde día 1 hasta el mismo día del mes actual
 * Esto permite comparaciones justas MTD vs MTD
 */
export function getPreviousMTDRange(now: Date = new Date()): MTDRange {
  const currentDay = now.getDate();
  const prevMonthDate = subMonths(now, 1);
  const prevMonthStart = startOfMonth(prevMonthDate);
  
  // Día equivalente del mes anterior (o último día si el mes anterior es más corto)
  const prevMonthLastDay = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0).getDate();
  const equivalentDay = Math.min(currentDay, prevMonthLastDay);
  const prevMonthEnd = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), equivalentDay);

  return {
    start: format(prevMonthStart, 'yyyy-MM-dd'),
    end: format(prevMonthEnd, 'yyyy-MM-dd')
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
