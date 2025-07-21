// Algoritmos de predicción mejorados para Fase 1

export interface CapacityConfig {
  horasDisponibles: number;
  ratioRechazo: number;
  eficienciaOperacional: number;
}

export interface ServiceTypeConfig {
  local: { duracion: number; complejidad: number };
  foraneo: { duracion: number; complejidad: number };
  express: { duracion: number; complejidad: number };
}

export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  horasDisponibles: 16,
  ratioRechazo: 0.25, // 25% de rechazo de servicios
  eficienciaOperacional: 0.85 // 85% de eficiencia
};

export const DEFAULT_SERVICE_CONFIG: ServiceTypeConfig = {
  local: { duracion: 6, complejidad: 3 },
  foraneo: { duracion: 14, complejidad: 7 },
  express: { duracion: 4, complejidad: 5 }
};

/**
 * Calcula la capacidad efectiva considerando ratio de rechazo y eficiencia
 */
export const calcularCapacidadEfectiva = (
  custodiosNominales: number,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): number => {
  return custodiosNominales * (1 - config.ratioRechazo) * config.eficienciaOperacional;
};

/**
 * Calcula servicios posibles por día por tipo de servicio
 */
export const calcularServiciosPosiblesPorTipo = (
  capacidadEfectiva: number,
  tipoServicio: keyof ServiceTypeConfig,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG,
  serviceConfig: ServiceTypeConfig = DEFAULT_SERVICE_CONFIG
): number => {
  const duracionServicio = serviceConfig[tipoServicio].duracion;
  return capacidadEfectiva * (config.horasDisponibles / duracionServicio);
};

/**
 * Calcula el déficit mejorado considerando segmentación de servicios
 */
export const calcularDeficitSegmentado = (
  demandaLocal: number,
  demandaForanea: number,
  demandaExpress: number,
  custodiosActivos: number,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG,
  serviceConfig: ServiceTypeConfig = DEFAULT_SERVICE_CONFIG
) => {
  const capacidadEfectiva = calcularCapacidadEfectiva(custodiosActivos, config);
  
  const capacidadLocal = calcularServiciosPosiblesPorTipo(capacidadEfectiva, 'local', config, serviceConfig);
  const capacidadForanea = calcularServiciosPosiblesPorTipo(capacidadEfectiva, 'foraneo', config, serviceConfig);
  const capacidadExpress = calcularServiciosPosiblesPorTipo(capacidadEfectiva, 'express', config, serviceConfig);
  
  const deficitLocal = Math.max(0, demandaLocal - capacidadLocal);
  const deficitForaneo = Math.max(0, demandaForanea - capacidadForanea);
  const deficitExpress = Math.max(0, demandaExpress - capacidadExpress);
  
  return {
    deficit_local: deficitLocal,
    deficit_foraneo: deficitForaneo,
    deficit_express: deficitExpress,
    deficit_total: deficitLocal + deficitForaneo + deficitExpress,
    capacidad_efectiva: capacidadEfectiva,
    capacidades_por_tipo: {
      local: capacidadLocal,
      foraneo: capacidadForanea,
      express: capacidadExpress
    }
  };
};

/**
 * Calcula el score de urgencia mejorado con múltiples factores
 */
export const calcularScoreUrgenciaMejorado = (
  deficitTotal: number,
  demandaTotal: number,
  custodiosActivos: number,
  ratioRechazo: number = DEFAULT_CAPACITY_CONFIG.ratioRechazo
): number => {
  // Factor de déficit relativo (0-40 puntos)
  const factorDeficit = demandaTotal > 0 
    ? Math.min((deficitTotal / demandaTotal) * 40, 40) 
    : 0;
  
  // Factor de capacidad crítica (0-30 puntos)
  const factorCapacidad = custodiosActivos < 2 
    ? 30 
    : Math.max(0, 30 - (custodiosActivos * 3));
  
  // Factor de ratio de rechazo (0-20 puntos)
  const factorRechazo = ratioRechazo > 0.3 ? 20 : ratioRechazo * 66.67; // Normalizar a 20
  
  // Factor de demanda absoluta (0-10 puntos)
  const factorDemanda = Math.min((demandaTotal / 20) * 10, 10);
  
  const scoreTotal = factorDeficit + factorCapacidad + factorRechazo + factorDemanda;
  return Math.min(Math.max(Math.round(scoreTotal / 10), 1), 10);
};

/**
 * Genera recomendaciones inteligentes basadas en el análisis
 */
