// @ts-nocheck
import { useMemo } from 'react';
import { useCPADetails } from './useCPADetails';
import { useLTVDetails } from './useLTVDetails';
import { useRetentionDetails } from './useRetentionDetails';
import { useEngagementDetails } from './useEngagementDetails';
import { useSupplyGrowthDetails } from './useSupplyGrowthDetails';
import { useConversionRateDetails } from './useConversionRateDetails';
import { useServiceCapacity } from './useServiceCapacity';
import { useOperationalMetrics } from './useOperationalMetrics';
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
} from '@/types/reports';

export interface UseHistoricalReportDataReturn {
  data: HistoricalReportData | null;
  loading: boolean;
  error: string | null;
}

export function useHistoricalReportData(config: HistoricalReportConfig): UseHistoricalReportDataReturn {
  // Fetch all data from existing hooks
  const { cpaDetails, loading: cpaLoading } = useCPADetails();
  const ltvDetails = useLTVDetails();
  const retentionDetails = useRetentionDetails();
  const { engagementDetails, loading: engagementLoading } = useEngagementDetails();
  const supplyGrowthDetails = useSupplyGrowthDetails();
  const conversionDetails = useConversionRateDetails();
  const { capacityData, loading: capacityLoading } = useServiceCapacity();
  
  // Pass year/month filter to operational metrics based on config
  const operationalOptions = {
    year: config.year,
    month: config.granularity === 'month' ? config.month : undefined,
  };
  const { data: operationalData, isLoading: operationalLoading } = useOperationalMetrics(operationalOptions);

  const loading = cpaLoading || ltvDetails.loading || retentionDetails.loading || 
                  engagementLoading || supplyGrowthDetails.loading || 
                  conversionDetails.loading || capacityLoading || operationalLoading;

  const reportData = useMemo((): HistoricalReportData | null => {
    if (loading) return null;

    // Filter modules by granularity support
    const supportedModules = config.modules.filter(module => 
      MODULE_GRANULARITY_SUPPORT[module].includes(config.granularity)
    );

    // Generate period label
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
          report.cpa = transformCPAData(cpaDetails);
          break;
        case 'ltv':
          report.ltv = transformLTVData(ltvDetails);
          break;
        case 'retention':
          report.retention = transformRetentionData(retentionDetails);
          break;
        case 'engagement':
          report.engagement = transformEngagementData(engagementDetails);
          break;
        case 'supply_growth':
          report.supplyGrowth = transformSupplyGrowthData(supplyGrowthDetails);
          break;
        case 'conversion':
          report.conversion = transformConversionData(conversionDetails);
          break;
        case 'capacity':
          report.capacity = transformCapacityData(capacityData);
          break;
        case 'operational':
          report.operational = transformOperationalData(operationalData);
          break;
        case 'projections':
          report.projections = transformProjectionsData(capacityData, operationalData);
          break;
      }
    });

    return report;
  }, [config, loading, cpaDetails, ltvDetails, retentionDetails, engagementDetails, 
      supplyGrowthDetails, conversionDetails, capacityData, operationalData]);

  return {
    data: reportData,
    loading,
    error: null,
  };
}

// Helper functions to transform data

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

function transformCPAData(cpaDetails: any): CPAReportData {
  const costBreakdownArray = cpaDetails?.currentMonthCostBreakdown || [];
  const yearlyBreakdown = Object.entries(cpaDetails?.costBreakdownByCategory || {}).map(([category, amount]) => ({
    category,
    amount: Number(amount) || 0,
    percentage: cpaDetails?.yearlyData?.totalCosts > 0 
      ? ((Number(amount) || 0) / cpaDetails.yearlyData.totalCosts) * 100 
      : 0,
  }));

  return {
    formula: 'CPA = Costos Totales de Adquisición / Número de Custodios Nuevos',
    yearlyData: {
      totalCosts: cpaDetails?.yearlyData?.totalCosts || 0,
      newCustodians: cpaDetails?.yearlyData?.newCustodians || 0,
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
    monthlyEvolution: cpaDetails?.monthlyData?.map((item: any) => ({
      month: item.month || '',
      costs: item.costs || 0,
      newCustodians: item.newCustodians || 0,
      cpa: item.cpa || 0,
    })) || [],
  };
}

function transformLTVData(ltvDetails: any): LTVReportData {
  const ltvGeneral = ltvDetails?.yearlyData?.ltvGeneral || 0;
  
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
    monthlyBreakdown: ltvDetails?.yearlyData?.monthlyBreakdown?.map((m: any) => ({
      month: m.month || '',
      custodiosActivos: m.custodiosActivos || 0,
      ingresosTotales: m.ingresosTotales || 0,
      ingresoPromedioPorCustodio: m.ingresoPromedioPorCustodio || 0,
      ltvCalculado: m.ltvCalculado || 0,
    })) || [],
  };
}

