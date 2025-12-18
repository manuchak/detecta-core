import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { 
  HistoricalReportConfig, 
  HistoricalReportData 
} from '@/types/reports';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const createCPASheet = (data: HistoricalReportData['cpa']): XLSX.WorkSheet | null => {
  if (!data) return null;

  const rows: (string | number)[][] = [
    ['CPA - COSTO POR ADQUISICIÓN'],
    [''],
    [data.formula],
    [''],
    ['ACUMULADO ANUAL'],
    ['Costos Totales', data.yearlyData.totalCosts],
    ['Custodios Nuevos', data.yearlyData.newCustodians],
    ['CPA Promedio', data.yearlyData.cpaPromedio],
    [''],
    ['DESGLOSE DE COSTOS'],
    ['Categoría', 'Monto', 'Porcentaje'],
    ...data.yearlyData.costBreakdown.map(item => [item.category, item.amount, item.percentage]),
    [''],
    ['DETALLE MENSUAL'],
    ['Mes', 'Costos', 'Custodios Nuevos', 'CPA'],
    ...data.monthlyEvolution.map(m => [m.month, m.costs, m.newCustodians, m.cpa])
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

const createLTVSheet = (data: HistoricalReportData['ltv']): XLSX.WorkSheet | null => {
  if (!data) return null;

  const rows: (string | number)[][] = [
    ['LTV - LIFETIME VALUE'],
    [''],
    [data.formula],
    [''],
    ['DATOS DEL PERÍODO'],
    ['Custodios Activos', data.yearlyData.totalCustodios],
    ['Ingresos Totales', data.yearlyData.ingresosTotales],
    ['Ingreso/Custodio', data.yearlyData.ingresoPromedioPorCustodio],
    ['LTV General', data.yearlyData.ltvGeneral],
    ['Tiempo de Vida Promedio (meses)', data.tiempoVidaPromedio],
    [''],
    ['COMPARATIVO MoM'],
    ['LTV Actual', data.momComparison.ltvActual],
    ['LTV Mes Anterior', data.momComparison.ltvMesAnterior],
    ['Cambio Absoluto', data.momComparison.cambioAbsoluto],
    ['Cambio Relativo (%)', data.momComparison.cambioRelativo],
    ['Tendencia', data.momComparison.tendencia],
    [''],
    ['ANÁLISIS TRIMESTRAL'],
    ['Trimestre', 'LTV Promedio', 'Custodios', 'Ingresos', 'Variación vs Q Anterior (%)'],
    ...data.quarterlyData.map(q => [q.quarter, q.ltvPromedio, q.custodiosPromedio, q.ingresosTotales, q.cambioVsQuarterAnterior || 'N/A']),
    [''],
    ['PROYECCIONES'],
    ['Escenario Optimista (+15%)', data.projections.optimista],
    ['Escenario Actual', data.projections.actual],
    ['Escenario Conservador (-15%)', data.projections.conservador],
    [''],
    ['DETALLE MENSUAL'],
    ['Mes', 'Custodios Activos', 'Ingresos Totales', 'Ingreso/Custodio', 'LTV'],
    ...data.monthlyBreakdown.map(m => [m.month, m.custodiosActivos, m.ingresosTotales, m.ingresoPromedioPorCustodio, m.ltvCalculado])
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

const createRetentionSheet = (data: HistoricalReportData['retention']): XLSX.WorkSheet | null => {
  if (!data) return null;

  const rows: (string | number)[][] = [
    ['RETENCIÓN'],
    [''],
    [data.formula],
    [''],
    ['RESUMEN ANUAL'],
    ['Retención Promedio (%)', data.yearlyData.retentionPromedio],
    ['Total Retenidos', data.yearlyData.totalCustodiosRetenidos],
    ['Tiempo Promedio Permanencia (meses)', data.yearlyData.tiempoPromedioPermanenciaGeneral],
    ['Meses con Datos', data.yearlyData.mesesConDatos],
    [''],
    ['MES ACTUAL'],
    ['Custodios Anterior', data.currentMonthData.custodiosAnterior],
    ['Custodios Retenidos', data.currentMonthData.custodiosRetenidos],
    ['Custodios Nuevos', data.currentMonthData.custodiosNuevos],
    ['Custodios Perdidos', data.currentMonthData.custodiosPerdidos],
    ['Tasa Retención (%)', data.currentMonthData.tasaRetencion],
    [''],
    ['DETALLE MENSUAL'],
    ['Mes', 'Anterior', 'Retenidos', 'Nuevos', 'Perdidos', 'Tasa Retención (%)'],
    ...data.monthlyBreakdown.map(m => [
      m.monthName, 
      m.custodiosAnterior, 
      m.custodiosRetenidos, 
      m.custodiosNuevos, 
      m.custodiosPerdidos, 
      m.tasaRetencion
    ]),
    [''],
    ['ANÁLISIS DE COHORTES'],
    ['Cohorte', 'Mes 0', 'Mes 1 (%)', 'Mes 2 (%)', 'Mes 3 (%)', 'Mes 4 (%)', 'Mes 5 (%)', 'Mes 6 (%)'],
    ...data.cohortAnalysis.map(c => [
      c.cohortMonth,
      c.month0,
      c.month1,
      c.month2,
      c.month3,
      c.month4,
      c.month5,
      c.month6
    ])
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

const createEngagementSheet = (data: HistoricalReportData['engagement']): XLSX.WorkSheet | null => {
  if (!data) return null;

  const rows: (string | number)[][] = [
    ['ENGAGEMENT'],
    [''],
    [data.formula],
    [''],
    ['DATOS DEL PERÍODO'],
    ['Total Servicios', data.yearlyData.totalServices],
    ['Custodios Activos', data.yearlyData.totalCustodians],
    ['Engagement Promedio', data.yearlyData.averageEngagement],
    [''],
    ['MES ACTUAL'],
    ['Mes', data.currentMonthData.month],
    ['Servicios', data.currentMonthData.services],
    ['Custodios', data.currentMonthData.custodians],
    ['Engagement', data.currentMonthData.engagement],
    [''],
    ['DETALLE MENSUAL'],
    ['Mes', 'Servicios', 'Custodios Activos', 'Engagement'],
    ...data.monthlyEvolution.map(m => [m.month, m.services, m.custodians, m.engagement])
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

const createSupplyGrowthSheet = (data: HistoricalReportData['supplyGrowth']): XLSX.WorkSheet | null => {
  if (!data) return null;

  const rows: (string | number)[][] = [
    ['SUPPLY GROWTH - CRECIMIENTO'],
    [''],
    ['RESUMEN ANUAL'],
    ['Crecimiento Promedio Mensual (%)', data.summary.crecimientoPromedioMensual],
    ['Crecimiento Neto Anual', data.summary.crecimientoNetoAnual],
    ['Custodios Activos Actuales', data.summary.custodiosActivosActuales],
    ['Custodios Nuevos (Anual)', data.summary.custodiosNuevosAnual],
    ['Custodios Perdidos (Anual)', data.summary.custodiosPerdidosAnual],
    ['Tendencia', data.summary.tendencia],
    [''],
    ['INSIGHTS'],
    ['Mejor Mes', data.summary.mejorMes.mes, `${data.summary.mejorMes.crecimiento}%`],
    ['Peor Mes', data.summary.peorMes.mes, `${data.summary.peorMes.crecimiento}%`],
    [''],
    ['MÉTRICAS DE CALIDAD'],
    ['Custodios con >5 Servicios', data.qualityMetrics.custodiosConMas5Servicios],
    ['Custodios con <1 Servicio', data.qualityMetrics.custodiosConMenos1Servicio],
    ['Promedio Servicios/Custodio', data.qualityMetrics.promedioServiciosPorCustodio],
    ['Ingreso Promedio/Custodio', data.qualityMetrics.ingresoPromedioPorCustodio],
    [''],
    ['DETALLE MENSUAL'],
    ['Mes', 'Custodios Activos', 'Nuevos', 'Perdidos', 'Crecimiento Neto', 'Crecimiento (%)'],
    ...data.monthlyData.map(m => [
      m.monthName, 
      m.custodiosActivos, 
      m.custodiosNuevos, 
      m.custodiosPerdidos,
      m.crecimientoNeto,
      m.crecimientoPorcentual
    ])
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

const createConversionSheet = (data: HistoricalReportData['conversion']): XLSX.WorkSheet | null => {
  if (!data) return null;

  const rows: (string | number)[][] = [
    ['CONVERSIÓN'],
    [''],
    [data.formula],
    [''],
    ['DATOS DEL PERÍODO'],
    ['Total Leads', data.yearlyData.totalLeads],
    ['Total Convertidos', data.yearlyData.totalNewCustodians],
    ['Tasa Conversión (%)', data.yearlyData.conversionRate],
    [''],
    ['MES ACTUAL'],
    ['Mes', data.currentMonthData.month],
    ['Leads', data.currentMonthData.leads],
    ['Convertidos', data.currentMonthData.newCustodians],
    ['Tasa Conversión (%)', data.currentMonthData.conversionRate],
    [''],
    ['DETALLE MENSUAL'],
    ['Mes', 'Leads', 'Convertidos', 'Tasa Conversión (%)'],
    ...data.monthlyBreakdown.map(m => [m.month, m.leads, m.newCustodians, m.conversionRate])
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

const createCapacitySheet = (data: HistoricalReportData['capacity']): XLSX.WorkSheet | null => {
  if (!data) return null;

  const rows: (string | number)[][] = [
    ['CAPACIDAD OPERATIVA'],
    [''],
    ['CAPACIDAD ACTUAL'],
    ['Custodios Totales', data.currentCapacity.totalCustodians],
    ['Disponibles Hoy', data.currentCapacity.availableToday],
    ['Retornando de Foráneo', data.currentCapacity.unavailable.returningFromForeign],
    ['En Ruta Actualmente', data.currentCapacity.unavailable.currentlyOnRoute],
    [''],
    ['CAPACIDAD POR TIPO DE SERVICIO'],
    ['Locales (≤50km)', data.capacityByServiceType.local],
    ['Regionales (51-200km)', data.capacityByServiceType.regional],
    ['Foráneos (>200km)', data.capacityByServiceType.foraneo],
    [''],
    ['CAPACIDAD MENSUAL'],
    ['Capacidad Total', data.monthlyCapacity.total],
    ['Forecast Mes Actual', data.monthlyCapacity.forecastCurrentMonth],
    ['Servicios MTD', data.monthlyCapacity.servicesMTD],
    ['Utilización vs Forecast (%)', data.monthlyCapacity.utilizationVsForecast],
    ['Gap', data.monthlyCapacity.gap],
    [''],
    ['MÉTRICAS DE UTILIZACIÓN'],
    ['Actual (%)', data.utilizationMetrics.current],
    ['Objetivo Saludable (%)', data.utilizationMetrics.healthy],
    ['Máximo Seguro (%)', data.utilizationMetrics.maxSafe],
    [''],
    ['EFICIENCIA DE FLOTA'],
    ['Custodios Disponibles', data.fleetEfficiency.availableCustodians],
    ['Servicios/Custodio/Mes', data.fleetEfficiency.servicesPerCustodianMonth],
    ['Eficiencia Operativa (%)', data.fleetEfficiency.operationalEfficiency]
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

const createOperationalSheet = (data: HistoricalReportData['operational']): XLSX.WorkSheet | null => {
  if (!data) return null;

  const rows: (string | number)[][] = [
    ['OPERACIONAL'],
    [''],
    ['SERVICIOS'],
    ['Total', data.services.total],
    ['Completados', data.services.completed, `${data.services.completedPercent}%`],
    ['Cancelados', data.services.cancelled, `${data.services.cancelledPercent}%`],
    ['Pendientes', data.services.pending, `${data.services.pendingPercent}%`],
    [''],
    ['GMV'],
    ['Total', data.gmv.total],
    ['AOV', data.gmv.aov],
    [''],
    ['COMPARATIVOS'],
    ['Métrica', 'Actual', 'Anterior', 'Cambio (%)'],
    ['Servicios Este Mes', data.comparatives.servicesThisMonth.current, data.comparatives.servicesThisMonth.previous, data.comparatives.servicesThisMonth.changePercent],
    ['Servicios YTD', data.comparatives.servicesYTD.current, data.comparatives.servicesYTD.previous, data.comparatives.servicesYTD.changePercent],
    ['GMV Este Mes', data.comparatives.gmvThisMonth.current, data.comparatives.gmvThisMonth.previous, data.comparatives.gmvThisMonth.changePercent],
    ['AOV Este Mes', data.comparatives.aovThisMonth.current, data.comparatives.aovThisMonth.previous, data.comparatives.aovThisMonth.changePercent],
    [''],
    ['DETALLE MENSUAL'],
    ['Mes', 'Servicios', 'GMV', 'AOV', 'Tasa Completado (%)'],
    ...data.monthlyBreakdown.map(m => [m.month, m.services, m.gmv, m.aov, m.completionRate]),
    [''],
    ['TOP 10 CUSTODIOS'],
    ['Rank', 'Nombre', 'Servicios', 'GMV', 'Cumplimiento (%)', 'KM Promedio'],
    ...data.topCustodians.map(c => [c.rank, c.name, c.services, c.gmv, c.completionPercent, c.avgKm]),
    [''],
    ['TOP 10 CLIENTES'],
    ['Rank', 'Cliente', 'Servicios', 'GMV', 'AOV', 'Tendencia'],
    ...data.topClients.map(c => [c.rank, c.name, c.services, c.gmv, c.aov, c.trend])
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

const createProjectionsSheet = (data: HistoricalReportData['projections']): XLSX.WorkSheet | null => {
  if (!data) return null;

  const rows: (string | number)[][] = [
    ['PROYECCIONES'],
    [''],
    ['PRECISIÓN DEL MODELO'],
    ['MAPE Promedio (%)', data.modelPrecision.mapePromedio],
    ['Desviación Estándar (%)', data.modelPrecision.desviacionEstandar],
    [''],
    ['PROYECCIÓN ANUAL'],
    ['Escenario Optimista', data.annualProjection.optimistic],
    ['Escenario Esperado', data.annualProjection.expected],
    ['Escenario Conservador', data.annualProjection.conservative],
    [''],
    ['FORECAST VS REAL'],
    ['Mes', 'Forecast', 'Real', 'Diferencia', 'MAPE (%)'],
    ...data.forecastVsReal.map(m => [m.month, m.forecast, m.real, m.difference, m.mape])
  ];

  return XLSX.utils.aoa_to_sheet(rows);
};

export const exportHistoricalReportToExcel = async (
  config: HistoricalReportConfig,
  data: HistoricalReportData
): Promise<boolean> => {
  try {
    document.body.style.cursor = 'wait';

    const workbook = XLSX.utils.book_new();

    // Create summary sheet
    const summaryRows: (string | number)[][] = [
      ['INFORME HISTÓRICO'],
      [''],
      ['Configuración del Informe'],
      ['Granularidad', config.granularity],
      ['Año', config.year],
      ['Mes', config.month || 'N/A'],
      ['Semana', config.week || 'N/A'],
      ['Día', config.day || 'N/A'],
      [''],
      ['Módulos Incluidos'],
      ...config.modules.map(m => [m]),
      [''],
      ['Generado el', format(new Date(), 'dd/MM/yyyy HH:mm')]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Create sheets for each module
    const sheetCreators: Record<string, () => XLSX.WorkSheet | null> = {
      cpa: () => createCPASheet(data.cpa),
      ltv: () => createLTVSheet(data.ltv),
      retention: () => createRetentionSheet(data.retention),
      engagement: () => createEngagementSheet(data.engagement),
      supply_growth: () => createSupplyGrowthSheet(data.supplyGrowth),
      conversion: () => createConversionSheet(data.conversion),
      capacity: () => createCapacitySheet(data.capacity),
      operational: () => createOperationalSheet(data.operational),
      projections: () => createProjectionsSheet(data.projections)
    };

    const sheetNames: Record<string, string> = {
      cpa: 'CPA',
      ltv: 'LTV',
      retention: 'Retención',
      engagement: 'Engagement',
      supply_growth: 'Supply Growth',
      conversion: 'Conversión',
      capacity: 'Capacidad',
      operational: 'Operacional',
      projections: 'Proyecciones'
    };

    config.modules.forEach(module => {
      const createSheet = sheetCreators[module];
      if (createSheet) {
        const sheet = createSheet();
        if (sheet) {
          XLSX.utils.book_append_sheet(workbook, sheet, sheetNames[module]);
        }
      }
    });

    // Generate filename and save
    const filename = `informe-historico-${config.year}${config.month ? `-${String(config.month).padStart(2, '0')}` : ''}-${format(new Date(), 'yyyyMMdd-HHmm')}.xlsx`;
    XLSX.writeFile(workbook, filename);

    document.body.style.cursor = 'default';
    return true;
  } catch (error) {
    console.error('Error generating Excel:', error);
    document.body.style.cursor = 'default';
    throw error;
  }
};
