// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUTCMonth, getUTCYear, getUTCDayOfMonth } from '@/utils/timezoneUtils';

// Daily trend data for DoD chart
export interface DailyTrendData {
  fecha: string;
  fechaLabel: string;
  solicitados: number;
  realizados: number;
  fillRate: number;
  aTiempo: number;
  conRetraso: number;
  otpRate: number;
}

// Operational alert type
export interface OperationalAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  value?: string;
  timestamp?: string;
}

export interface OperationalMetrics {
  totalServices: number;
  completedServices: number;
  cancelledServices: number;
  pendingServices: number;
  completionRate: number;
  cancellationRate: number;
  activeCustodians: number;
  averageServicesPerCustodian: number;
  averageKmPerService: number;
  totalGMV: number;
  averageAOV: number;
  servicesThisMonth: number;
  gmvThisMonth: number;
  servicesDistribution: {
    completed: number;
    pending: number;
    cancelled: number;
    // Conteos absolutos del mes actual
    completedCount: number;
    pendingCount: number;
    cancelledCount: number;
    // Comparación vs mes anterior
    completedChange: number;
    pendingChange: number;
    cancelledChange: number;
  };
  topCustodians: Array<{
    rank: number;
    name: string;
    services: number;
    costoCustodio: number;
    promedioCostoMes: number;
    mesesActivos: number;
    gmv: number;
    margen: number;
    coberturaDatos: number;
  }>;
  topClients: Array<{
    name: string;
    services: number;
    gmv: number;
    aov: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    monthNumber: number;
    services: number;
    completedServices: number;
    gmv: number;
    aov: number;
    completionRate: number;
  }>;
  // NEW: Fill Rate metrics
  fillRate: {
    mtd: number;
    yesterday: number;
    changeVsYesterday: number;
    changeVsPrevMonth: number;
    target: number;
  };
  // NEW: On-Time Performance metrics
  onTimePerformance: {
    mtd: number;
    previousMonth: number;
    changePercent: number;
    target: number;
  };
  // NEW: Daily trend data for DoD chart
  dailyTrend: DailyTrendData[];
  // NEW: Operational alerts
  alerts: OperationalAlert[];
  // Comparativos temporales
  comparatives: {
    servicesThisMonth: {
      current: number;
      previousMonth: number;
      changePercent: number;
    };
    servicesYTD: {
      current: number;
      previousYear: number;
      changePercent: number;
    };
    activeCustodiansMonth: {
      current: number;
      previousMonth: number;
      changePercent: number;
    };
    activeCustodiansQuarter: {
      current: number;
      previousQuarter: number;
      changePercent: number;
    };
    completionRate: {
      current: number;
      previousMonth: number;
      changePercent: number;
    };
    averageAOV: {
      current: number;
      previousMonth: number;
      changePercent: number;
    };
    totalGMV: {
      current: number;
      previousMonth: number;
      changePercent: number;
    };
    averageKmPerService: {
      current: number;
      previousMonth: number;
      changePercent: number;
    };
    // GMV YoY
    gmvYTD: {
      current: number;
      previousYear: number;
      changePercent: number;
    };
    // Facturación promedio diaria
    avgDailyGMV: {
      current: number;
      previousYear: number;
      changePercent: number;
    };
  };
}

