
/**
 * Utilidades para manejar intervalos de tiempo y formato de tiempo_retraso
 */

export interface TiempoRetraso {
  horas: number;
  minutos: number;
  segundos: number;
  esNegativo: boolean;
}

/**
 * Convierte un string de interval de PostgreSQL a objeto TiempoRetraso
 */
export const parsePostgresInterval = (intervalStr: string | null): TiempoRetraso | null => {
  if (!intervalStr) return null;
  
  // Limpiar el string y verificar si es negativo
  const cleanStr = intervalStr.trim();
  const esNegativo = cleanStr.startsWith('-');
  const timeStr = cleanStr.replace(/^-/, '');
  
  // Extraer horas, minutos y segundos del formato PostgreSQL interval
  // Puede venir como "02:30:00", "1 hour 30 minutes", etc.
  let horas = 0;
  let minutos = 0;
  let segundos = 0;
  
  // Intentar formato HH:MM:SS primero
  const timeMatch = timeStr.match(/(\d+):(\d+)(?::(\d+))?/);
  if (timeMatch) {
    horas = parseInt(timeMatch[1]) || 0;
    minutos = parseInt(timeMatch[2]) || 0;
    segundos = parseInt(timeMatch[3]) || 0;
  } else {
    // Intentar formato textual de PostgreSQL
    const hoursMatch = timeStr.match(/(\d+)\s*hours?/);
    const minutesMatch = timeStr.match(/(\d+)\s*minutes?/);
    const secondsMatch = timeStr.match(/(\d+)\s*seconds?/);
    
    if (hoursMatch) horas = parseInt(hoursMatch[1]);
    if (minutesMatch) minutos = parseInt(minutesMatch[1]);
    if (secondsMatch) segundos = parseInt(secondsMatch[1]);
  }
  
  return {
    horas,
    minutos,
    segundos,
    esNegativo
  };
};

/**
 * Convierte un objeto TiempoRetraso a string formato HH:MM:SS
 */
export const formatTiempoRetraso = (tiempo: TiempoRetraso | null): string => {
  if (!tiempo) return '-';
  
  const { horas, minutos, segundos, esNegativo } = tiempo;
  
  const horasStr = horas.toString().padStart(2, '0');
  const minutosStr = minutos.toString().padStart(2, '0');
  const segundosStr = segundos.toString().padStart(2, '0');
  
  const timeStr = `${horasStr}:${minutosStr}:${segundosStr}`;
  
  return esNegativo ? `-${timeStr}` : timeStr;
};

/**
 * Convierte un string HH:MM:SS a formato interval de PostgreSQL
 */
export const toPostgresInterval = (timeStr: string): string => {
  if (!timeStr || timeStr.trim() === '') return '';
  
  const cleanStr = timeStr.trim();
  
  // Si ya está en formato correcto, retornarlo
  if (cleanStr.match(/^[+-]?\d{1,2}:\d{2}(:\d{2})?$/)) {
    // Agregar segundos si no los tiene
    if (!cleanStr.includes(':', cleanStr.lastIndexOf(':') + 1)) {
      return cleanStr + ':00';
    }
    return cleanStr;
  }
  
  return cleanStr;
};

/**
 * Formatea tiempo de retraso para mostrar de forma amigable
 */
export const formatTiempoRetrasoDisplay = (intervalStr: string | null): string => {
  const tiempo = parsePostgresInterval(intervalStr);
  if (!tiempo) return 'Sin datos';
  
  const { horas, minutos, segundos, esNegativo } = tiempo;
  
  if (horas === 0 && minutos === 0 && segundos === 0) {
    return 'A tiempo';
  }
  
  let partes: string[] = [];
  
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}m`);
  if (segundos > 0) partes.push(`${segundos}s`);
  
  const tiempoStr = partes.join(' ');
  
  if (esNegativo) {
    return `${tiempoStr} antes`;
  } else {
    return `${tiempoStr} tarde`;
  }
};

/**
 * Convierte minutos a formato interval para compatibilidad con datos antiguos
 */
export const minutesToInterval = (minutes: number | null): string => {
  if (minutes === null || minutes === undefined) return '';
  
  const esNegativo = minutes < 0;
  const absMinutes = Math.abs(minutes);
  
  const horas = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  const timeStr = `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  
  return esNegativo ? `-${timeStr}` : timeStr;
};