export const generarRecomendacionesInteligentes = (
  deficitPorTipo: { deficit_local: number; deficit_foraneo: number; deficit_express: number },
  capacidadEfectiva: number,
  custodiosActivos: number,
  ratioRechazo: number = DEFAULT_CAPACITY_CONFIG.ratioRechazo
): string[] => {
  const recomendaciones: string[] = [];
  
  // Recomendaciones por tipo de déficit
  if (deficitPorTipo.deficit_local > 0) {
    const custodiosNecesarios = Math.ceil(deficitPorTipo.deficit_local / (DEFAULT_SERVICE_CONFIG.local.duracion / DEFAULT_CAPACITY_CONFIG.horasDisponibles));
    recomendaciones.push(`Contratar ${custodiosNecesarios} custodios para servicios locales`);
  }
  
  if (deficitPorTipo.deficit_foraneo > 0) {
    const custodiosNecesarios = Math.ceil(deficitPorTipo.deficit_foraneo / (DEFAULT_SERVICE_CONFIG.foraneo.duracion / DEFAULT_CAPACITY_CONFIG.horasDisponibles));
    recomendaciones.push(`Contratar ${custodiosNecesarios} custodios especializados en servicios foráneos`);
  }
  
  if (deficitPorTipo.deficit_express > 0) {
    const custodiosNecesarios = Math.ceil(deficitPorTipo.deficit_express / (DEFAULT_SERVICE_CONFIG.express.duracion / DEFAULT_CAPACITY_CONFIG.horasDisponibles));
    recomendaciones.push(`Contratar ${custodiosNecesarios} custodios para servicios express`);
  }
  
  // Recomendaciones operacionales
  if (ratioRechazo > 0.3) {
    recomendaciones.push("Implementar incentivos para reducir el ratio de rechazo del 25% actual");
  }
  
  if (custodiosActivos < 3) {
    recomendaciones.push("Zona con capacidad crítica - priorizar reclutamiento inmediato");
  }
  
  // Recomendaciones de eficiencia
  if (deficitPorTipo.deficit_local > 0 || deficitPorTipo.deficit_foraneo > 0) {
    recomendaciones.push("Optimizar rutas y tiempos para aumentar la eficiencia operacional");
    recomendaciones.push("Evaluar redistribución de custodios entre zonas geográficas");
  }
  
  if (recomendaciones.length === 0) {
    recomendaciones.push("Capacidad suficiente - mantener nivel actual y monitorear tendencias");
  }
  
  return recomendaciones;
};

/**
 * Simula el impacto de contratar N custodios adicionales
 */
export const simularImpactoContratacion = (
  custodiosActuales: number,
  custodiosAdicionales: number,
  demandaLocal: number,
  demandaForanea: number,
  demandaExpress: number,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
) => {
  const situacionActual = calcularDeficitSegmentado(
    demandaLocal, demandaForanea, demandaExpress, custodiosActuales, config
  );
  
  const situacionConNuevos = calcularDeficitSegmentado(
    demandaLocal, demandaForanea, demandaExpress, custodiosActuales + custodiosAdicionales, config
  );
  
  return {
    situacion_actual: situacionActual,
    situacion_mejorada: situacionConNuevos,
    mejora_deficit: situacionActual.deficit_total - situacionConNuevos.deficit_total,
    nuevas_recomendaciones: generarRecomendacionesInteligentes(
      situacionConNuevos,
      situacionConNuevos.capacidad_efectiva,
      custodiosActuales + custodiosAdicionales,
      config.ratioRechazo
    )
  };
};

/**
 * Analiza la distribución óptima de custodios por tipo de servicio
 */
export const analizarDistribucionOptima = (
  demandaLocal: number,
  demandaForanea: number,
  demandaExpress: number,
  custodiosDisponibles: number,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): { local: number; foraneo: number; express: number; cobertura_total: number } => {
  const demandaTotal = demandaLocal + demandaForanea + demandaExpress;
  
  if (demandaTotal === 0) {
    return { local: 0, foraneo: 0, express: 0, cobertura_total: 0 };
  }
  
  // Distribución proporcional inicial
  const proporcionLocal = demandaLocal / demandaTotal;
  const proporcionForanea = demandaForanea / demandaTotal;
  const proporcionExpress = demandaExpress / demandaTotal;
  
  let custodiosLocal = Math.round(custodiosDisponibles * proporcionLocal);
  let custodiosForaneo = Math.round(custodiosDisponibles * proporcionForanea);
  let custodiosExpress = Math.round(custodiosDisponibles * proporcionExpress);
  
  // Ajustar para que sume exactamente el total disponible
  const diferencia = custodiosDisponibles - (custodiosLocal + custodiosForaneo + custodiosExpress);
  if (diferencia > 0) {
    custodiosLocal += diferencia; // Asignar diferencia a servicios locales
  } else if (diferencia < 0) {
    custodiosLocal = Math.max(0, custodiosLocal + diferencia);
  }
  
  // Calcular cobertura total
  const capacidadLocal = calcularServiciosPosiblesPorTipo(
    calcularCapacidadEfectiva(custodiosLocal, config), 'local', config
  );
  const capacidadForanea = calcularServiciosPosiblesPorTipo(
    calcularCapacidadEfectiva(custodiosForaneo, config), 'foraneo', config
  );
  const capacidadExpress = calcularServiciosPosiblesPorTipo(
    calcularCapacidadEfectiva(custodiosExpress, config), 'express', config
  );
  
  const coberturaTotal = ((capacidadLocal + capacidadForanea + capacidadExpress) / demandaTotal) * 100;
  
  return {
    local: custodiosLocal,
    foraneo: custodiosForaneo,
    express: custodiosExpress,
    cobertura_total: Math.min(coberturaTotal, 100)
  };
};