import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    name: string;
    services: number;
    gmv: number;
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
  };
}

export const useOperationalMetrics = () => {
  return useQuery({
    queryKey: ['operational-metrics'],
    queryFn: async (): Promise<OperationalMetrics> => {
      // Fetch all services data
      const { data: services, error: servicesError } = await supabase
        .from('servicios_custodia')
        .select('*');

      if (servicesError) throw servicesError;

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Calculate basic metrics
      const totalServices = services?.length || 0;
      const completedServices = services?.filter(s => 
        s.estado?.toLowerCase() === 'completado' || 
        s.estado?.toLowerCase() === 'finalizado'
      ).length || 0;
      
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
      const completedServicesWithKm = services?.filter(s => 
        (s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado') &&
        s.km_recorridos > 0
      ) || [];
      
      const totalKm = completedServicesWithKm.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      const averageKmPerService = completedServicesWithKm.length > 0 ? totalKm / completedServicesWithKm.length : 0;

      // GMV calculations
      const totalGMV = services?.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0) || 0;
      const averageAOV = totalServices > 0 ? totalGMV / totalServices : 0;

      // Current month metrics
      const currentMonthServices = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        const serviceDate = new Date(s.fecha_hora_cita);
        return serviceDate.getMonth() + 1 === currentMonth && serviceDate.getFullYear() === currentYear;
      }) || [];

      const servicesThisMonth = currentMonthServices.length;
      const gmvThisMonth = currentMonthServices.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);

      // Previous month metrics
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const previousMonthServices = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        const serviceDate = new Date(s.fecha_hora_cita);
        return serviceDate.getMonth() + 1 === prevMonth && serviceDate.getFullYear() === prevMonthYear;
      }) || [];

      // YTD vs same period previous year
      const ytdServices = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        const serviceDate = new Date(s.fecha_hora_cita);
        return serviceDate.getFullYear() === currentYear;
      }) || [];

      const samePeriodPrevYear = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        const serviceDate = new Date(s.fecha_hora_cita);
        return serviceDate.getFullYear() === currentYear - 1 && 
               serviceDate.getMonth() < currentMonth;
      }) || [];

      // Current quarter and previous quarter
      const currentQuarter = Math.ceil(currentMonth / 3);
      const quarterStart = (currentQuarter - 1) * 3 + 1;
      const quarterEnd = currentQuarter * 3;

      const currentQuarterServices = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        const serviceDate = new Date(s.fecha_hora_cita);
        const serviceMonth = serviceDate.getMonth() + 1;
        return serviceDate.getFullYear() === currentYear &&
               serviceMonth >= quarterStart && serviceMonth <= quarterEnd;
      }) || [];

      // Previous quarter
      const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
      const prevQuarterYear = currentQuarter === 1 ? currentYear - 1 : currentYear;
      const prevQuarterStart = (prevQuarter - 1) * 3 + 1;
      const prevQuarterEnd = prevQuarter * 3;

      const previousQuarterServices = services?.filter(s => {
        if (!s.fecha_hora_cita) return false;
        const serviceDate = new Date(s.fecha_hora_cita);
        const serviceMonth = serviceDate.getMonth() + 1;
        return serviceDate.getFullYear() === prevQuarterYear &&
               serviceMonth >= prevQuarterStart && serviceMonth <= prevQuarterEnd;
      }) || [];

      // Calculate metrics for previous periods
      const prevMonthCustodians = new Set(
        previousMonthServices.map(s => s.nombre_custodio).filter(Boolean)
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
      const prevMonthCompleted = previousMonthServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      ).length;
      const prevMonthCompletionRate = previousMonthServices.length > 0 ? 
        (prevMonthCompleted / previousMonthServices.length) * 100 : 0;

      // Previous month AOV
      const prevMonthGMV = previousMonthServices.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
      const prevMonthAOV = previousMonthServices.length > 0 ? prevMonthGMV / previousMonthServices.length : 0;

      // Previous month Km average
      const prevMonthCompletedWithKm = previousMonthServices.filter(s => 
        (s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado') &&
        s.km_recorridos > 0
      );
      const prevMonthTotalKm = prevMonthCompletedWithKm.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      const prevMonthAvgKm = prevMonthCompletedWithKm.length > 0 ? prevMonthTotalKm / prevMonthCompletedWithKm.length : 0;

      // Current month metrics for comparison
      const currentMonthCompleted = currentMonthServices.filter(s => 
        s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado'
      ).length;
      const currentMonthCompletionRate = currentMonthServices.length > 0 ? 
        (currentMonthCompleted / currentMonthServices.length) * 100 : 0;
      
      const currentMonthAOV = currentMonthServices.length > 0 ? gmvThisMonth / currentMonthServices.length : 0;

      const currentMonthCompletedWithKm = currentMonthServices.filter(s => 
        (s.estado?.toLowerCase() === 'completado' || s.estado?.toLowerCase() === 'finalizado') &&
        s.km_recorridos > 0
      );
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

      // Top custodians by services and GMV
      const custodianStats = {};
      services?.forEach(service => {
        const custodian = service.nombre_custodio;
        if (!custodian || custodian === '#N/A') return;

        if (!custodianStats[custodian]) {
          custodianStats[custodian] = {
            name: custodian,
            services: 0,
            gmv: 0
          };
        }

        custodianStats[custodian].services++;
        custodianStats[custodian].gmv += service.cobro_cliente || 0;
      });

      const topCustodians = Object.values(custodianStats)
        .sort((a: any, b: any) => b.services - a.services)
        .slice(0, 5);

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
        topCustodians: topCustodians as any,
        comparatives: {
          servicesThisMonth: {
            current: servicesThisMonth,
            previousMonth: previousMonthServices.length,
            changePercent: Math.round(calculateChangePercent(servicesThisMonth, previousMonthServices.length) * 10) / 10
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
          }
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};