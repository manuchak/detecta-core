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
        topCustodians: topCustodians as any
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};