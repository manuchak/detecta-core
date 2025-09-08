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

export interface ClientDashboardMetrics {
  topAOV: {
    clientName: string;
    aov: number;
    services: number;
  };
  mostServices: {
    clientName: string;
    services: number;
    gmv: number;
  };
  highestGMV: {
    clientName: string;
    gmv: number;
    services: number;
  };
  bestCompletion: {
    clientName: string;
    completionRate: number;
    services: number;
  };
  serviceTypeAnalysis: {
    foraneo: { count: number; avgValue: number };
    local: { count: number; avgValue: number };
    foraneoPercentage: number;
  };
  avgKmPerClient: number;
  topKmClients: Array<{
    clientName: string;
    avgKm: number;
    totalKm: number;
  }>;
}

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

export const useClientsData = (dateRange?: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['clients-data', dateRange],
    queryFn: async (): Promise<ClientSummary[]> => {
      let query = supabase.from('servicios_custodia').select('*');
      
      if (dateRange) {
        query = query
          .gte('fecha_hora_cita', dateRange.from.toISOString())
          .lte('fecha_hora_cita', dateRange.to.toISOString());
      }

      const { data: services, error } = await query;

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

export const useClientAnalytics = (clientName: string, dateRange?: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['client-analytics', clientName, dateRange],
    queryFn: async (): Promise<ClientMetrics | null> => {
      if (!clientName) return null;

      let query = supabase
        .from('servicios_custodia')
        .select('*')
        .eq('nombre_cliente', clientName);
      
      if (dateRange) {
        query = query
          .gte('fecha_hora_cita', dateRange.from.toISOString())
          .lte('fecha_hora_cita', dateRange.to.toISOString());
      }

      const { data: services, error } = await query;

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

export const useClientMetrics = (dateRange?: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['client-metrics', dateRange],
    queryFn: async (): Promise<ClientDashboardMetrics> => {
      let query = supabase.from('servicios_custodia').select('*');
      
      if (dateRange) {
        query = query
          .gte('fecha_hora_cita', dateRange.from.toISOString())
          .lte('fecha_hora_cita', dateRange.to.toISOString());
      }

      const { data: services, error } = await query;

      if (error) throw error;

      // Group by client and calculate comprehensive metrics
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
            totalServices: 0,
            totalKm: 0,
            foraneoServices: 0,
            localServices: 0,
            foraneoGMV: 0,
            localGMV: 0
          };
        }

        clientStats[clientName].services.push(service);
        clientStats[clientName].totalServices++;
        clientStats[clientName].totalGMV += service.cobro_cliente || 0;
        
        if (service.estado?.toLowerCase() === 'completado' || 
            service.estado?.toLowerCase() === 'finalizado') {
          clientStats[clientName].completedServices++;
        }

        if (service.km_recorridos && service.km_recorridos > 0) {
          clientStats[clientName].totalKm += service.km_recorridos;
          
          // Classify as foraneo if > 100km, otherwise local
          if (service.km_recorridos > 100) {
            clientStats[clientName].foraneoServices++;
            clientStats[clientName].foraneoGMV += service.cobro_cliente || 0;
          } else {
            clientStats[clientName].localServices++;
            clientStats[clientName].localGMV += service.cobro_cliente || 0;
          }
        }
      });

      // Convert to array and calculate metrics
      const clientsArray = Object.values(clientStats).map((client: any) => {
        const completionRate = client.totalServices > 0 
          ? (client.completedServices / client.totalServices) * 100 
          : 0;
        
        const aov = client.totalServices > 0 ? client.totalGMV / client.totalServices : 0;
        const avgKm = client.totalServices > 0 ? client.totalKm / client.totalServices : 0;

        return {
          ...client,
          completionRate: Math.round(completionRate * 10) / 10,
          aov: Math.round(aov),
          avgKm: Math.round(avgKm)
        };
      });

      // Calculate top performers
      const topAOV = clientsArray
        .filter(c => c.totalServices >= 5)
        .sort((a, b) => b.aov - a.aov)[0] || { nombre_cliente: 'N/A', aov: 0, totalServices: 0 };

      const mostServices = clientsArray
        .sort((a, b) => b.totalServices - a.totalServices)[0] || { nombre_cliente: 'N/A', totalServices: 0, totalGMV: 0 };

      const highestGMV = clientsArray
        .sort((a, b) => b.totalGMV - a.totalGMV)[0] || { nombre_cliente: 'N/A', totalGMV: 0, totalServices: 0 };

      const bestCompletion = clientsArray
        .filter(c => c.totalServices >= 5)
        .sort((a, b) => b.completionRate - a.completionRate)[0] || { nombre_cliente: 'N/A', completionRate: 0, totalServices: 0 };

      // Service type analysis
      const totalForaneo = clientsArray.reduce((sum, c) => sum + c.foraneoServices, 0);
      const totalLocal = clientsArray.reduce((sum, c) => sum + c.localServices, 0);
      const totalForaneoGMV = clientsArray.reduce((sum, c) => sum + c.foraneoGMV, 0);
      const totalLocalGMV = clientsArray.reduce((sum, c) => sum + c.localGMV, 0);

      const foraneoPercentage = totalForaneo + totalLocal > 0 
        ? Math.round((totalForaneo / (totalForaneo + totalLocal)) * 100)
        : 0;

      // Top KM clients
      const topKmClients = clientsArray
        .filter(c => c.totalKm > 0)
        .sort((a, b) => b.avgKm - a.avgKm)
        .slice(0, 5)
        .map(c => ({
          clientName: c.nombre_cliente,
          avgKm: c.avgKm,
          totalKm: c.totalKm
        }));

      const avgKmPerClient = clientsArray.length > 0 
        ? clientsArray.reduce((sum, c) => sum + c.avgKm, 0) / clientsArray.length
        : 0;

      return {
        topAOV: {
          clientName: topAOV.nombre_cliente,
          aov: topAOV.aov,
          services: topAOV.totalServices
        },
        mostServices: {
          clientName: mostServices.nombre_cliente,
          services: mostServices.totalServices,
          gmv: mostServices.totalGMV
        },
        highestGMV: {
          clientName: highestGMV.nombre_cliente,
          gmv: highestGMV.totalGMV,
          services: highestGMV.totalServices
        },
        bestCompletion: {
          clientName: bestCompletion.nombre_cliente,
          completionRate: bestCompletion.completionRate,
          services: bestCompletion.totalServices
        },
        serviceTypeAnalysis: {
          foraneo: {
            count: totalForaneo,
            avgValue: totalForaneo > 0 ? totalForaneoGMV / totalForaneo : 0
          },
          local: {
            count: totalLocal,
            avgValue: totalLocal > 0 ? totalLocalGMV / totalLocal : 0
          },
          foraneoPercentage
        },
        avgKmPerClient,
        topKmClients
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};