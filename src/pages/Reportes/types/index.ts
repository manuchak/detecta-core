export interface AreaPerformanceMetrics {
  // Volumen de Trabajo
  totalServiciosCreados: number;
  serviciosPorDia: number;
  tendenciaMensual: number; // % cambio vs mes anterior
  
  // Eficiencia Operativa
  tasaAceptacion: number; // % servicios aceptados
  tiempoMedioAsignacion: number; // minutos
  serviciosCompletadosATiempo: number; // %
  
  // Calidad del Servicio
  serviciosConIncidencias: number;
  tasaReplanificacion: number; // %
  cumplimientoArmados: number; // %
  
  // Recursos
  custodiosActivosPromedio: number;
  armadosActivosPromedio: number;
  utilizacionRecursos: number; // %
  
  // Distribuciones
  serviciosPorEstado: Record<string, number>;
  serviciosPorTipo: Record<string, number>;
  
  // Serie temporal (últimos 30 días)
  historicoServicios: Array<{
    fecha: string;
    creados: number;
    completados: number;
    cancelados: number;
  }>;
}

export interface PlanificadorPerformance {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  
  // Productividad
  serviciosCreados: number;
  serviciosPorDia: number;
  tiempoPromedioAsignacion: number; // minutos
  
  // Calidad
  tasaAceptacion: number; // %
  tasaCompletado: number; // %
  serviciosConIncidencias: number;
  serviciosConIncidenciasPorcentaje: number;
  
  // Eficiencia de Recursos
  custodiosDistintos: number;
  armadosDistintos: number;
  
  // Métricas de Ranking
  score: number; // 0-100 (ponderado)
  ranking: number; // posición 1-N
  tendenciaSemanal: number; // % cambio vs semana anterior
  
  // Estado actual
  serviciosActivosAhora: number;
}

export type PeriodoReporte = 'semana' | 'mes' | 'trimestre' | 'year';
export type CriterioOrdenamiento = 'score' | 'servicios' | 'calidad' | 'eficiencia';

export interface AdoptionMetrics {
  mesActual: {
    planificados: number;
    ejecutados: number;
    tasaAdopcion: number;
    brechaServicios: number;
  };
  mesAnterior: {
    planificados: number;
    ejecutados: number;
    tasaAdopcion: number;
  };
  tendenciaMensual: number;
  metaAdopcion: number;
  historicoAdopcion: Array<{
    mes: string;
    mesLabel: string;
    planificados: number;
    ejecutados: number;
    tasaAdopcion: number;
    sinPlanificar: number;
  }>;
  proyeccion: {
    fechaMeta100: string | null;
    tendenciaPromedio: number;
  };
}

// ============================================
// PROVEEDORES EXTERNOS (Modelo 12h)
// ============================================
export interface ProveedoresExternosMetrics {
  utilizacion: {
    serviciosTotales: number;
    duracionPromedio: number;
    indiceAprovechamiento: number;
    horasDesperdiciadas: number;
    revenueLeakage: number;
    costoEfectivoPorHora: number;
    tarifaBase: number;
  };
  
  distribucionDuracion: Array<{
    rango: string;
    servicios: number;
    porcentaje: number;
    colorSemaforo: 'rojo' | 'amarillo' | 'verde';
  }>;
  
  porProveedor: Array<{
    id: string;
    nombre: string;
    esquemaPago: string;
    tarifaBase: number;
    servicios: number;
    duracionPromedio: number;
    aprovechamiento: number;
    revenueLeakage: number;
    rating: number;
  }>;
  
  alertas: Array<{
    tipo: 'SUBUTILIZACION_CRITICA' | 'EXCESO_HORAS_EXTRA' | 'OPORTUNIDAD_CONSOLIDACION';
    severidad: 'alta' | 'media' | 'baja';
    descripcion: string;
    impactoFinanciero: number;
    accionSugerida: string;
  }>;
  
  evolucionMensual: Array<{
    mes: string;
    servicios: number;
    aprovechamiento: number;
    revenueLeakage: number;
  }>;
}

// ============================================
// ARMADOS INTERNOS (Modelo por Km)
// ============================================
export interface ArmadosInternosMetrics {
  resumen: {
    serviciosTotales: number;
    kmTotales: number;
    kmPromedio: number;
    costoTotal: number;
    costoPromedioServicio: number;
  };
  
  distribucionKm: Array<{
    rango: string;
    kmMin: number;
    kmMax: number;
    tarifaPorKm: number;
    servicios: number;
    porcentaje: number;
    kmTotales: number;
    costoTotal: number;
    costoPromedio: number;
  }>;
  
  porArmado: Array<{
    id: string;
    nombre: string;
    servicios: number;
    kmTotales: number;
    kmPromedio: number;
    costoTotal: number;
    diasActivos: number;
    capacidadDisponible: number;
    rating: number;
  }>;
  
  eficiencia: {
    armadosConCapacidad: number;
    capacidadTotalDisponible: number;
    serviciosRutasLargas: number;
    pctRutasLargas: number;
  };
  
  calidadDatos: {
    totalRegistros: number;
    registrosValidos: number;
    registrosSinKm: number;
    registrosAnomalos: number;
    pctDatosConfiables: number;
  };
  
  alertas: Array<{
    tipo: 'DATOS_INVALIDOS' | 'CAPACIDAD_OCIOSA' | 'CONCENTRACION_RUTAS_CORTAS';
    severidad: 'alta' | 'media' | 'baja';
    descripcion: string;
    accionSugerida: string;
  }>;
}

// ============================================
// AUDITORÍA DE EQUIDAD (Fairness)
// ============================================
export interface FairnessAuditMetrics {
  indices: {
    gini: number;
    giniInterpretacion: 'bajo' | 'moderado' | 'alto';
    entropia: number;
    entropiaMaxima: number;
    entropiaPct: number;
    hhi: number;
    hhiInterpretacion: 'baja' | 'moderada' | 'alta';
    palmaRatio: number;
  };
  
  custodiosDesviados: Array<{
    id: string;
    nombre: string;
    servicios: number;
    zScore: number;
    categoria: 'MUY_FAVORECIDO' | 'FAVORECIDO' | 'NORMAL' | 'SUBFAVORECIDO' | 'MUY_SUBFAVORECIDO';
    desviacionPct: number;
  }>;
  
  sesgoPlanificadores: Array<{
    planificadorId: string;
    nombre: string;
    totalAsignaciones: number;
    custodiosUnicos: number;
    indiceDiversidad: number;
    maxAsignacionesMismoCustodio: number;
    custodioMasAsignado: string;
    alertaSesgo: boolean;
  }>;
  
  evolucionEquidad: Array<{
    periodo: string;
    gini: number;
    entropia: number;
    custodiosFavorecidos: number;
  }>;
  
  alertas: Array<{
    tipo: 'GINI_ALTO' | 'CONCENTRACION' | 'SESGO_PLANIFICADOR' | 'CUSTODIO_FAVORECIDO';
    severidad: 'alta' | 'media' | 'baja';
    descripcion: string;
    entidadAfectada: string;
    valorActual: number;
    umbralViolado: number;
    recomendacion: string;
  }>;
  
  recomendaciones: Array<{
    prioridad: 'alta' | 'media' | 'baja';
    accion: string;
    impactoEsperado: string;
    custodiosAfectados?: string[];
  }>;
}
