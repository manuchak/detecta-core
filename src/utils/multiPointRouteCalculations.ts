/**
 * Utilidades para cálculo de rutas multi-punto (estrategia de reparto)
 * Permite calcular duración total y generar resúmenes de rutas con múltiples paradas
 */

export interface PuntoIntermedio {
  orden: number;
  nombre: string;
  direccion: string;
  tiempo_estimado_parada_min: number;
  observaciones?: string;
}

/**
 * Calcula la duración total estimada de una ruta multi-punto
 * @param distanciaKm - Distancia total de la ruta en kilómetros
 * @param puntosIntermedios - Array de puntos intermedios con tiempo de parada
 * @param velocidadPromedioKmH - Velocidad promedio en km/h (default: 40)
 * @returns Duración total en horas (redondeada hacia arriba)
 */
export const calcularDuracionTotalRuta = (
  distanciaKm: number,
  puntosIntermedios: PuntoIntermedio[],
  velocidadPromedioKmH: number = 40
): number => {
  // Tiempo de traslado (distancia total / velocidad promedio)
  const tiempoTrasladoHoras = distanciaKm / velocidadPromedioKmH;
  
  // Tiempo total en paradas (suma de todos los tiempos de parada)
  const tiempoParadasMin = puntosIntermedios.reduce(
    (total, punto) => total + (punto.tiempo_estimado_parada_min || 15), 
    0
  );
  const tiempoParadasHoras = tiempoParadasMin / 60;
  
  // Tiempo total = traslado + paradas (redondeado hacia arriba)
  return Math.ceil(tiempoTrasladoHoras + tiempoParadasHoras);
};

/**
 * Genera un resumen legible de la ruta multi-punto
 * @param origen - Punto de origen
 * @param destino - Destino final
 * @param puntosIntermedios - Array de puntos intermedios
 * @returns String con el resumen de la ruta
 */
export const generarResumenRuta = (
  origen: string,
  destino: string,
  puntosIntermedios: PuntoIntermedio[]
): string => {
  if (puntosIntermedios.length === 0) {
    return `${origen} → ${destino}`;
  }
  
  const puntos = puntosIntermedios
    .sort((a, b) => a.orden - b.orden)
    .map(p => p.nombre || 'Parada')
    .join(' → ');
    
  return `${origen} → ${puntos} → ${destino}`;
};

/**
 * Calcula el tiempo total estimado en paradas
 * @param puntosIntermedios - Array de puntos intermedios
 * @returns Tiempo total en minutos
 */
export const calcularTiempoTotalParadas = (
  puntosIntermedios: PuntoIntermedio[]
): number => {
  return puntosIntermedios.reduce(
    (total, punto) => total + (punto.tiempo_estimado_parada_min || 15),
    0
  );
};

/**
 * Valida que los puntos intermedios estén completos
 * @param puntosIntermedios - Array de puntos a validar
 * @returns Array de índices de puntos incompletos
 */
export const validarPuntosIntermedios = (
  puntosIntermedios: PuntoIntermedio[]
): number[] => {
  return puntosIntermedios
    .map((punto, index) => ({
      index,
      isValid: punto.nombre?.trim() && punto.direccion?.trim()
    }))
    .filter(p => !p.isValid)
    .map(p => p.index);
};