function transformRetentionData(retentionDetails: any): RetentionReportData {
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
    cohortAnalysis: retentionDetails?.cohortAnalysis?.map((c: any) => ({
      cohortMonth: c.cohortMonth || '',
      month0: c.month0 || 0,
      month1: c.month1 || 0,
      month2: c.month2 || 0,
      month3: c.month3 || 0,
      month4: c.month4 || 0,
      month5: c.month5 || 0,
      month6: c.month6 || 0,
    })) || [],
    quarterlyData: retentionDetails?.quarterlyData?.map((q: any) => ({
      quarter: q.quarter || '',
      avgRetention: q.avgRetention || 0,
      avgPermanence: q.avgPermanence || 0,
      custodians: q.custodians || 0,
      trend: q.trend || 'stable',
    })) || [],
    monthlyBreakdown: retentionDetails?.monthlyBreakdown?.map((m: any) => ({
      month: m.month || '',
      monthName: m.monthName || '',
      custodiosAnterior: m.custodiosAnterior || 0,
      custodiosRetenidos: m.custodiosRetenidos || 0,
      custodiosNuevos: m.custodiosNuevos || 0,
      custodiosPerdidos: m.custodiosPerdidos || 0,
      tasaRetencion: m.tasaRetencion || 0,
      tiempoPromedioPermanencia: m.tiempoPromedioPermanencia || 0,
    })) || [],
  };
}

function transformEngagementData(engagementDetails: any): EngagementReportData {
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
    monthlyEvolution: engagementDetails?.yearlyData?.monthlyEvolution?.map((m: any) => ({
      month: m.month || '',
      services: m.services || 0,
      custodians: m.custodians || 0,
      engagement: m.engagement || 0,
    })) || [],
  };
}

function transformSupplyGrowthData(supplyGrowthDetails: any): SupplyGrowthReportData {
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
    monthlyData: supplyGrowthDetails?.monthlyData?.map((m: any) => ({
      month: m.month || '',
      monthName: m.monthName || '',
      custodiosActivos: m.custodiosActivos || 0,
      custodiosNuevos: m.custodiosNuevos || 0,
      custodiosPerdidos: m.custodiosPerdidos || 0,
      crecimientoNeto: m.crecimientoNeto || 0,
      crecimientoPorcentual: m.crecimientoPorcentual || 0,
    })) || [],
  };
}

function transformConversionData(conversionDetails: any): ConversionReportData {
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
    monthlyBreakdown: conversionDetails?.yearlyData?.monthlyBreakdown?.map((m: any) => ({
      month: m.month || '',
      leads: m.leads || 0,
      newCustodians: m.newCustodians || 0,
      conversionRate: m.conversionRate || 0,
    })) || [],
  };
}

function transformCapacityData(capacityData: any): CapacityReportData {
  return {
    currentCapacity: {
      totalCustodians: capacityData?.activeCustodians || 0,
      availableToday: capacityData?.availableCustodians || 0,
      unavailable: {
        returningFromForeign: capacityData?.unavailableCustodians?.returningFromForeign || 0,
        currentlyOnRoute: capacityData?.unavailableCustodians?.currentlyOnRoute || 0,
      },
    },
    capacityByServiceType: {
      local: capacityData?.dailyCapacity?.local || 0,
      regional: capacityData?.dailyCapacity?.regional || 0,
      foraneo: capacityData?.dailyCapacity?.foraneo || 0,
    },
    monthlyCapacity: {
      total: capacityData?.monthlyCapacity?.total || 0,
      forecastCurrentMonth: capacityData?.forecastMesActual || 0,
      servicesMTD: capacityData?.serviciosMTD || 0,
      utilizationVsForecast: capacityData?.utilizacionVsForecast || 0,
      gap: (capacityData?.monthlyCapacity?.total || 0) - (capacityData?.forecastMesActual || 0),
    },
    utilizationMetrics: {
      current: capacityData?.utilizationMetrics?.current || 0,
      healthy: capacityData?.utilizationMetrics?.healthy || 75,
      maxSafe: capacityData?.utilizationMetrics?.maxSafe || 85,
    },
    fleetEfficiency: {
      availableCustodians: capacityData?.availableCustodians || 0,
      servicesPerCustodianMonth: capacityData?.activeCustodians > 0 
        ? (capacityData?.recentServices?.total || 0) / capacityData.activeCustodians / 3 
        : 0,
      operationalEfficiency: capacityData?.utilizationMetrics?.current || 0,
    },
  };
}

