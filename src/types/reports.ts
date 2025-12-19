// Types for the Historical Reports System

export type ReportGranularity = 'year' | 'month' | 'week' | 'day';

export type ReportModule = 
  | 'cpa'           // Costo por Adquisición
  | 'ltv'           // Lifetime Value
  | 'retention'     // Retención
  | 'engagement'    // Engagement
  | 'supply_growth' // Crecimiento Supply
  | 'conversion'    // Tasa de Conversión
  | 'capacity'      // Capacidad Operativa
  | 'operational'   // Operaciones (servicios, GMV)
  | 'projections'   // Forecast vs Real
  | 'clients';      // Análisis de Clientes

export interface HistoricalReportConfig {
  granularity: ReportGranularity;
  year: number;
  month?: number;      // 1-12 (required if granularity is month, week, or day)
  week?: number;       // 1-52 (required if granularity is week)
  day?: number;        // 1-31 (required if granularity is day)
  modules: ReportModule[];
  includeProjections: boolean;
  compareWithPrevious: boolean;
}

// Mapping of which modules apply to each granularity
export const MODULE_GRANULARITY_SUPPORT: Record<ReportModule, ReportGranularity[]> = {
  cpa: ['year', 'month'],
  ltv: ['year', 'month'],
  retention: ['year', 'month'],
  engagement: ['year', 'month', 'week'],
  supply_growth: ['year', 'month', 'week'],
  conversion: ['year', 'month', 'week'],
  capacity: ['year', 'month', 'week', 'day'],
  operational: ['year', 'month', 'week', 'day'],
  projections: ['year', 'month', 'week', 'day'],
  clients: ['year', 'month'],
};

// Module display names
export const MODULE_LABELS: Record<ReportModule, string> = {
  cpa: 'Costo por Adquisición (CPA)',
  ltv: 'Lifetime Value (LTV)',
  retention: 'Retención',
  engagement: 'Engagement',
  supply_growth: 'Crecimiento Supply',
  conversion: 'Tasa de Conversión',
  capacity: 'Capacidad Operativa',
  operational: 'Operacional',
  projections: 'Proyecciones',
  clients: 'Análisis de Clientes',
};

// Granularity display names
export const GRANULARITY_LABELS: Record<ReportGranularity, string> = {
  year: 'Anual',
  month: 'Mensual',
  week: 'Semanal',
  day: 'Diario',
};

// Report section data types
export interface CPAReportData {
  formula: string;
  yearlyData: {
    totalCosts: number;
    newCustodians: number;
    cpaPromedio: number;
    costBreakdown: {
      category: string;
      amount: number;
      percentage: number;
    }[];
  };
  currentMonthData: {
    month: string;
    costs: number;
    newCustodians: number;
    cpa: number;
    costBreakdown: {
      category: string;
      amount: number;
    }[];
  };
  monthlyEvolution: {
    month: string;
    costs: number;
    newCustodians: number;
    cpa: number;
  }[];
}

export interface LTVReportData {
  formula: string;
  tiempoVidaPromedio: number;
  yearlyData: {
    totalCustodios: number;
    ingresosTotales: number;
    ingresoPromedioPorCustodio: number;
    ltvGeneral: number;
  };
  momComparison: {
    ltvActual: number;
    ltvMesAnterior: number;
    cambioAbsoluto: number;
    cambioRelativo: number;
    tendencia: 'up' | 'down' | 'stable';
  };
  quarterlyData: {
    quarter: string;
    ltvPromedio: number;
    custodiosPromedio: number;
    ingresosTotales: number;
    cambioVsQuarterAnterior: number | null;
  }[];
  projections: {
    optimista: number;
    actual: number;
    conservador: number;
  };
  monthlyBreakdown: {
    month: string;
    custodiosActivos: number;
    ingresosTotales: number;
    ingresoPromedioPorCustodio: number;
    ltvCalculado: number;
  }[];
}