export interface OperationalMetricsOptions {
  year?: number;
  month?: number;
  enabled?: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const useOperationalMetrics = (options?: OperationalMetricsOptions) => {
  const filterYear = options?.year;
  const filterMonth = options?.month;
  const enabled = options?.enabled !== false;
  
  return useQuery({
    queryKey: ['operational-metrics', filterYear, filterMonth],
    enabled,
    queryFn: async (): Promise<OperationalMetrics> => {
      // Optimized: Only select required columns
      const selectColumns = `
        id,
        fecha_hora_cita,
        estado,
        cobro_cliente,
        nombre_custodio,
        nombre_cliente,
        km_recorridos,
        costo_custodio
      `;
      
      // Default to 2 years of data max for performance
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const defaultStartDate = twoYearsAgo.toISOString().split('T')[0];
      
      let query = supabase.from('servicios_custodia').select(selectColumns);
      
      if (filterYear) {
        const startDate = filterMonth 
          ? `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`
          : `${filterYear}-01-01`;
        const endDate = filterMonth
          ? (filterMonth === 12 
              ? `${filterYear + 1}-01-01` 
              : `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-01`)
          : `${filterYear + 1}-01-01`;
        
        query = query.gte('fecha_hora_cita', startDate).lt('fecha_hora_cita', endDate);
      } else {
        // Limit to 2 years when no filter specified
        query = query.gte('fecha_hora_cita', defaultStartDate);
      }
      
      const { data: services, error: servicesError } = await query;

      if (servicesError) throw servicesError;

      // NUEVA CONSULTA: Obtener datos del año anterior para comparaciones YoY
      let prevYearServices: typeof services = [];
      const yearToCompare = filterYear || new Date().getFullYear();
      
      const prevYearStartDate = `${yearToCompare - 1}-01-01`;
      const prevYearEndDate = `${yearToCompare}-01-01`;
      
      const { data: prevYearData, error: prevYearError } = await supabase
        .from('servicios_custodia')
        .select(selectColumns)
        .gte('fecha_hora_cita', prevYearStartDate)
        .lt('fecha_hora_cita', prevYearEndDate);
      
      if (!prevYearError && prevYearData) {
        prevYearServices = prevYearData;
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      // CORREGIDO: Usar el año del filtro para los cálculos del reporte
      const reportYear = filterYear || currentYear;
      const currentDay = now.getDate() - 1; // Data con 1 día de retraso
      const daysInYear = Math.floor((now.getTime() - new Date(reportYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Calculate basic metrics
      const totalServices = services?.length || 0;
      
      // CORREGIDO: Servicios completados para cálculos de GMV
      const completedServicesArray = services?.filter(s => 
        s.estado?.toLowerCase() === 'completado' || 
        s.estado?.toLowerCase() === 'finalizado'
      ) || [];
      const completedServices = completedServicesArray.length;
      
      const cancelledServices = services?.filter(s => 
        s.estado?.toLowerCase() === 'cancelado'
      ).length || 0;
      
      const pendingServices = totalServices - completedServices - cancelledServices;

      // Calculate rates
      const completionRate = totalServices > 0 ? (completedServices / totalServices) * 100 : 0;
      const cancellationRate = totalServices > 0 ? (cancelledServices / totalServices) * 100 : 0;

      // Active custodians (unique custodians with services)
      const uniqueCustodians = new Set(
        services?.map(s => s.nombre_custodio).filter(Boolean) || []
      );
      const activeCustodians = uniqueCustodians.size;

      // Average services per custodian
      const averageServicesPerCustodian = activeCustodians > 0 ? totalServices / activeCustodians : 0;

      // Average km per service (only for completed services)
      const completedServicesWithKm = completedServicesArray.filter(s => s.km_recorridos > 0);
      const totalKm = completedServicesWithKm.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      const averageKmPerService = completedServicesWithKm.length > 0 ? totalKm / completedServicesWithKm.length : 0;

      // GMV calculations - CORREGIDO: Solo de servicios completados
      const totalGMV = completedServicesArray.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
      const averageAOV = completedServices > 0 ? totalGMV / completedServices : 0;

      // Current month metrics (MTD) - Usar funciones UTC para datos de DB
      // CORREGIDO: Usar reportYear en lugar de currentYear
      const currentMonthServices = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        return getUTCMonth(s.fecha_hora_cita) + 1 === currentMonth && 
               getUTCYear(s.fecha_hora_cita) === reportYear &&
               getUTCDayOfMonth(s.fecha_hora_cita) <= currentDay;
      }) || [];

      const currentMonthCompletedServices = currentMonthServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      );

      // CORREGIDO: Excluir cancelados de la tarjeta de KPIs
      const currentMonthNonCancelled = currentMonthServices.filter(s => 
        s.estado?.toLowerCase() !== 'cancelado'
      );
      const servicesThisMonth = currentMonthNonCancelled.length;
      // GMV del mes actual solo de completados
      const gmvThisMonth = currentMonthCompletedServices.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);

      // Previous month MTD (same day range)
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevMonthYear = currentMonth === 1 ? reportYear - 1 : reportYear;
      // CORREGIDO: Usar datos del año anterior si el mes anterior es diciembre del año pasado
      const prevMonthDataSource = prevMonthYear === reportYear ? services : prevYearServices;
      // CORREGIDO: Validar AÑO explícitamente para MTD del mes anterior
      const previousMonthMTDServices = prevMonthDataSource?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        const serviceYear = getUTCYear(s.fecha_hora_cita);
        const serviceMonth = getUTCMonth(s.fecha_hora_cita) + 1;
        const serviceDay = getUTCDayOfMonth(s.fecha_hora_cita);
        
        return serviceYear === prevMonthYear && 
               serviceMonth === prevMonth && 
               serviceDay <= currentDay;
      }) || [];

      const prevMonthCompletedServices = previousMonthMTDServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      );

      // YTD vs same period previous year - CORREGIDO: Usar reportYear
      const ytdServices = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        return getUTCYear(s.fecha_hora_cita) === reportYear;
      }) || [];

      const ytdCompletedServices = ytdServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      );

      // CORREGIDO: Usar datos del año anterior de la consulta separada
      const samePeriodPrevYear = prevYearServices?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        // Mismo período: hasta el mes actual
        return getUTCMonth(s.fecha_hora_cita) < currentMonth;
      }) || [];

      const samePeriodPrevYearCompleted = samePeriodPrevYear.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      );

      // GMV YTD
      const gmvYTD = ytdCompletedServices.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
      const gmvYTDPrevYear = samePeriodPrevYearCompleted.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);

      // Facturación promedio diaria
      const avgDailyGMV = daysInYear > 0 ? gmvYTD / daysInYear : 0;
      const avgDailyGMVPrevYear = daysInYear > 0 ? gmvYTDPrevYear / daysInYear : 0;

      // Current quarter and previous quarter
      const currentQuarter = Math.ceil(currentMonth / 3);
      const quarterStart = (currentQuarter - 1) * 3 + 1;
      const quarterEnd = currentQuarter * 3;

      // CORREGIDO: Usar reportYear en lugar de currentYear
      const currentQuarterServices = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        const serviceMonth = getUTCMonth(s.fecha_hora_cita) + 1;
        return getUTCYear(s.fecha_hora_cita) === reportYear &&
               serviceMonth >= quarterStart && serviceMonth <= quarterEnd;
      }) || [];

      // Previous quarter - CORREGIDO: Usar reportYear
      const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
      const prevQuarterYear = currentQuarter === 1 ? reportYear - 1 : reportYear;
      const prevQuarterStart = (prevQuarter - 1) * 3 + 1;
      const prevQuarterEnd = prevQuarter * 3;

      // CORREGIDO: Usar datos del año anterior si el trimestre anterior es del año pasado
      const previousQuarterDataSource = prevQuarterYear === reportYear ? services : prevYearServices;
      const previousQuarterServices = previousQuarterDataSource?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        const serviceMonth = getUTCMonth(s.fecha_hora_cita) + 1;
        return serviceMonth >= prevQuarterStart && serviceMonth <= prevQuarterEnd;
      }) || [];

      // Calculate metrics for previous periods
      const prevMonthCustodians = new Set(
        previousMonthMTDServices.map(s => s.nombre_custodio).filter(Boolean)
      ).size;

      const prevQuarterCustodians = new Set(
        previousQuarterServices.map(s => s.nombre_custodio).filter(Boolean)
      ).size;

      const currentMonthCustodians = new Set(
        currentMonthServices.map(s => s.nombre_custodio).filter(Boolean)
      ).size;

      const currentQuarterCustodians = new Set(
        currentQuarterServices.map(s => s.nombre_custodio).filter(Boolean)
      ).size;

      // Previous month completion rate
      const prevMonthCompleted = previousMonthMTDServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      ).length;
      const prevMonthCompletionRate = previousMonthMTDServices.length > 0 ? 
        (prevMonthCompleted / previousMonthMTDServices.length) * 100 : 0;

      // Previous month AOV - Solo de completados
      const prevMonthGMV = prevMonthCompletedServices.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
      const prevMonthAOV = prevMonthCompletedServices.length > 0 ? prevMonthGMV / prevMonthCompletedServices.length : 0;

      // Previous month Km average
      const prevMonthCompletedWithKm = previousMonthMTDServices.filter(s => 
        (s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado') &&
        s.km_recorridos > 0
      );
      const prevMonthTotalKm = prevMonthCompletedWithKm.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      const prevMonthAvgKm = prevMonthCompletedWithKm.length > 0 ? prevMonthTotalKm / prevMonthCompletedWithKm.length : 0;

      // Current month metrics for comparison
      const currentMonthCompletedCount = currentMonthServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      ).length;
      const currentMonthCompletionRate = currentMonthServices.length > 0 ? 
        (currentMonthCompletedCount / currentMonthServices.length) * 100 : 0;
      
      // AOV del mes actual solo de completados
      const currentMonthAOV = currentMonthCompletedServices.length > 0 ? gmvThisMonth / currentMonthCompletedServices.length : 0;

      const currentMonthCompletedWithKm = currentMonthCompletedServices.filter(s => s.km_recorridos > 0);
      const currentMonthTotalKm = currentMonthCompletedWithKm.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      const currentMonthAvgKm = currentMonthCompletedWithKm.length > 0 ? currentMonthTotalKm / currentMonthCompletedWithKm.length : 0;

      // Helper function to calculate change percent
      const calculateChangePercent = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Services distribution - MTD del mes actual vs mes anterior
      const currentMTDCompleted = currentMonthServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      ).length;
      const currentMTDPending = currentMonthServices.filter(s => 
        s.estado?.toLowerCase() !== 'completado' && 
        s.estado?.toLowerCase() !== 'finalizado' && 
        s.estado?.toLowerCase() !== 'cancelado'
      ).length;
      const currentMTDCancelled = currentMonthServices.filter(s => 
        s.estado?.toLowerCase() === 'cancelado'
      ).length;
      const totalCurrentMTD = currentMonthServices.length;

      // Mes anterior MTD
      const prevMTDCompleted = previousMonthMTDServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      ).length;
      const prevMTDPending = previousMonthMTDServices.filter(s => 
        s.estado?.toLowerCase() !== 'completado' && 
        s.estado?.toLowerCase() !== 'finalizado' && 
        s.estado?.toLowerCase() !== 'cancelado'
      ).length;
      const prevMTDCancelled = previousMonthMTDServices.filter(s => 
        s.estado?.toLowerCase() === 'cancelado'
      ).length;

      const servicesDistribution = {
        completed: totalCurrentMTD > 0 ? Math.round((currentMTDCompleted / totalCurrentMTD) * 100) : 0,
        pending: totalCurrentMTD > 0 ? Math.round((currentMTDPending / totalCurrentMTD) * 100) : 0,
        cancelled: totalCurrentMTD > 0 ? Math.round((currentMTDCancelled / totalCurrentMTD) * 100) : 0,
        // Conteos absolutos del mes actual
        completedCount: currentMTDCompleted,
        pendingCount: currentMTDPending,
        cancelledCount: currentMTDCancelled,
        // Comparación vs mes anterior
        completedChange: Math.round(calculateChangePercent(currentMTDCompleted, prevMTDCompleted) * 10) / 10,
        pendingChange: Math.round(calculateChangePercent(currentMTDPending, prevMTDPending) * 10) / 10,
        cancelledChange: Math.round(calculateChangePercent(currentMTDCancelled, prevMTDCancelled) * 10) / 10,
      };

      // Top custodians by costo_custodio with verifiable metrics
      const custodianStats: Record<string, { 
        name: string; 
        services: number; 
        servicesWithCost: number;
        gmv: number;
        costoCustodio: number;
        mesesActivos: Set<string>;
      }> = {};
      
      completedServicesArray.forEach(service => {
        const custodian = service.nombre_custodio;
        if (!custodian || custodian === '#N/A') return;

        if (!custodianStats[custodian]) {
          custodianStats[custodian] = { 
            name: custodian, 
            services: 0, 
            servicesWithCost: 0,
            gmv: 0,
            costoCustodio: 0,
            mesesActivos: new Set()
          };
        }

        custodianStats[custodian].services++;
        custodianStats[custodian].gmv += service.cobro_cliente || 0;
        
        // Solo sumar costo si existe y es válido
        const costo = parseFloat(service.costo_custodio) || 0;
        if (costo > 0) {
          custodianStats[custodian].costoCustodio += costo;
          custodianStats[custodian].servicesWithCost++;
        }
        
        // Registrar mes activo
        if (service.fecha_hora_cita) {
          const mes = service.fecha_hora_cita.substring(0, 7); // "2025-01"
          custodianStats[custodian].mesesActivos.add(mes);
        }
      });

      // Ordenar por costo custodio y calcular métricas verificables
      const topCustodians = Object.values(custodianStats)
        .filter(c => c.servicesWithCost > 0) // Solo custodios con datos de costo
        .sort((a, b) => b.costoCustodio - a.costoCustodio)
        .slice(0, 10)
        .map((c, index) => ({
          rank: index + 1,
          name: c.name,
          services: c.services,
          costoCustodio: c.costoCustodio,
          promedioCostoMes: c.mesesActivos.size > 0 ? c.costoCustodio / c.mesesActivos.size : 0,
          mesesActivos: c.mesesActivos.size,
          gmv: c.gmv,
          margen: c.gmv - c.costoCustodio,
          coberturaDatos: c.services > 0 ? Math.round((c.servicesWithCost / c.services) * 100) : 0
        }));

      // TOP CLIENTS by GMV (only completed services)
      const clientStats: Record<string, { name: string; services: number; gmv: number }> = {};
      completedServicesArray.forEach(service => {
        const client = service.nombre_cliente;
        if (!client || client === '#N/A') return;

        if (!clientStats[client]) {
          clientStats[client] = { name: client, services: 0, gmv: 0 };
        }

        clientStats[client].services++;
        clientStats[client].gmv += service.cobro_cliente || 0;
      });

      const topClients = Object.values(clientStats)
        .sort((a, b) => b.gmv - a.gmv)
        .slice(0, 10)
        .map(client => ({
          name: client.name,
          services: client.services,
          gmv: client.gmv,
          aov: client.services > 0 ? client.gmv / client.services : 0,
        }));

      // MONTHLY BREAKDOWN - Desglose mensual de GMV
      const yearToAnalyze = filterYear || currentYear;
      const monthlyBreakdown: Array<{
        month: string;
        monthNumber: number;
        services: number;
        completedServices: number;
        gmv: number;
        aov: number;
        completionRate: number;
      }> = [];

      for (let month = 1; month <= 12; month++) {
        const monthServices = services?.filter(s => {
          if (!s.fecha_hora_cita) return false;
          return getUTCMonth(s.fecha_hora_cita) + 1 === month && 
                 getUTCYear(s.fecha_hora_cita) === yearToAnalyze;
        }) || [];

        const monthCompletedServices = monthServices.filter(s => 
          s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
        );

        const gmv = monthCompletedServices.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
        const aov = monthCompletedServices.length > 0 ? gmv / monthCompletedServices.length : 0;
        const monthCompletionRate = monthServices.length > 0 
          ? (monthCompletedServices.length / monthServices.length) * 100 
          : 0;

        monthlyBreakdown.push({
          month: MONTH_NAMES[month - 1],
          monthNumber: month,
          services: monthServices.length,
          completedServices: monthCompletedServices.length,
          gmv,
          aov: Math.round(aov),
          completionRate: Math.round(monthCompletionRate * 10) / 10,
        });
      }

      // ============== NEW: FILL RATE CALCULATIONS ==============
      // Fill Rate = Servicios Realizados (completados + finalizados) / Servicios Solicitados (todos excepto cancelados antes de ejecución)
      const fillRateMTD = currentMonthServices.length > 0 
        ? (currentMTDCompleted / (currentMonthServices.length - currentMTDCancelled)) * 100 
        : 0;
      
      // Yesterday's fill rate
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
      
      const yesterdayServices = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        return s.fecha_hora_cita.startsWith(yesterdayStr);
      }) || [];
      
      const yesterdayCompleted = yesterdayServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      ).length;
      const yesterdayCancelled = yesterdayServices.filter(s => 
        s.estado?.toLowerCase() === 'cancelado'
      ).length;
      const yesterdayFillRate = yesterdayServices.length > yesterdayCancelled 
        ? (yesterdayCompleted / (yesterdayServices.length - yesterdayCancelled)) * 100 
        : 0;
      
      // Previous month fill rate
      const prevMonthFillRate = previousMonthMTDServices.length > prevMTDCancelled 
        ? (prevMTDCompleted / (previousMonthMTDServices.length - prevMTDCancelled)) * 100 
        : 0;

      const fillRate = {
        mtd: Math.round(fillRateMTD * 10) / 10,
        yesterday: Math.round(yesterdayFillRate * 10) / 10,
        changeVsYesterday: Math.round(calculateChangePercent(fillRateMTD, yesterdayFillRate) * 10) / 10,
        changeVsPrevMonth: Math.round(calculateChangePercent(fillRateMTD, prevMonthFillRate) * 10) / 10,
        target: 95
      };

      // ============== NEW: ON-TIME PERFORMANCE CALCULATIONS ==============
      // OTP = Servicios sin retraso / Total servicios finalizados
      // Using tiempo_retraso field where 0 = on time
      const currentMonthOnTime = currentMonthCompletedServices.filter(s => 
        (s as any).tiempo_retraso === 0 || (s as any).tiempo_retraso === null || (s as any).tiempo_retraso === undefined
      ).length;
      const otpMTD = currentMonthCompletedServices.length > 0 
        ? (currentMonthOnTime / currentMonthCompletedServices.length) * 100 
        : 0;
      
      const prevMonthOnTime = prevMonthCompletedServices.filter(s => 
        (s as any).tiempo_retraso === 0 || (s as any).tiempo_retraso === null || (s as any).tiempo_retraso === undefined
      ).length;
      const otpPrevMonth = prevMonthCompletedServices.length > 0 
        ? (prevMonthOnTime / prevMonthCompletedServices.length) * 100 
        : 0;

      const onTimePerformance = {
        mtd: Math.round(otpMTD * 10) / 10,
        previousMonth: Math.round(otpPrevMonth * 10) / 10,
        changePercent: Math.round(calculateChangePercent(otpMTD, otpPrevMonth) * 10) / 10,
        target: 90
      };

      // ============== NEW: DAILY TREND DATA (Last 14 days) ==============
      const dailyTrend: DailyTrendData[] = [];
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i - 1); // -1 porque los datos tienen 1 día de retraso
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];
        const dayNum = date.getDate();
        
        const dayServices = services?.filter(s => 
          s.fecha_hora_cita?.startsWith(dateStr)
        ) || [];
        
        const dayCompleted = dayServices.filter(s => 
          s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
        ).length;
        const dayCancelled = dayServices.filter(s => 
          s.estado?.toLowerCase() === 'cancelado'
        ).length;
        const dayOnTime = dayServices.filter(s => 
          (s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado') &&
          ((s as any).tiempo_retraso === 0 || (s as any).tiempo_retraso === null)
        ).length;
        const dayWithDelay = dayCompleted - dayOnTime;
        
        const dayFillRate = dayServices.length > dayCancelled 
          ? (dayCompleted / (dayServices.length - dayCancelled)) * 100 
          : 0;
        const dayOtpRate = dayCompleted > 0 
          ? (dayOnTime / dayCompleted) * 100 
          : 0;
        
        dailyTrend.push({
          fecha: dateStr,
          fechaLabel: `${dayName} ${dayNum}`,
          solicitados: dayServices.length - dayCancelled,
          realizados: dayCompleted,
          fillRate: Math.round(dayFillRate * 10) / 10,
          aTiempo: dayOnTime,
          conRetraso: dayWithDelay,
          otpRate: Math.round(dayOtpRate * 10) / 10
        });
      }

      // ============== NEW: OPERATIONAL ALERTS ==============
      const alerts: OperationalAlert[] = [];
      
      // Alert: Low Fill Rate MTD
      if (fillRateMTD < 90) {
        alerts.push({
          id: 'fill-rate-critical',
          type: 'critical',
          title: 'Fill Rate bajo crítico',
          description: `Fill Rate MTD en ${fillRate.mtd}%, por debajo del 90%`,
          value: `${fillRate.mtd}%`
        });
      } else if (fillRateMTD < 95) {
        alerts.push({
          id: 'fill-rate-warning',
          type: 'warning',
          title: 'Fill Rate por debajo de meta',
          description: `Fill Rate MTD en ${fillRate.mtd}%, meta: 95%`,
          value: `${fillRate.mtd}%`
        });
      }
      
      // Alert: Low OTP
      if (otpMTD < 80) {
        alerts.push({
          id: 'otp-critical',
          type: 'critical',
          title: 'On-Time Performance crítico',
          description: `Solo ${onTimePerformance.mtd}% de servicios a tiempo`,
          value: `${onTimePerformance.mtd}%`
        });
      } else if (otpMTD < 90) {
        alerts.push({
          id: 'otp-warning',
          type: 'warning',
          title: 'On-Time Performance bajo',
          description: `${onTimePerformance.mtd}% de servicios a tiempo, meta: 90%`,
          value: `${onTimePerformance.mtd}%`
        });
      }
      
      // Alert: Yesterday's drop
      if (yesterdayFillRate < fillRateMTD - 5) {
        alerts.push({
          id: 'yesterday-drop',
          type: 'warning',
          title: 'Caída de Fill Rate ayer',
          description: `Fill Rate ayer: ${fillRate.yesterday}%, -${(fillRateMTD - yesterdayFillRate).toFixed(1)}% vs MTD`,
          value: `${fillRate.yesterday}%`
        });
      }
      
      // Alert: Services pending without custodian
      if (currentMTDPending > 5) {
        alerts.push({
          id: 'pending-services',
          type: 'info',
          title: 'Servicios pendientes',
          description: `${currentMTDPending} servicios aún sin completar este mes`,
          value: currentMTDPending.toString()
        });
      }
      
      // Success alert if everything is on track
      if (fillRateMTD >= 95 && otpMTD >= 90) {
        alerts.push({
          id: 'on-track',
          type: 'success',
          title: 'Operación en meta',
          description: 'Fill Rate y On-Time Performance dentro de objetivos',
          value: '✓'
        });
      }

      return {
        totalServices,
        completedServices,
        cancelledServices,
        pendingServices,
        completionRate: Math.round(completionRate * 10) / 10,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        activeCustodians,
        averageServicesPerCustodian: Math.round(averageServicesPerCustodian * 10) / 10,
        averageKmPerService: Math.round(averageKmPerService),
        totalGMV,
        averageAOV: Math.round(averageAOV),
        servicesThisMonth,
        gmvThisMonth,
        servicesDistribution,
        topCustodians,
        topClients,
        monthlyBreakdown,
        // NEW metrics
        fillRate,
        onTimePerformance,
        dailyTrend,
        alerts,
        comparatives: {
          servicesThisMonth: {
            current: servicesThisMonth, // Ya excluye cancelados
            previousMonth: previousMonthMTDServices.filter(s => s.estado?.toLowerCase() !== 'cancelado').length,
            changePercent: Math.round(calculateChangePercent(
              servicesThisMonth, 
              previousMonthMTDServices.filter(s => s.estado?.toLowerCase() !== 'cancelado').length
            ) * 10) / 10
          },
          servicesYTD: {
            current: ytdServices.length,
            previousYear: samePeriodPrevYear.length,
            changePercent: Math.round(calculateChangePercent(ytdServices.length, samePeriodPrevYear.length) * 10) / 10
          },
          activeCustodiansMonth: {
            current: currentMonthCustodians,
            previousMonth: prevMonthCustodians,
            changePercent: Math.round(calculateChangePercent(currentMonthCustodians, prevMonthCustodians) * 10) / 10
          },
          activeCustodiansQuarter: {
            current: currentQuarterCustodians,
            previousQuarter: prevQuarterCustodians,
            changePercent: Math.round(calculateChangePercent(currentQuarterCustodians, prevQuarterCustodians) * 10) / 10
          },
          completionRate: {
            current: Math.round(currentMonthCompletionRate * 10) / 10,
            previousMonth: Math.round(prevMonthCompletionRate * 10) / 10,
            changePercent: Math.round(calculateChangePercent(currentMonthCompletionRate, prevMonthCompletionRate) * 10) / 10
          },
          averageAOV: {
            current: Math.round(currentMonthAOV),
            previousMonth: Math.round(prevMonthAOV),
            changePercent: Math.round(calculateChangePercent(currentMonthAOV, prevMonthAOV) * 10) / 10
          },
          totalGMV: {
            current: gmvThisMonth,
            previousMonth: prevMonthGMV,
            changePercent: Math.round(calculateChangePercent(gmvThisMonth, prevMonthGMV) * 10) / 10
          },
          averageKmPerService: {
            current: Math.round(currentMonthAvgKm),
            previousMonth: Math.round(prevMonthAvgKm),
            changePercent: Math.round(calculateChangePercent(currentMonthAvgKm, prevMonthAvgKm) * 10) / 10
          },
          gmvYTD: {
            current: gmvYTD,
            previousYear: gmvYTDPrevYear,
            changePercent: Math.round(calculateChangePercent(gmvYTD, gmvYTDPrevYear) * 10) / 10
          },
          avgDailyGMV: {
            current: Math.round(avgDailyGMV),
            previousYear: Math.round(avgDailyGMVPrevYear),
            changePercent: Math.round(calculateChangePercent(avgDailyGMV, avgDailyGMVPrevYear) * 10) / 10
          }
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};
