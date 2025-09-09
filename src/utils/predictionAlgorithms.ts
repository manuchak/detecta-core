// Algoritmos de predicción basados en lógica de negocio real

export interface CapacityConfig {
  horasDisponibles: number;
  ratioRechazo: number;
  eficienciaOperacional: number;
  diasLaborablesLocal: number;
  diasNoDisponibleForaneo: number;
}

export interface ServiceTypeConfig {
  local: { duracion: number; complejidad: number; disponibilidad: number };
  foraneo: { duracion: number; complejidad: number; disponibilidad: number };
  express: { duracion: number; complejidad: number; disponibilidad: number };
}

export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  horasDisponibles: 16,
  ratioRechazo: 0.25, // 25% de rechazo de servicios
  eficienciaOperacional: 0.85, // 85% de eficiencia
  diasLaborablesLocal: 5, // 5 días por semana para servicios locales
  diasNoDisponibleForaneo: 2 // 2 días no disponible por servicio foráneo
};

export const DEFAULT_SERVICE_CONFIG: ServiceTypeConfig = {
  local: { duracion: 6, complejidad: 3, disponibilidad: 0.71 }, // 5/7 días disponible
  foraneo: { duracion: 14, complejidad: 7, disponibilidad: 0.5 }, // 1/2 días disponible (viaje vacío + servicio)
  express: { duracion: 4, complejidad: 5, disponibilidad: 0.8 } // 4/5 días disponible
};

// Configuración mejorada basada en datos reales de últimos 3 meses
// 83 custodios activos, 2,446 servicios completados (29 servicios/custodio promedio)
export interface ImprovedServiceConfig {
  local: { duracion: number; disponibilidad: number; recuperacion: number };
  regional: { duracion: number; disponibilidad: number; recuperacion: number };
  foraneo: { duracion: number; disponibilidad: number; recuperacion: number };
}

export const IMPROVED_SERVICE_CONFIG: ImprovedServiceConfig = {
  local: { 
    duracion: 3, // 2-4 horas promedio para servicios ≤50km
    disponibilidad: 0.8, // Puede hacer varios al día
    recuperacion: 2 // 2 horas de descanso entre servicios
  },
  regional: { 
    duracion: 6, // 4-8 horas para servicios 51-200km  
    disponibilidad: 0.5, // Uno por día típicamente
    recuperacion: 8 // 8 horas de descanso recomendado
  },
  foraneo: { 
    duracion: 10, // 6h servicio + 4h retorno promedio (>200km)
    disponibilidad: 0.3, // Requiere día completo + descanso
    recuperacion: 12 // 12 horas mínimo de descanso post-foráneo
  }
};

export interface HealthyWorkConfig {
  targetUtilization: number; // % ideal de utilización
  maxSafeUtilization: number; // % máximo recomendado
  minRestBetweenServices: number; // Horas mínimas entre servicios
  maxServicesPerDay: number; // Servicios máximos por custodio/día
  idealRestForaneo: number; // Descanso ideal post-foráneo
  maxRestForaneo: number; // Descanso máximo post-foráneo
}

export const HEALTHY_WORK_CONFIG: HealthyWorkConfig = {
  targetUtilization: 75, // 75% utilización óptima
  maxSafeUtilization: 85, // 85% utilización máxima segura
  minRestBetweenServices: 2, // 2 horas mínimo entre servicios
  maxServicesPerDay: 3, // Máximo 3 servicios por día por custodio
  idealRestForaneo: 8, // 8 horas ideal post-foráneo
  maxRestForaneo: 12 // 12 horas máximo post-foráneo
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
 * Calcula servicios posibles por día considerando disponibilidad real del custodio
 */
export const calcularServiciosPosiblesPorTipo = (
  capacidadEfectiva: number,
  tipoServicio: keyof ServiceTypeConfig,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG,
  serviceConfig: ServiceTypeConfig = DEFAULT_SERVICE_CONFIG
): number => {
  const duracionServicio = serviceConfig[tipoServicio].duracion;
  const disponibilidad = serviceConfig[tipoServicio].disponibilidad;
  const serviciosPorCustodio = (config.horasDisponibles / duracionServicio) * disponibilidad;
  return capacidadEfectiva * serviciosPorCustodio;
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

/**
 * Calcula capacidad realista considerando descanso y trabajo saludable
 */
export const calcularCapacidadRealistaConDescanso = (
  custodiosNominales: number,
  config: CapacityConfig = DEFAULT_CAPACITY_CONFIG
): number => {
  // Factor de disponibilidad real considerando descansos y rotación
  const factorDisponibilidadReal = 0.75; // 75% disponibilidad real
  return custodiosNominales * factorDisponibilidadReal * config.eficienciaOperacional;
};

/**
 * Calcula servicios posibles por tipo con algoritmos mejorados
 */
export const calcularServiciosPosiblesPorTipoMejorado = (
  capacidadEfectiva: number,
  tipoServicio: keyof ImprovedServiceConfig,
  config: HealthyWorkConfig = HEALTHY_WORK_CONFIG
): number => {
  const serviceConfig = IMPROVED_SERVICE_CONFIG[tipoServicio];
  const horasDisponiblesPorDia = 16; // 16 horas máximo por día
  
  // Servicios posibles por custodio por día
  const serviciosPorCustodioPorDia = Math.min(
    Math.floor(horasDisponiblesPorDia / (serviceConfig.duracion + serviceConfig.recuperacion)),
    config.maxServicesPerDay
  );
  
  // Aplicar factor de disponibilidad y utilización saludable
  const serviciosDiarios = capacidadEfectiva * serviciosPorCustodioPorDia * serviceConfig.disponibilidad * (config.targetUtilization / 100);
  
  return Math.max(0, serviciosDiarios);
};

/**
 * Analiza la brecha entre capacidad y demanda proyectada
 */
export const analizarBrechaCapacidadVsForecast = (
  capacidadMensual: number,
  demandaProyectada: number,
  tipoAnalisis: 'optimista' | 'realista' | 'pesimista' = 'realista'
): {
  brecha: number;
  brechaPocentual: number;
  estado: 'surplus' | 'equilibrio' | 'deficit';
  recomendacion: string;
} => {
  const factorAjuste = tipoAnalisis === 'optimista' ? 0.9 : tipoAnalisis === 'pesimista' ? 1.1 : 1.0;
  const demandaAjustada = demandaProyectada * factorAjuste;
  
  const brecha = capacidadMensual - demandaAjustada;
  const brechaPocentual = demandaAjustada > 0 ? (brecha / demandaAjustada) * 100 : 0;
  
  let estado: 'surplus' | 'equilibrio' | 'deficit';
  let recomendacion: string;
  
  if (brechaPocentual > 20) {
    estado = 'surplus';
    recomendacion = 'Capacidad excedente - evaluar expansión de mercado';
  } else if (brechaPocentual < -10) {
    estado = 'deficit';
    const custodiosNecesarios = Math.ceil(Math.abs(brecha) / 29); // Promedio 29 servicios por custodio
    recomendacion = `Déficit crítico - contratar ${custodiosNecesarios} custodios`;
  } else {
    estado = 'equilibrio';
    recomendacion = 'Capacidad balanceada - monitorear tendencias';
  }
  
  return {
    brecha: Math.round(brecha),
    brechaPocentual: Math.round(brechaPocentual * 10) / 10,
    estado,
    recomendacion
  };
};