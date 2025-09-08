import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientMetrics {
  clientName: string;
  totalServices: number;
  completedServices: number;
  cancelledServices: number;
  totalGMV: number;
  averageAOV: number;
  completionRate: number;
  firstService: string;
  lastService: string;
  totalKm: number;
  averageKm: number;
  servicesPerMonth: number;
  monthlyTrend: Array<{
    month: string;
    services: number;
    gmv: number;
  }>;
  serviceTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  custodianPerformance: Array<{
    custodian: string;
    services: number;
    completionRate: number;
    averageKm: number;
  }>;
}

export interface ClientSummary {
  nombre_cliente: string;
  totalServices: number;
  totalGMV: number;
  completionRate: number;
  lastService: string;
}

export const useClientsData = () => {
  return useQuery({
    queryKey: ['clients-data'],
    queryFn: async (): Promise<ClientSummary[]> => {
      const { data: services, error } = await supabase
        .from('servicios_custodia')
        .select('*');

      if (error) throw error;

      // Group by client and calculate metrics
      const clientStats = {};
      
      services?.forEach(service => {
        const clientName = service.nombre_cliente;
        if (!clientName || clientName === '#N/A') return;

        if (!clientStats[clientName]) {
          clientStats[clientName] = {
            nombre_cliente: clientName,
            services: [],
            totalGMV: 0,
            completedServices: 0,
            totalServices: 0
          };
        }

        clientStats[clientName].services.push(service);
        clientStats[clientName].totalServices++;
        clientStats[clientName].totalGMV += service.cobro_cliente || 0;
        
        if (service.estado?.toLowerCase() === 'completado' || 
            service.estado?.toLowerCase() === 'finalizado') {
          clientStats[clientName].completedServices++;
        }
      });

      // Convert to array and calculate final metrics
      const clientsArray = Object.values(clientStats).map((client: any) => {
        const completionRate = client.totalServices > 0 
          ? (client.completedServices / client.totalServices) * 100 
          : 0;

        // Get last service date
        const lastServiceDate = client.services
          .filter(s => s.fecha_hora_cita)
          .sort((a, b) => new Date(b.fecha_hora_cita).getTime() - new Date(a.fecha_hora_cita).getTime())[0]?.fecha_hora_cita;

        return {
          nombre_cliente: client.nombre_cliente,
          totalServices: client.totalServices,
          totalGMV: client.totalGMV,
          completionRate: Math.round(completionRate * 10) / 10,
          lastService: lastServiceDate ? new Date(lastServiceDate).toLocaleDateString('es-MX') : 'N/A'
        };
      });

      // Sort by total GMV descending
      return clientsArray.sort((a, b) => b.totalGMV - a.totalGMV);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useClientAnalytics = (clientName: string) => {
  return useQuery({
    queryKey: ['client-analytics', clientName],
    queryFn: async (): Promise<ClientMetrics | null> => {
      if (!clientName) return null;

      const { data: services, error } = await supabase
        .from('servicios_custodia')
        .select('*')
        .eq('nombre_cliente', clientName);

      if (error) throw error;
      if (!services || services.length === 0) return null;

      // Basic metrics
      const totalServices = services.length;
      const completedServices = services.filter(s => 
        s.estado?.toLowerCase() === 'completado' || 
        s.estado?.toLowerCase() === 'finalizado'
      ).length;
      
      const cancelledServices = services.filter(s => 
        s.estado?.toLowerCase() === 'cancelado'
      ).length;

      const totalGMV = services.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
      const averageAOV = totalServices > 0 ? totalGMV / totalServices : 0;
      const completionRate = totalServices > 0 ? (completedServices / totalServices) * 100 : 0;

      // Date range
      const serviceDates = services
        .filter(s => s.fecha_hora_cita)
        .map(s => new Date(s.fecha_hora_cita))
        .sort((a, b) => a.getTime() - b.getTime());
      
      const firstService = serviceDates[0]?.toLocaleDateString('es-MX') || 'N/A';
      const lastService = serviceDates[serviceDates.length - 1]?.toLocaleDateString('es-MX') || 'N/A';

      // KM metrics
      const servicesWithKm = services.filter(s => s.km_recorridos && s.km_recorridos > 0);
      const totalKm = servicesWithKm.reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
      const averageKm = servicesWithKm.length > 0 ? totalKm / servicesWithKm.length : 0;

      // Monthly trend
      const monthlyData = {};
      services.forEach(service => {
        if (!service.fecha_hora_cita) return;
        const date = new Date(service.fecha_hora_cita);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { services: 0, gmv: 0 };
        }
        
        monthlyData[monthKey].services++;
        monthlyData[monthKey].gmv += service.cobro_cliente || 0;
      });

      const monthlyTrend = Object.entries(monthlyData)
        .map(([month, data]: [string, any]) => ({
          month,
          services: data.services,
          gmv: data.gmv
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Last 12 months

      // Service types
      const serviceTypeData = {};
      services.forEach(service => {
        const type = service.tipo_servicio || 'Sin especificar';
        serviceTypeData[type] = (serviceTypeData[type] || 0) + 1;
      });

      const serviceTypes = Object.entries(serviceTypeData).map(([type, count]: [string, any]) => ({
        type,
        count,
        percentage: Math.round((count / totalServices) * 100)
      }));

      // Custodian performance
      const custodianData = {};
      services.forEach(service => {
        const custodian = service.nombre_custodio || 'Sin asignar';
        if (!custodianData[custodian]) {
          custodianData[custodian] = {
            services: [],
            totalServices: 0,
            completedServices: 0,
            totalKm: 0
          };
        }
        
        custodianData[custodian].services.push(service);
        custodianData[custodian].totalServices++;
        
        if (service.estado?.toLowerCase() === 'completado' || 
            service.estado?.toLowerCase() === 'finalizado') {
          custodianData[custodian].completedServices++;
          custodianData[custodian].totalKm += service.km_recorridos || 0;
        }
      });

      const custodianPerformance = Object.entries(custodianData).map(([custodian, data]: [string, any]) => ({
        custodian,
        services: data.totalServices,
        completionRate: data.totalServices > 0 ? (data.completedServices / data.totalServices) * 100 : 0,
        averageKm: data.completedServices > 0 ? data.totalKm / data.completedServices : 0
      }));

      // Calculate services per month
      const monthsActive = monthlyTrend.length || 1;
      const servicesPerMonth = totalServices / monthsActive;

      return {
        clientName,
        totalServices,
        completedServices,
        cancelledServices,
        totalGMV,
        averageAOV: Math.round(averageAOV),
        completionRate: Math.round(completionRate * 10) / 10,
        firstService,
        lastService,
        totalKm: Math.round(totalKm),
        averageKm: Math.round(averageKm),
        servicesPerMonth: Math.round(servicesPerMonth * 10) / 10,
        monthlyTrend,
        serviceTypes,
        custodianPerformance: custodianPerformance.sort((a, b) => b.services - a.services)
      };
    },
    enabled: !!clientName,
    staleTime: 5 * 60 * 1000,
  });
};