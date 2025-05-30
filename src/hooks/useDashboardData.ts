
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  calculateBasicMetrics,
  calculateServiceCounts,
  processMonthlyGmv,
  processServiceTypes,
  processDailyData,
  processTopClients,
  processServiceStatus,
  ServiceData
} from '@/utils/dashboardCalculations';
import { canAccessDashboardData } from '@/utils/authHelpers';

export interface MonthlyGmvData {
  name: string;
  value: number;
  previousYear: number;
}

export interface ServiceTypesData {
  name: string;
  value: number;
}

export interface DailyServiceData {
  day: string;
  count: number;
}

export interface TopClientsData {
  name: string;
  value: number;
}

export interface ServiceStatusData {
  name: string;
  value: number;
  color: string;
}

export interface DashboardMetrics {
  totalServices: number;
  totalGMV: number;
  activeClients: number;
  averageServiceValue: number;
  yearlyGrowth: number;
  completedServices: number;
  ongoingServices: number;
  cancelledServices: number;
  pendingServices: number;
}

export type TimeframeOption = "day" | "week" | "month" | "quarter" | "year";
export type ServiceTypeOption = "all" | "local" | "foraneo";

export const useDashboardData = (timeframe: TimeframeOption = "month", serviceTypeFilter: ServiceTypeOption = "all") => {
  // Query para obtener servicios con autenticación apropiada
  const { data: allServicesData = [], isLoading, error } = useQuery({
    queryKey: ['dashboard-services', timeframe, serviceTypeFilter],
    queryFn: async () => {
      try {
        console.log("Checking user permissions for dashboard data...");
        
        // Verificar permisos del usuario
        const hasAccess = await canAccessDashboardData();
        
        if (!hasAccess) {
          console.warn('User does not have permission to access dashboard data');
          return [];
        }
        
        console.log("User has access, fetching dashboard data...");
        
        // Calcular fecha límite basada en timeframe
        let daysBack = 30;
        switch (timeframe) {
          case 'day': daysBack = 1; break;
          case 'week': daysBack = 7; break;
          case 'month': daysBack = 30; break;
          case 'quarter': daysBack = 90; break;
          case 'year': daysBack = 365; break;
        }
        
        // Construir consulta con filtros apropiados
        let query = supabase
          .from('servicios_custodia')
          .select('*')
          .gte('fecha_hora_cita', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
          .order('fecha_hora_cita', { ascending: false });

        // Aplicar filtro de tipo de servicio si es necesario
        if (serviceTypeFilter !== 'all') {
          query = query.eq('local_foraneo', serviceTypeFilter);
        }

        // Limitar resultados para rendimiento
        query = query.limit(1000);

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching dashboard data:', error);
          throw error;
        }

        console.log('Dashboard data fetched successfully:', data?.length || 0);
        
        // Log sample data for debugging
        if (data && data.length > 0) {
          console.log('Sample record:', data[0]);
          console.log('Sample id_servicio values:', data.slice(0, 3).map(d => d.id_servicio));
          console.log('Sample estados values:', data.slice(0, 3).map(d => d.estado));
          console.log('Sample cobro_cliente values:', data.slice(0, 3).map(d => d.cobro_cliente));
        }
        
        return data || [];
      } catch (err) {
        console.error('Error in dashboard query:', err);
        throw err;
      }
    },
    enabled: true, // Always try to fetch, permissions are checked inside
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error?.message?.includes('permission') || error?.message?.includes('Access denied')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  console.log('Hook - allServicesData length:', allServicesData.length);

  // Convertir datos a formato ServiceData
  const serviceData: ServiceData[] = allServicesData.map(service => ({
    id_servicio: service.id_servicio,
    estado: service.estado,
    cobro_cliente: service.cobro_cliente,
    nombre_cliente: service.nombre_cliente,
    fecha_hora_cita: service.fecha_hora_cita,
    tipo_servicio: service.tipo_servicio,
    km_recorridos: service.km_recorridos
  }));

  console.log('Hook - serviceData length after mapping:', serviceData.length);
  console.log('Hook - First 3 mapped records:', serviceData.slice(0, 3));

  // Calcular métricas usando las funciones refactorizadas
  const basicMetrics = calculateBasicMetrics(serviceData);
  const serviceCounts = calculateServiceCounts(serviceData);

  console.log('Estados mapeados:', serviceCounts);
  console.log('Métricas calculadas:', {
    ...basicMetrics,
    ...serviceCounts
  });

  // Procesar datos para gráficos
  const monthlyGmvData: MonthlyGmvData[] = processMonthlyGmv(serviceData);
  const serviceTypesData: ServiceTypesData[] = processServiceTypes(serviceData);
  const dailyServiceData: DailyServiceData[] = processDailyData(serviceData);
  const topClientsData: TopClientsData[] = processTopClients(serviceData);
  const serviceStatusData: ServiceStatusData[] = processServiceStatus(serviceData);

  const dashboardData: DashboardMetrics = {
    ...basicMetrics,
    ...serviceCounts,
    yearlyGrowth: 15 // Este valor podría calcularse comparando con datos del año anterior
  };

  const refreshAllData = () => {
    console.log("Refreshing dashboard data...");
  };

  return {
    dashboardData,
    monthlyGmvData,
    serviceTypesData,
    dailyServiceData,
    topClientsData,
    serviceStatusData,
    totalGMV: basicMetrics.totalGMV,
    isLoading,
    error,
    refreshAllData
  };
};
