// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getUTCMonth, getUTCYear, getUTCDayOfMonth } from '@/utils/timezoneUtils';

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

      const servicesThisMonth = currentMonthServices.length;
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

      // Services distribution
      const servicesDistribution = {
        completed: Math.round((completedServices / totalServices) * 100) || 0,
        pending: Math.round((pendingServices / totalServices) * 100) || 0,
        cancelled: Math.round((cancelledServices / totalServices) * 100) || 0,
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
        comparatives: {
          servicesThisMonth: {
            current: servicesThisMonth,
            previousMonth: previousMonthMTDServices.length,
            changePercent: Math.round(calculateChangePercent(servicesThisMonth, previousMonthMTDServices.length) * 10) / 10
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
