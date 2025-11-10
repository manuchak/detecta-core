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
