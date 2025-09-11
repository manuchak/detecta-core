/**
 * Utilidades para manejo dinámico de fechas en el sistema de forecast
 */

// Meses en español
const MESES_ESPANOL = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Obtiene información del mes actual
 */
export const getCurrentMonthInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const monthName = MESES_ESPANOL[month];
  
  return {
    year,
    month,
    monthName,
    monthNumber: month + 1,
    fullName: `${monthName} ${year}`
  };
};

/**
 * Obtiene información del mes anterior
 */
export const getPreviousMonthInfo = () => {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prevMonth.getFullYear();
  const month = prevMonth.getMonth();
  const monthName = MESES_ESPANOL[month];
  
  return {
    year,
    month,
    monthName,
    monthNumber: month + 1,
    fullName: `${monthName} ${year}`
  };
};

/**
 * Calcula días restantes del mes actual
 */
export const getDaysRemainingInMonth = () => {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = lastDayOfMonth.getDate() - now.getDate();
  
  return Math.max(0, daysRemaining);
};

/**
 * Formatea una pregunta dinámica para el mes actual
 */
export const formatMonthlyQuestion = (prefix: string = '¿Cómo cerramos') => {
  const currentMonth = getCurrentMonthInfo();
  return `${prefix} ${currentMonth.monthName} ${currentMonth.year}?`;
};

/**
 * Obtiene el nombre del mes anterior para comparaciones
 */
export const getPreviousMonthName = () => {
  const prevMonth = getPreviousMonthInfo();
  return prevMonth.fullName;
};

/**
 * Capitaliza la primera letra de una cadena
 */
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};