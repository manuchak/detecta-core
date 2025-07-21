// Calculadora de demanda basada en lógica de negocio real

export interface ZoneBusinessMetrics {
  zona_id: string;
  zona_nombre: string;
  servicios_diarios_promedio: number;
  ratio_foraneo: number;
  factor_estacional: number;
  factor_actividad_economica: number;
}

export interface DemandPrediction {
  custodios_necesarios: number;
  servicios_locales_dia: number;
  servicios_foraneos_dia: number;
  justificacion: string[];
  factores_aplicados: {
    estacional: number;
    actividad_economica: number;
    tipo_zona: string;
  };
}

/**
 * Calcula la demanda de custodios basada en lógica de negocio real
 */
export const calcularDemandaCustodios = (
  serviciosDiarios: number,
  zonaNombre: string,
  factorEstacional: number = 1.0,
  factorActividad: number = 1.0
): DemandPrediction => {
  // 1. Determinar tipo de zona y ratio foráneo/local
  const tipoZona = determinarTipoZona(zonaNombre);
  const ratioForaneo = obtenerRatioForaneo(tipoZona);
  
  // 2. Distribuir servicios por tipo
  const serviciosForaneosDia = serviciosDiarios * ratioForaneo;
  const serviciosLocalesDia = serviciosDiarios * (1 - ratioForaneo);
  
  // 3. Calcular custodios necesarios por tipo de servicio
  // Foráneos: custodio no disponible por 2 días (incluye viaje vacío)
  // Locales: custodio trabaja 5 de 7 días
  const custodiosForaneos = Math.ceil(serviciosForaneosDia / 0.5); // 1 servicio cada 2 días
  const custodiosLocales = Math.ceil(serviciosLocalesDia / 0.71); // 5/7 = 0.71 disponibilidad
  
  const custodiosBase = custodiosForaneos + custodiosLocales;
  
  // 4. Aplicar factores de ajuste
  const custodiosConFactores = Math.round(custodiosBase * factorEstacional * factorActividad);
  
  // 5. Aplicar límites por tipo de zona
  const { min, max } = obtenerLimitesZona(tipoZona);
  const custodiosFinales = Math.max(min, Math.min(max, custodiosConFactores));
  
  // 6. Generar justificación
  const justificacion = generarJustificacion(
    serviciosDiarios,
    tipoZona,
    ratioForaneo,
    custodiosForaneos,
    custodiosLocales,
    factorEstacional,
    factorActividad
  );
  
  return {
    custodios_necesarios: custodiosFinales,
    servicios_locales_dia: Math.round(serviciosLocalesDia),
    servicios_foraneos_dia: Math.round(serviciosForaneosDia),
    justificacion,
    factores_aplicados: {
      estacional: factorEstacional,
      actividad_economica: factorActividad,
      tipo_zona: tipoZona
    }
  };
};

/**
 * Calcula el factor estacional basado en el mes actual
 */
export const calcularFactorEstacional = (mes: number): number => {
  const patronEstacional = [
    1.1, // Enero - reactivación post-vacaciones
    1.0, // Febrero - normal
    1.1, // Marzo - incremento trimestral
    1.0, // Abril - normal
    1.1, // Mayo - temporada alta comercial
    1.0, // Junio - normal
    0.8, // Julio - baja por vacaciones
    0.8, // Agosto - baja por vacaciones
    1.0, // Septiembre - reactivación
    1.1, // Octubre - temporada alta
    1.2, // Noviembre - temporada alta (Buen Fin)
    1.3  // Diciembre - pico navideño
  ];
  
  return patronEstacional[mes - 1] || 1.0;
};

/**
 * Estima servicios diarios basado en datos históricos de la zona
 */
export const estimarServiciosDiarios = (
  serviciosHistoricos: number,
  diasPeriodo: number,
  ingresoPromedio: number
): number => {
  // Base: promedio histórico
  const serviciosBase = serviciosHistoricos / diasPeriodo;
  
  // Factor de actividad económica basado en ingresos
  const factorActividad = Math.max(0.5, Math.min(2.0, ingresoPromedio / 5000));
  
  // Mínimo 1 servicio por día para zonas activas
  return Math.max(1, Math.round(serviciosBase * factorActividad));
};

// Funciones auxiliares
const determinarTipoZona = (zonaNombre: string): string => {
  const nombre = zonaNombre.toLowerCase();
  
  if (nombre.includes('centro') || nombre.includes('méxico') || nombre.includes('bajío')) {
    return 'central';
  }
  if (nombre.includes('pacífico') || nombre.includes('golfo')) {
    return 'puerto';
  }
  if (nombre.includes('norte') || nombre.includes('frontera')) {
    return 'frontera';
  }
  return 'regional';
};

const obtenerRatioForaneo = (tipoZona: string): number => {
  switch (tipoZona) {
    case 'central': return 0.8; // 80% foráneos - centro distribuidor
    case 'puerto': return 0.9;  // 90% foráneos - origen/destino comercio exterior
    case 'frontera': return 0.75; // 75% foráneos - comercio fronterizo
    default: return 0.7; // 70% foráneos - zona regional
  }
};

const obtenerLimitesZona = (tipoZona: string): { min: number; max: number } => {
  switch (tipoZona) {
    case 'central': return { min: 15, max: 300 };
    case 'puerto': return { min: 10, max: 150 };
    case 'frontera': return { min: 8, max: 120 };
    default: return { min: 5, max: 80 };
  }
};

const generarJustificacion = (
  serviciosDiarios: number,
  tipoZona: string,
  ratioForaneo: number,
  custodiosForaneos: number,
  custodiosLocales: number,
  factorEstacional: number,
  factorActividad: number
): string[] => {
  const justificacion = [
    `Zona ${tipoZona}: ${serviciosDiarios} servicios diarios promedio`,
    `Distribución: ${Math.round(ratioForaneo * 100)}% foráneos, ${Math.round((1 - ratioForaneo) * 100)}% locales`,
    `Custodios foráneos: ${custodiosForaneos} (disponibilidad 50% por viajes vacíos)`,
    `Custodios locales: ${custodiosLocales} (disponibilidad 71% - 5 días/semana)`,
  ];
  
  if (factorEstacional !== 1.0) {
    justificacion.push(`Factor estacional aplicado: ${(factorEstacional * 100).toFixed(0)}%`);
  }
  
  if (factorActividad !== 1.0) {
    justificacion.push(`Factor actividad económica: ${(factorActividad * 100).toFixed(0)}%`);
  }
  
  return justificacion;
};