export interface RetentionReportData {
  formula: string;
  yearlyData: {
    retentionPromedio: number;
    totalCustodiosRetenidos: number;
    totalCustodiosAnteriores: number;
    mesesConDatos: number;
    tiempoPromedioPermanenciaGeneral: number;
    custodiosUltimoQCompletado: number;
    labelUltimoQCompletado: string;
  };
  currentMonthData: {
    custodiosAnterior: number;
    custodiosActual: number;
    custodiosRetenidos: number;
    custodiosNuevos: number;
    custodiosPerdidos: number;
    tasaRetencion: number;
    tiempoPromedioPermanencia: number;
  };
  cohortAnalysis: {
    cohortMonth: string;
    month0: number;
    month1: number;
    month2: number;
    month3: number;
    month4: number;
    month5: number;
    month6: number;
  }[];
  quarterlyData: {
    quarter: string;
    avgRetention: number;
    avgPermanence: number;
    custodians: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  monthlyBreakdown: {
    month: string;
    monthName: string;
    custodiosAnterior: number;
    custodiosRetenidos: number;
    custodiosNuevos: number;
    custodiosPerdidos: number;
    tasaRetencion: number;
    tiempoPromedioPermanencia: number;
  }[];
}

export interface EngagementReportData {
  formula: string;
  yearlyData: {
    totalServices: number;
    totalCustodians: number;
    averageEngagement: number;
  };
  currentMonthData: {
    month: string;
    services: number;
    custodians: number;
    engagement: number;
  };
  monthlyEvolution: {
    month: string;
    services: number;
    custodians: number;
    engagement: number;
  }[];
}

export interface SupplyGrowthReportData {
  summary: {
    crecimientoPromedioMensual: number;
    crecimientoNetoAnual: number;
    custodiosActivosActuales: number;
    custodiosNuevosAnual: number;
    custodiosPerdidosAnual: number;
    mejorMes: { mes: string; crecimiento: number };
    peorMes: { mes: string; crecimiento: number };
    tendencia: 'creciendo' | 'decreciendo' | 'estable';
    velocidadCrecimiento: number;
  };
  qualityMetrics: {
    custodiosConMas5Servicios: number;
    custodiosConMenos1Servicio: number;
    promedioServiciosPorCustodio: number;
    custodiosTop10Percent: number;
    ingresoPromedioPorCustodio: number;
    custodiosConIngresosCero: number;
  };
  monthlyData: {
    month: string;
    monthName: string;
    custodiosActivos: number;
    custodiosNuevos: number;
    custodiosPerdidos: number;
    crecimientoNeto: number;
    crecimientoPorcentual: number;
  }[];
}

export interface ConversionReportData {
  formula: string;
  yearlyData: {
    totalLeads: number;
    totalNewCustodians: number;
    conversionRate: number;
  };
  currentMonthData: {
    month: string;
    leads: number;
    newCustodians: number;
    conversionRate: number;
  };
  monthlyBreakdown: {
    month: string;
    leads: number;
    newCustodians: number;
    conversionRate: number;
  }[];
}

export interface CapacityReportData {
  currentCapacity: {
    totalCustodians: number;
    availableToday: number;
    unavailable: {
      returningFromForeign: number;
      currentlyOnRoute: number;
    };
  };
  capacityByServiceType: {
    local: number;
    regional: number;
    foraneo: number;
  };
  monthlyCapacity: {
    total: number;
    forecastCurrentMonth: number;
    servicesMTD: number;
    utilizationVsForecast: number;
    gap: number;
  };
  utilizationMetrics: {
    current: number;
    healthy: number;
    maxSafe: number;
  };
  fleetEfficiency: {
    availableCustodians: number;
    servicesPerCustodianMonth: number;
    operationalEfficiency: number;
  };
}

export interface OperationalReportData {
  services: {
    total: number;
    completed: number;
    completedPercent: number;
    cancelled: number;
    cancelledPercent: number;
    pending: number;
    pendingPercent: number;
  };
  gmv: {
    total: number;
    aov: number;
  };
  comparatives: {
    servicesThisMonth: { current: number; previous: number; changePercent: number };
    servicesYTD: { current: number; previous: number; changePercent: number };
    gmvThisMonth: { current: number; previous: number; changePercent: number };
    aovThisMonth: { current: number; previous: number; changePercent: number };
    completionRate: { current: number; previous: number; changePercent: number };
    avgKmPerService: { current: number; previous: number; changePercent: number };
    gmvYTD: { current: number; previous: number; changePercent: number };
    avgDailyGMV: { current: number; previous: number; changePercent: number };
  };
  topCustodians: {
    rank: number;
    name: string;
    services: number;
    costoCustodio: number;
    promedioCostoMes: number;
    mesesActivos: number;
    gmv: number;
    margen: number;
    coberturaDatos: number;
  }[];
  topClients: {
    rank: number;
    name: string;
    services: number;
    gmv: number;
    aov: number;
  }[];
  monthlyBreakdown: {
    month: string;
    monthNumber: number;
    services: number;
    completedServices: number;
    gmv: number;
    aov: number;
    completionRate: number;
  }[];
}

export interface ProjectionsReportData {
  forecastVsReal: {
    month: string;
    forecast: number;
    real: number;
    difference: number;
    mape: number;
  }[];
  annualProjection: {
    optimistic: number;
    expected: number;
    conservative: number;
  };
  modelPrecision: {
    mapePromedio: number;
    desviacionEstandar: number;
  };
  dailyBreakdown?: {
    day: number;
    forecast: number;
    real: number;
    difference: number;
  }[];
}

// Client Analysis Report Data
export interface ClientsReportData {
  summary: {
    totalClients: number;
    activeClients: number;
    newClientsThisPeriod: number;
    avgServicesPerClient: number;
    avgGmvPerClient: number;
    totalGMV: number;
  };
  topClients: {
    rank: number;
    name: string;
    services: number;
    gmv: number;
    aov: number;
    completionRate: number;
    growth: number;
  }[];
  serviceTypeAnalysis: {
    foraneo: { count: number; percentage: number; avgValue: number; gmv: number };
    local: { count: number; percentage: number; avgValue: number; gmv: number };
  };
  clientConcentration: {
    top5Percent: number;
    top10Percent: number;
    hhi: number;
  };
  atRiskClients: {
    name: string;
    lastServiceDate: string;
    daysSinceLastService: number;
    historicalGmv: number;
  }[];
  monthlyGMVEvolution: {
    month: string;
    gmv: number;
    clientCount: number;
  }[];
}

// Complete report data structure
export interface HistoricalReportData {
  config: HistoricalReportConfig;
  generatedAt: string;
  periodLabel: string;
  cpa?: CPAReportData;
  ltv?: LTVReportData;
  retention?: RetentionReportData;
  engagement?: EngagementReportData;
  supplyGrowth?: SupplyGrowthReportData;
  conversion?: ConversionReportData;
  capacity?: CapacityReportData;
  operational?: OperationalReportData;
  projections?: ProjectionsReportData;
  clients?: ClientsReportData;
}
