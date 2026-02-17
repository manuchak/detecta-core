// @ts-nocheck
import { useMemo, useEffect, useState, useRef } from 'react';
import { useCPADetails } from './useCPADetails';
import { useLTVDetails } from './useLTVDetails';
import { useRetentionDetails } from './useRetentionDetails';
import { useEngagementDetails } from './useEngagementDetails';
import { useSupplyGrowthDetails } from './useSupplyGrowthDetails';
import { useConversionRateDetails } from './useConversionRateDetails';
import { useServiceCapacity } from './useServiceCapacity';
import { useOperationalMetrics } from './useOperationalMetrics';
import { useClientsData, useClientMetrics, useClientTableData } from './useClientAnalytics';
import {
  HistoricalReportConfig,
  HistoricalReportData,
  ReportModule,
  MODULE_GRANULARITY_SUPPORT,
  CPAReportData,
  LTVReportData,
  RetentionReportData,
  EngagementReportData,
  SupplyGrowthReportData,
  ConversionReportData,
  CapacityReportData,
  OperationalReportData,
  ProjectionsReportData,
  ClientsReportData,
  MODULE_LABELS,
} from '@/types/reports';

export interface ModuleProgress {
  module: ReportModule;
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
}

export interface UseHistoricalReportDataReturn {
  data: HistoricalReportData | null;
  loading: boolean;
  error: string | null;
  progress: ModuleProgress[];
  completedCount: number;
  totalCount: number;
}