function transformOperationalData(operationalData: any): OperationalReportData {
  return {
    services: {
      total: operationalData?.totalServices || 0,
      completed: operationalData?.completedServices || 0,
      completedPercent: operationalData?.servicesDistribution?.completed || 0,
      cancelled: operationalData?.cancelledServices || 0,
      cancelledPercent: operationalData?.servicesDistribution?.cancelled || 0,
      pending: operationalData?.pendingServices || 0,
      pendingPercent: operationalData?.servicesDistribution?.pending || 0,
    },
    gmv: {
      total: operationalData?.totalGMV || 0,
      aov: operationalData?.averageAOV || 0,
    },
    comparatives: {
      servicesThisMonth: {
        current: operationalData?.comparatives?.servicesThisMonth?.current || 0,
        previous: operationalData?.comparatives?.servicesThisMonth?.previousMonth || 0,
        changePercent: operationalData?.comparatives?.servicesThisMonth?.changePercent || 0,
      },
      servicesYTD: {
        current: operationalData?.comparatives?.servicesYTD?.current || 0,
        previous: operationalData?.comparatives?.servicesYTD?.previousYear || 0,
        changePercent: operationalData?.comparatives?.servicesYTD?.changePercent || 0,
      },
      gmvThisMonth: {
        current: operationalData?.comparatives?.totalGMV?.current || 0,
        previous: operationalData?.comparatives?.totalGMV?.previousMonth || 0,
        changePercent: operationalData?.comparatives?.totalGMV?.changePercent || 0,
      },
      aovThisMonth: {
        current: operationalData?.comparatives?.averageAOV?.current || 0,
        previous: operationalData?.comparatives?.averageAOV?.previousMonth || 0,
        changePercent: operationalData?.comparatives?.averageAOV?.changePercent || 0,
      },
      completionRate: {
        current: operationalData?.comparatives?.completionRate?.current || 0,
        previous: operationalData?.comparatives?.completionRate?.previousMonth || 0,
        changePercent: operationalData?.comparatives?.completionRate?.changePercent || 0,
      },
      avgKmPerService: {
        current: operationalData?.comparatives?.averageKmPerService?.current || 0,
        previous: operationalData?.comparatives?.averageKmPerService?.previousMonth || 0,
        changePercent: operationalData?.comparatives?.averageKmPerService?.changePercent || 0,
      },
      gmvYTD: {
        current: operationalData?.comparatives?.gmvYTD?.current || 0,
        previous: operationalData?.comparatives?.gmvYTD?.previousYear || 0,
        changePercent: operationalData?.comparatives?.gmvYTD?.changePercent || 0,
      },
      avgDailyGMV: {
        current: operationalData?.comparatives?.avgDailyGMV?.current || 0,
        previous: operationalData?.comparatives?.avgDailyGMV?.previousYear || 0,
        changePercent: operationalData?.comparatives?.avgDailyGMV?.changePercent || 0,
      },
    },
    topCustodians: operationalData?.topCustodians?.map((c: any, index: number) => ({
      rank: index + 1,
      name: c.name || '',
      services: c.services || 0,
      gmv: c.gmv || 0,
      completionPercent: 95,
      avgKm: 0,
    })) || [],
    topClients: operationalData?.topClients?.map((c: any, index: number) => ({
      rank: index + 1,
      name: c.name || '',
      services: c.services || 0,
      gmv: c.gmv || 0,
      aov: c.aov || 0,
    })) || [],
    monthlyBreakdown: operationalData?.monthlyBreakdown?.map((m: any) => ({
      month: m.month || '',
      monthNumber: m.monthNumber || 0,
      services: m.services || 0,
      completedServices: m.completedServices || 0,
      gmv: m.gmv || 0,
      aov: m.aov || 0,
      completionRate: m.completionRate || 0,
    })) || [],
  };
}

function transformProjectionsData(capacityData: any, operationalData: any): ProjectionsReportData {
  const forecastMesActual = capacityData?.forecastMesActual || 0;
  const serviciosMTD = capacityData?.serviciosMTD || 0;
  const proyeccionPace = capacityData?.proyeccionPace || 0;

  return {
    forecastVsReal: [
      {
        month: 'Mes Actual',
        forecast: forecastMesActual,
        real: serviciosMTD,
        difference: serviciosMTD - forecastMesActual,
        mape: forecastMesActual > 0 
          ? Math.abs((serviciosMTD - forecastMesActual) / forecastMesActual) * 100 
          : 0,
      },
    ],
    annualProjection: {
      optimistic: Math.round(proyeccionPace * 1.1),
      expected: proyeccionPace,
      conservative: Math.round(proyeccionPace * 0.9),
    },
    modelPrecision: {
      mapePromedio: 15, // Estimated
      desviacionEstandar: 5, // Estimated
    },
  };
}