export function useHistoricalReportData(
  config: HistoricalReportConfig,
  enabled: boolean = false
): UseHistoricalReportDataReturn {
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Create date range for client data based on config
  const dateRange = useMemo(() => {
    const startDate = new Date(config.year, 0, 1);
    const endDate = new Date(config.year, 11, 31, 23, 59, 59);
    return { from: startDate, to: endDate };
  }, [config.year]);

  // Filter modules by granularity support
  const supportedModules = useMemo(() => 
    config.modules.filter(module => 
      MODULE_GRANULARITY_SUPPORT[module].includes(config.granularity)
    ), [config.modules, config.granularity]);

  // Determine which hooks to enable based on selected modules
  const shouldEnableCPA = enabled && supportedModules.includes('cpa');
  const shouldEnableLTV = enabled && supportedModules.includes('ltv');
  const shouldEnableRetention = enabled && supportedModules.includes('retention');
  const shouldEnableEngagement = enabled && supportedModules.includes('engagement');
  const shouldEnableSupplyGrowth = enabled && supportedModules.includes('supply_growth');
  const shouldEnableConversion = enabled && supportedModules.includes('conversion');
  const shouldEnableCapacity = enabled && (supportedModules.includes('capacity') || supportedModules.includes('projections'));
  const shouldEnableOperational = enabled && (supportedModules.includes('operational') || supportedModules.includes('projections'));
  const shouldEnableClients = enabled && supportedModules.includes('clients');

  // Fetch data from hooks with enabled control - pass year for dynamic filtering
  const { cpaDetails, loading: cpaLoading } = useCPADetails({ enabled: shouldEnableCPA, year: config.year });
  const ltvDetails = useLTVDetails({ enabled: shouldEnableLTV, year: config.year });
  const retentionDetails = useRetentionDetails({ enabled: shouldEnableRetention });
  const { engagementDetails, loading: engagementLoading } = useEngagementDetails({ enabled: shouldEnableEngagement, year: config.year });
  const supplyGrowthDetails = useSupplyGrowthDetails({ enabled: shouldEnableSupplyGrowth });
  const conversionDetails = useConversionRateDetails({ enabled: shouldEnableConversion, year: config.year });
  const { capacityData, loading: capacityLoading } = useServiceCapacity({ enabled: shouldEnableCapacity });
  
  // Client data hooks with year filter
  const { data: clientsData, isLoading: clientsLoading } = useClientsData(dateRange, { enabled: shouldEnableClients });
  const { data: clientMetrics, isLoading: clientMetricsLoading } = useClientMetrics(dateRange, { enabled: shouldEnableClients });
  const { data: clientTableData, isLoading: clientTableLoading } = useClientTableData(dateRange, { enabled: shouldEnableClients });
  
  // Operational metrics with year/month filter
  const operationalOptions = {
    year: config.year,
    month: config.granularity === 'month' ? config.month : undefined,
    enabled: shouldEnableOperational,
  };
  const { data: operationalData, isLoading: operationalLoading } = useOperationalMetrics(operationalOptions);

  // Calculate progress
  const progress = useMemo((): ModuleProgress[] => {
    return supportedModules.map(module => {
      let status: 'pending' | 'loading' | 'done' | 'error' = 'pending';
      
      if (!enabled) {
        status = 'pending';
      } else {
        switch (module) {
          case 'cpa':
            status = cpaLoading ? 'loading' : (cpaDetails ? 'done' : 'pending');
            break;
          case 'ltv':
            status = ltvDetails.loading ? 'loading' : 'done';
            break;
          case 'retention':
            status = retentionDetails.loading ? 'loading' : 'done';
            break;
          case 'engagement':
            status = engagementLoading ? 'loading' : (engagementDetails ? 'done' : 'pending');
            break;
          case 'supply_growth':
            status = supplyGrowthDetails.loading ? 'loading' : 'done';
            break;
          case 'conversion':
            status = conversionDetails.loading ? 'loading' : 'done';
            break;
          case 'capacity':
            status = capacityLoading ? 'loading' : (capacityData ? 'done' : 'pending');
            break;
          case 'operational':
            status = operationalLoading ? 'loading' : (operationalData ? 'done' : 'pending');
            break;
          case 'projections':
            status = (capacityLoading || operationalLoading) ? 'loading' : 'done';
            break;
          case 'clients':
            status = (clientsLoading || clientMetricsLoading || clientTableLoading) ? 'loading' : 'done';
            break;
        }
      }

      return {
        module,
        label: MODULE_LABELS[module],
        status,
      };
    });
  }, [supportedModules, enabled, cpaLoading, cpaDetails, ltvDetails, retentionDetails, 
      engagementLoading, engagementDetails, supplyGrowthDetails, conversionDetails,
      capacityLoading, capacityData, operationalLoading, operationalData,
      clientsLoading, clientMetricsLoading, clientTableLoading]);

  const completedCount = progress.filter(p => p.status === 'done').length;
  const totalCount = supportedModules.length;

  // Check if all enabled modules are loaded
  const loading = enabled && progress.some(p => p.status === 'loading');

  // Timeout protection
  useEffect(() => {
    if (enabled && loading) {
      timeoutRef.current = setTimeout(() => {
        setError('La generación del reporte está tomando demasiado tiempo. Por favor intenta de nuevo.');
      }, 45000); // 45 seconds timeout
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, loading]);

  // Clear error when starting new generation
  useEffect(() => {
    if (enabled) {
      setError(null);
    }
  }, [enabled]);

  const reportData = useMemo((): HistoricalReportData | null => {
    if (!enabled || loading) return null;

    const periodLabel = generatePeriodLabel(config);

    const report: HistoricalReportData = {
      config,
      generatedAt: new Date().toISOString(),
      periodLabel,
    };

    // Populate each module's data
    supportedModules.forEach(module => {
      switch (module) {
        case 'cpa':
          report.cpa = transformCPAData(cpaDetails, config.year);
          break;
        case 'ltv':
          report.ltv = transformLTVData(ltvDetails, config.year);
          break;
        case 'retention':
          report.retention = transformRetentionData(retentionDetails, config.year);
          break;
        case 'engagement':
          report.engagement = transformEngagementData(engagementDetails, config.year);
          break;
        case 'supply_growth':
          report.supplyGrowth = transformSupplyGrowthData(supplyGrowthDetails, config.year);
          break;
        case 'conversion':
          report.conversion = transformConversionData(conversionDetails, config.year);
          break;
        case 'capacity':
          report.capacity = transformCapacityData(capacityData);
          break;
        case 'operational':
          report.operational = transformOperationalData(operationalData, config.year);
          break;
        case 'projections':
          report.projections = transformProjectionsData(capacityData, operationalData);
          break;
        case 'clients':
          report.clients = transformClientsData(clientsData, clientMetrics, clientTableData, config.year);
          break;
      }
    });

    return report;
  }, [config, enabled, loading, cpaDetails, ltvDetails, retentionDetails, engagementDetails, 
      supplyGrowthDetails, conversionDetails, capacityData, operationalData, 
      clientsData, clientMetrics, clientTableData, supportedModules]);

  return {
    data: reportData,
    loading,
    error,
    progress,
    completedCount,
    totalCount,
  };
}

// Helper functions (keeping existing transform functions)
function generatePeriodLabel(config: HistoricalReportConfig): string {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  switch (config.granularity) {
    case 'year':
      return `Año ${config.year}`;
    case 'month':
      return `${monthNames[(config.month || 1) - 1]} ${config.year}`;
    case 'week':
      return `Semana ${config.week} de ${monthNames[(config.month || 1) - 1]} ${config.year}`;
    case 'day':
      return `${config.day} de ${monthNames[(config.month || 1) - 1]} ${config.year}`;
    default:
      return `${config.year}`;
  }
}

function transformCPAData(cpaDetails: any, year: number): CPAReportData {
  const costBreakdownArray = cpaDetails?.currentMonthCostBreakdown || [];
  const yearlyBreakdown = Object.entries(cpaDetails?.costBreakdownByCategory || cpaDetails?.yearlyBreakdown?.costBreakdown || {}).map(([category, amount]) => ({
    category,
    amount: Number(amount) || 0,
    percentage: (cpaDetails?.yearlyData?.totalCosts || cpaDetails?.yearlyBreakdown?.totalCosts || 0) > 0 
      ? ((Number(amount) || 0) / (cpaDetails?.yearlyData?.totalCosts || cpaDetails?.yearlyBreakdown?.totalCosts)) * 100 
      : 0,
  }));

  const filteredMonthlyData = (cpaDetails?.monthlyData || cpaDetails?.yearlyBreakdown?.monthlyData || []).filter((item: any) => {
    const itemYear = parseInt(item.month?.split('-')[0] || '0');
    return itemYear === year;
  });

  return {
    formula: 'CPA = Costos Totales de Adquisición / Número de Custodios Nuevos',
    yearlyData: {
      totalCosts: cpaDetails?.yearlyData?.totalCosts || cpaDetails?.yearlyBreakdown?.totalCosts || 0,
      newCustodians: cpaDetails?.yearlyData?.newCustodians || cpaDetails?.yearlyBreakdown?.totalNewCustodians || 0,
      cpaPromedio: cpaDetails?.overallCPA || 0,
      costBreakdown: yearlyBreakdown,
    },
    currentMonthData: {
      month: cpaDetails?.currentMonthData?.month || '',
      costs: cpaDetails?.currentMonthData?.costs || 0,
      newCustodians: cpaDetails?.currentMonthData?.newCustodians || 0,
      cpa: cpaDetails?.currentMonthData?.cpa || 0,
      costBreakdown: costBreakdownArray.map((item: any) => ({
        category: item.category || '',
        amount: item.amount || 0,
      })),
    },
    monthlyEvolution: filteredMonthlyData.map((item: any) => ({
      month: item.month || '',
      costs: item.costs || 0,
      newCustodians: item.newCustodians || 0,
      cpa: item.cpa || 0,
    })),
  };
}

function transformLTVData(ltvDetails: any, year: number): LTVReportData {
  const ltvGeneral = ltvDetails?.yearlyData?.ltvGeneral || 0;
  // Hook already filters by year, so include all data
  const filteredMonthlyBreakdown = ltvDetails?.yearlyData?.monthlyBreakdown || [];
  
  return {
    formula: `LTV = Ingreso Promedio Mensual × Tiempo de Vida Promedio (${ltvDetails?.tiempoVidaPromedio?.toFixed(1) || 0} meses)`,
    tiempoVidaPromedio: ltvDetails?.tiempoVidaPromedio || 0,
    yearlyData: {
      totalCustodios: ltvDetails?.yearlyData?.totalCustodios || 0,
      ingresosTotales: ltvDetails?.yearlyData?.ingresosTotales || 0,
      ingresoPromedioPorCustodio: ltvDetails?.yearlyData?.ingresoPromedioPorCustodio || 0,
      ltvGeneral: ltvGeneral,
    },
    momComparison: {
      ltvActual: ltvDetails?.momComparison?.ltvActual || 0,
      ltvMesAnterior: ltvDetails?.momComparison?.ltvMesAnterior || 0,
      cambioAbsoluto: ltvDetails?.momComparison?.cambioAbsoluto || 0,
      cambioRelativo: ltvDetails?.momComparison?.cambioRelativo || 0,
      tendencia: ltvDetails?.momComparison?.tendencia || 'stable',
    },
    quarterlyData: ltvDetails?.quarterlyData?.map((q: any) => ({
      quarter: q.quarter || '',
      ltvPromedio: q.ltvPromedio || 0,
      custodiosPromedio: q.custodiosPromedio || 0,
      ingresosTotales: q.ingresosTotales || 0,
      cambioVsQuarterAnterior: q.cambioVsQuarterAnterior,
    })) || [],
    projections: {
      optimista: Math.round(ltvGeneral * 1.15),
      actual: ltvGeneral,
      conservador: Math.round(ltvGeneral * 0.85),
    },
    monthlyBreakdown: filteredMonthlyBreakdown.map((m: any) => ({
      month: m.month || '',
      custodiosActivos: m.custodiosActivos || 0,
      ingresosTotales: m.ingresosTotales || 0,
      ingresoPromedioPorCustodio: m.ingresoPromedioPorCustodio || 0,
      ltvCalculado: m.ltvCalculado || 0,
    })),
  };
}

function transformRetentionData(retentionDetails: any, year: number): RetentionReportData {
  const filteredMonthlyBreakdown = (retentionDetails?.monthlyBreakdown || []).filter((m: any) => {
    const itemYear = parseInt(m.month?.split('-')[0] || '0');
    return itemYear === year;
  });
  const filteredCohortAnalysis = (retentionDetails?.cohortAnalysis || []).filter((c: any) => {
    const itemYear = parseInt(c.cohortMonth?.split('-')[0] || '0');
    return itemYear === year;
  });

  return {
    formula: 'Tasa de Retención = (Custodios Retenidos / Custodios Mes Anterior) × 100',
    yearlyData: {
      retentionPromedio: retentionDetails?.yearlyData?.retentionPromedio || 0,
      totalCustodiosRetenidos: retentionDetails?.yearlyData?.totalCustodiosRetenidos || 0,
      totalCustodiosAnteriores: retentionDetails?.yearlyData?.totalCustodiosAnteriores || 0,
      mesesConDatos: retentionDetails?.yearlyData?.mesesConDatos || 0,
      tiempoPromedioPermanenciaGeneral: retentionDetails?.yearlyData?.tiempoPromedioPermanenciaGeneral || 0,
      custodiosUltimoQCompletado: retentionDetails?.yearlyData?.custodiosUltimoQCompletado || 0,
      labelUltimoQCompletado: retentionDetails?.yearlyData?.labelUltimoQCompletado || '',
    },
    currentMonthData: {
      custodiosAnterior: retentionDetails?.currentMonthData?.custodiosAnterior || 0,
      custodiosActual: retentionDetails?.currentMonthData?.custodiosActual || 0,
      custodiosRetenidos: retentionDetails?.currentMonthData?.custodiosRetenidos || 0,
      custodiosNuevos: retentionDetails?.currentMonthData?.custodiosNuevos || 0,
      custodiosPerdidos: retentionDetails?.currentMonthData?.custodiosPerdidos || 0,
      tasaRetencion: retentionDetails?.currentMonthData?.tasaRetencion || 0,
      tiempoPromedioPermanencia: retentionDetails?.currentMonthData?.tiempoPromedioPermanencia || 0,
    },
    cohortAnalysis: filteredCohortAnalysis.map((c: any) => ({
      cohortMonth: c.cohortMonth || '',
      month0: c.month0 || 0, month1: c.month1 || 0, month2: c.month2 || 0,
      month3: c.month3 || 0, month4: c.month4 || 0, month5: c.month5 || 0, month6: c.month6 || 0,
    })),
    quarterlyData: retentionDetails?.quarterlyData?.map((q: any) => ({
      quarter: q.quarter || '', avgRetention: q.avgRetention || 0,
      avgPermanence: q.avgPermanence || 0, custodians: q.custodians || 0, trend: q.trend || 'stable',
    })) || [],
    monthlyBreakdown: filteredMonthlyBreakdown.map((m: any) => ({
      month: m.month || '', monthName: m.monthName || '',
      custodiosAnterior: m.custodiosAnterior || 0, custodiosRetenidos: m.custodiosRetenidos || 0,
      custodiosNuevos: m.custodiosNuevos || 0, custodiosPerdidos: m.custodiosPerdidos || 0,
      tasaRetencion: m.tasaRetencion || 0, tiempoPromedioPermanencia: m.tiempoPromedioPermanencia || 0,
    })),
  };
}

function transformEngagementData(engagementDetails: any, year: number): EngagementReportData {
  // Hook already filters by year, so include all monthly data
  const filteredMonthlyEvolution = engagementDetails?.yearlyData?.monthlyEvolution || [];

  return {
    formula: 'Engagement = Total Servicios ÷ Total Custodios Activos',
    yearlyData: {
      totalServices: engagementDetails?.yearlyData?.totalServices || 0,
      totalCustodians: engagementDetails?.yearlyData?.totalActiveCustodians || 0,
      averageEngagement: engagementDetails?.overallEngagement || 0,
    },
    currentMonthData: {
      month: engagementDetails?.currentMonthData?.month || '',
      services: engagementDetails?.currentMonthData?.services || 0,
      custodians: engagementDetails?.currentMonthData?.custodians || 0,
      engagement: engagementDetails?.currentMonthData?.engagement || 0,
    },
    monthlyEvolution: filteredMonthlyEvolution.map((m: any) => ({
      month: m.month || '', services: m.services || 0,
      custodians: m.custodians || 0, engagement: m.engagement || 0,
    })),
  };
}

function transformSupplyGrowthData(supplyGrowthDetails: any, year: number): SupplyGrowthReportData {
  const filteredMonthlyData = (supplyGrowthDetails?.monthlyData || []).filter((m: any) => {
    const itemYear = parseInt(m.month?.split('-')[0] || '0');
    return itemYear === year;
  });

  return {
    summary: {
      crecimientoPromedioMensual: supplyGrowthDetails?.summary?.crecimientoPromedioMensual || 0,
      crecimientoNetoAnual: supplyGrowthDetails?.summary?.crecimientoNetoAnual || 0,
      custodiosActivosActuales: supplyGrowthDetails?.summary?.custodiosActivosActuales || 0,
      custodiosNuevosAnual: supplyGrowthDetails?.summary?.custodiosNuevosAnual || 0,
      custodiosPerdidosAnual: supplyGrowthDetails?.summary?.custodiosPerdidosAnual || 0,
      mejorMes: supplyGrowthDetails?.summary?.mejorMes || { mes: '', crecimiento: 0 },
      peorMes: supplyGrowthDetails?.summary?.peorMes || { mes: '', crecimiento: 0 },
      tendencia: supplyGrowthDetails?.summary?.tendencia || 'estable',
      velocidadCrecimiento: supplyGrowthDetails?.summary?.velocidadCrecimiento || 0,
    },
    qualityMetrics: {
      custodiosConMas5Servicios: supplyGrowthDetails?.qualityMetrics?.custodiosConMas5Servicios || 0,
      custodiosConMenos1Servicio: supplyGrowthDetails?.qualityMetrics?.custodiosConMenos1Servicio || 0,
      promedioServiciosPorCustodio: supplyGrowthDetails?.qualityMetrics?.promedioServiciosPorCustodio || 0,
      custodiosTop10Percent: supplyGrowthDetails?.qualityMetrics?.custodiosTop10Percent || 0,
      ingresoPromedioPorCustodio: supplyGrowthDetails?.qualityMetrics?.ingresoPromedioPorCustodio || 0,
      custodiosConIngresosCero: supplyGrowthDetails?.qualityMetrics?.custodiosConIngresosCero || 0,
    },
    monthlyData: filteredMonthlyData.map((m: any) => ({
      month: m.month || '', monthName: m.monthName || '',
      custodiosActivos: m.custodiosActivos || 0, custodiosNuevos: m.custodiosNuevos || 0,
      custodiosPerdidos: m.custodiosPerdidos || 0, crecimientoNeto: m.crecimientoNeto || 0,
      crecimientoPorcentual: m.crecimientoPorcentual || 0,
    })),
  };
}

function transformConversionData(conversionDetails: any, year: number): ConversionReportData {
  // Use monthKey (YYYY-MM format) for filtering instead of month name
  const filteredMonthlyBreakdown = (conversionDetails?.yearlyData?.monthlyBreakdown || []).filter((m: any) => {
    const key = m.monthKey || m.month || '';
    const itemYear = parseInt(key.split('-')[0] || '0');
    // If monthKey is available, filter by year; otherwise include all (already filtered by hook)
    return m.monthKey ? itemYear === year : true;
  });

  return {
    formula: 'Tasa de Conversión = (Custodios con 1er Servicio / Total Leads) × 100',
    yearlyData: {
      totalLeads: conversionDetails?.yearlyData?.totalLeads || 0,
      totalNewCustodians: conversionDetails?.yearlyData?.totalNewCustodians || 0,
      conversionRate: conversionDetails?.yearlyData?.overallConversionRate || 0,
    },
    currentMonthData: {
      month: conversionDetails?.currentMonthData?.month || '',
      leads: conversionDetails?.currentMonthData?.leads || 0,
      newCustodians: conversionDetails?.currentMonthData?.newCustodians || 0,
      conversionRate: conversionDetails?.currentMonthData?.conversionRate || 0,
    },
    monthlyBreakdown: filteredMonthlyBreakdown.map((m: any) => ({
      month: m.month || '', leads: m.leads || 0,
      newCustodians: m.newCustodians || 0, conversionRate: m.conversionRate || 0,
    })),
  };
}

function transformCapacityData(capacityData: any): CapacityReportData {
  const activeCustodians = capacityData?.activeCustodians || 0;
  const availableCustodians = capacityData?.availableCustodians || 0;
  const dailyCapacity = capacityData?.dailyCapacity || { total: 0, local: 0, regional: 0, foraneo: 0 };
  const monthlyCapacityRaw = capacityData?.monthlyCapacity || { total: 0, local: 0, regional: 0, foraneo: 0 };
  const utilizationMetrics = capacityData?.utilizationMetrics || { current: 0, healthy: 75, maxSafe: 85 };
  
  return {
    currentCapacity: {
      totalCustodians: activeCustodians,
      availableToday: availableCustodians,
      unavailable: {
        returningFromForeign: capacityData?.unavailable?.returningFromForeign || 0,
        currentlyOnRoute: capacityData?.unavailable?.currentlyOnRoute || Math.max(0, activeCustodians - availableCustodians),
      },
    },
    capacityByServiceType: {
      local: dailyCapacity.local || 0,
      regional: dailyCapacity.regional || 0,
      foraneo: dailyCapacity.foraneo || 0,
    },
    monthlyCapacity: {
      total: monthlyCapacityRaw.total || 0,
      forecastCurrentMonth: capacityData?.forecastCurrentMonth || monthlyCapacityRaw.total || 0,
      servicesMTD: capacityData?.servicesMTD || 0,
      utilizationVsForecast: capacityData?.utilizationVsForecast || (utilizationMetrics.current || 0),
      gap: capacityData?.gap || 0,
    },
    utilizationMetrics: {
      current: utilizationMetrics.current || 0,
      healthy: utilizationMetrics.healthy || 75,
      maxSafe: utilizationMetrics.maxSafe || 85,
    },
    fleetEfficiency: {
      availableCustodians: availableCustodians,
      servicesPerCustodianMonth: capacityData?.fleetEfficiency?.averageServicesPerCustodian || 
        capacityData?.fleetEfficiency?.servicesPerCustodianMonth || 0,
      operationalEfficiency: utilizationMetrics.current || 0,
    },
  };
}

function transformOperationalData(operationalData: any, year: number): OperationalReportData {
  const totalServices = operationalData?.totalServices || 0;
  const completedServices = operationalData?.completedServices || 0;
  const cancelledServices = operationalData?.cancelledServices || 0;
  const pendingServices = Math.max(0, totalServices - completedServices - cancelledServices);

  return {
    services: {
      total: totalServices,
      completed: completedServices,
      completedPercent: totalServices > 0 ? Math.round((completedServices / totalServices) * 100) : 0,
      cancelled: cancelledServices,
      cancelledPercent: totalServices > 0 ? Math.round((cancelledServices / totalServices) * 100) : 0,
      pending: pendingServices,
      pendingPercent: totalServices > 0 ? Math.round((pendingServices / totalServices) * 100) : 0,
    },
    gmv: {
      total: operationalData?.totalGMV || 0,
      aov: operationalData?.averageAOV || 0,
    },
    comparatives: {
      servicesThisMonth: {
        current: operationalData?.comparatives?.servicesThisMonth?.current || 0,
        previous: operationalData?.comparatives?.servicesThisMonth?.previousMonth || operationalData?.comparatives?.servicesThisMonth?.previous || 0,
        changePercent: operationalData?.comparatives?.servicesThisMonth?.changePercent || 0,
      },
      servicesYTD: {
        current: operationalData?.comparatives?.servicesYTD?.current || 0,
        previous: operationalData?.comparatives?.servicesYTD?.previousYear || operationalData?.comparatives?.servicesYTD?.previous || 0,
        changePercent: operationalData?.comparatives?.servicesYTD?.changePercent || 0,
      },
      gmvThisMonth: {
        current: operationalData?.comparatives?.totalGMV?.current || operationalData?.comparatives?.gmvThisMonth?.current || 0,
        previous: operationalData?.comparatives?.totalGMV?.previousMonth || operationalData?.comparatives?.gmvThisMonth?.previous || 0,
        changePercent: operationalData?.comparatives?.totalGMV?.changePercent || operationalData?.comparatives?.gmvThisMonth?.changePercent || 0,
      },
      aovThisMonth: {
        current: operationalData?.comparatives?.averageAOV?.current || operationalData?.comparatives?.aovThisMonth?.current || 0,
        previous: operationalData?.comparatives?.averageAOV?.previousMonth || operationalData?.comparatives?.aovThisMonth?.previous || 0,
        changePercent: operationalData?.comparatives?.averageAOV?.changePercent || operationalData?.comparatives?.aovThisMonth?.changePercent || 0,
      },
      completionRate: {
        current: operationalData?.comparatives?.completionRate?.current || operationalData?.completionRate || 0,
        previous: operationalData?.comparatives?.completionRate?.previousMonth || operationalData?.comparatives?.completionRate?.previous || 0,
        changePercent: operationalData?.comparatives?.completionRate?.changePercent || 0,
      },
      avgKmPerService: {
        current: operationalData?.comparatives?.averageKmPerService?.current || operationalData?.averageKmPerService || 0,
        previous: operationalData?.comparatives?.averageKmPerService?.previousMonth || operationalData?.comparatives?.avgKmPerService?.previous || 0,
        changePercent: operationalData?.comparatives?.averageKmPerService?.changePercent || operationalData?.comparatives?.avgKmPerService?.changePercent || 0,
      },
      gmvYTD: {
        current: operationalData?.comparatives?.gmvYTD?.current || 0,
        previous: operationalData?.comparatives?.gmvYTD?.previousYear || operationalData?.comparatives?.gmvYTD?.previous || 0,
        changePercent: operationalData?.comparatives?.gmvYTD?.changePercent || 0,
      },
      avgDailyGMV: {
        current: operationalData?.comparatives?.avgDailyGMV?.current || 0,
        previous: operationalData?.comparatives?.avgDailyGMV?.previousYear || operationalData?.comparatives?.avgDailyGMV?.previous || 0,
        changePercent: operationalData?.comparatives?.avgDailyGMV?.changePercent || 0,
      },
    },
    topCustodians: (operationalData?.topCustodians || []).map((c: any, i: number) => ({
      rank: i + 1,
      name: c.name || c.custodian_name || '',
      services: c.services || c.total_services || 0,
      costoCustodio: c.costoCustodio || c.costo_custodio || 0,
      promedioCostoMes: c.promedioCostoMes || c.promedio_costo_mes || 0,
      mesesActivos: c.mesesActivos || c.meses_activos || 0,
      gmv: c.gmv || c.total_gmv || 0,
      margen: c.margen || c.margin || 0,
      coberturaDatos: c.coberturaDatos || c.cobertura_datos || 0,
    })),
    topClients: (operationalData?.topClients || []).map((c: any, i: number) => ({
      rank: i + 1,
      name: c.name || c.client_name || '',
      services: c.services || c.total_services || 0,
      gmv: c.gmv || c.total_gmv || 0,
      aov: c.aov || c.average_order_value || 0,
    })),
    monthlyBreakdown: (operationalData?.monthlyBreakdown || []).map((m: any) => ({
      month: m.month || '',
      monthNumber: m.monthNumber || m.month_number || 0,
      services: m.services || m.total_services || 0,
      completedServices: m.completedServices || m.completed_services || 0,
      gmv: m.gmv || m.total_gmv || 0,
      aov: m.aov || m.average_order_value || 0,
      completionRate: m.completionRate || m.completion_rate || 0,
    })),
  };
}

function transformProjectionsData(capacityData: any, operationalData: any): ProjectionsReportData {
  const monthlyCapacity = capacityData?.monthlyCapacity?.total || 0;
  const expectedServices = Math.round(monthlyCapacity * 0.75);
  
  // Generate forecast vs real data from operational monthly breakdown if available
  const forecastVsReal = (operationalData?.monthlyBreakdown || []).map((m: any) => {
    const forecast = m.forecast || Math.round((m.services || 0) * 1.1); // Estimate forecast as 10% higher
    const real = m.services || 0;
    const difference = real - forecast;
    const mape = forecast > 0 ? Math.abs(difference / forecast) * 100 : 0;
    return {
      month: m.month || '',
      forecast,
      real,
      difference,
      mape: Math.round(mape * 10) / 10,
    };
  });

  // Calculate model precision from forecast data
  const mapeValues = forecastVsReal.map((f: any) => f.mape);
  const mapePromedio = mapeValues.length > 0 
    ? mapeValues.reduce((sum: number, v: number) => sum + v, 0) / mapeValues.length 
    : 0;
  const variance = mapeValues.length > 0 
    ? mapeValues.reduce((sum: number, v: number) => sum + Math.pow(v - mapePromedio, 2), 0) / mapeValues.length 
    : 0;
  const desviacionEstandar = Math.sqrt(variance);

  return {
    forecastVsReal,
    annualProjection: {
      optimistic: Math.round(expectedServices * 12 * 1.15),
      expected: Math.round(expectedServices * 12),
      conservative: Math.round(expectedServices * 12 * 0.85),
    },
    modelPrecision: {
      mapePromedio: Math.round(mapePromedio * 10) / 10,
      desviacionEstandar: Math.round(desviacionEstandar * 10) / 10,
    },
  };
}

function transformClientsData(clientsData: any, clientMetrics: any, clientTableData: any[], year: number): ClientsReportData {
  const clients = clientTableData || [];
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.currentServices > 0).length;
  const totalGMV = clients.reduce((sum, c) => sum + (c.currentGMV || 0), 0);
  const totalServices = clients.reduce((sum, c) => sum + (c.currentServices || 0), 0);

  // Count new clients (those with first service in the current period)
  const newClientsThisPeriod = clients.filter(c => c.isNew === true).length;

  const topClients = [...clients]
    .sort((a, b) => (b.currentGMV || 0) - (a.currentGMV || 0))
    .slice(0, 15)
    .map((c, index) => ({
      rank: index + 1,
      name: c.clientName || c.name || '',
      services: c.currentServices || 0,
      gmv: c.currentGMV || 0,
      aov: c.currentAOV || (c.currentServices > 0 ? c.currentGMV / c.currentServices : 0),
      completionRate: c.completionRate || 0,
      growth: c.gmvGrowth || 0,
    }));

  // Calculate service type analysis
  const serviceTypeData = clientMetrics?.serviceTypeAnalysis || {};
  const foraneoCnt = serviceTypeData?.foraneo?.count || 0;
  const localCnt = serviceTypeData?.local?.count || 0;
  const totalTypedServices = foraneoCnt + localCnt;

  // Calculate client concentration (HHI)
  const gmvShares = clients.map(c => (c.currentGMV || 0) / (totalGMV || 1));
  const hhi = gmvShares.reduce((sum, share) => sum + Math.pow(share * 100, 2), 0);
  
  // Top 5% and 10% concentration
  const sortedByGMV = [...clients].sort((a, b) => (b.currentGMV || 0) - (a.currentGMV || 0));
  const top5Count = Math.max(1, Math.ceil(totalClients * 0.05));
  const top10Count = Math.max(1, Math.ceil(totalClients * 0.1));
  const top5GMV = sortedByGMV.slice(0, top5Count).reduce((sum, c) => sum + (c.currentGMV || 0), 0);
  const top10GMV = sortedByGMV.slice(0, top10Count).reduce((sum, c) => sum + (c.currentGMV || 0), 0);

  // At-risk clients (no service in 30+ days, with historical GMV)
  const atRiskClients = clients
    .filter(c => c.daysSinceLastService >= 30 && (c.historicalGMV || c.currentGMV) > 0)
    .slice(0, 10)
    .map(c => ({
      name: c.clientName || c.name || '',
      lastServiceDate: c.lastServiceDate || '',
      daysSinceLastService: c.daysSinceLastService || 0,
      historicalGmv: c.historicalGMV || c.currentGMV || 0,
    }));

  // Monthly GMV evolution from clientsData if available
  const monthlyGMVEvolution = (clientsData?.monthlyEvolution || []).map((m: any) => ({
    month: m.month || '',
    gmv: m.gmv || 0,
    clientCount: m.clientCount || m.activeClients || 0,
  }));

  return {
    summary: {
      totalClients,
      activeClients,
      newClientsThisPeriod,
      avgServicesPerClient: totalClients > 0 ? totalServices / totalClients : 0,
      avgGmvPerClient: totalClients > 0 ? totalGMV / totalClients : 0,
      totalGMV,
    },
    topClients,
    serviceTypeAnalysis: {
      foraneo: {
        count: foraneoCnt,
        percentage: totalTypedServices > 0 ? (foraneoCnt / totalTypedServices) * 100 : 0,
        avgValue: serviceTypeData?.foraneo?.avgValue || 0,
        gmv: serviceTypeData?.foraneo?.gmv || 0,
      },
      local: {
        count: localCnt,
        percentage: totalTypedServices > 0 ? (localCnt / totalTypedServices) * 100 : 0,
        avgValue: serviceTypeData?.local?.avgValue || 0,
        gmv: serviceTypeData?.local?.gmv || 0,
      },
    },
    clientConcentration: {
      top5Percent: totalGMV > 0 ? (top5GMV / totalGMV) * 100 : 0,
      top10Percent: totalGMV > 0 ? (top10GMV / totalGMV) * 100 : 0,
      hhi: Math.round(hhi),
    },
    atRiskClients,
    monthlyGMVEvolution,
  };
}
