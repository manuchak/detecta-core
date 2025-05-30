
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
  // Query para obtener todos los servicios
  const { data: allServicesData = [], isLoading, error } = useQuery({
    queryKey: ['dashboard-services', timeframe, serviceTypeFilter],
    queryFn: async () => {
      try {
        console.log("Fetching dashboard data from servicios_custodia...");
        
        let query = supabase
          .from('servicios_custodia')
          .select('*');

        // Aplicar filtro de tipo de servicio
        if (serviceTypeFilter !== 'all') {
          query = query.eq('local_foraneo', serviceTypeFilter);
        }

        const { data, error } = await query.limit(1000);

        if (error) {
          console.error('Error fetching dashboard data:', error);
          return [];
        }

        console.log('Raw data from Supabase:', data);
        console.log('Total records fetched:', data?.length || 0);
        
        // Log sample data for debugging
        if (data && data.length > 0) {
          console.log('Sample record:', data[0]);
        }
        
        return data || [];
      } catch (err) {
        console.error('Error in dashboard query:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Convertir datos a formato ServiceData
  const serviceData: ServiceData[] = allServicesData.map(service => ({
    estado: service.estado,
    cobro_cliente: service.cobro_cliente,
    nombre_cliente: service.nombre_cliente,
    fecha_hora_cita: service.fecha_hora_cita,
    tipo_servicio: service.tipo_servicio,
    km_recorridos: service.km_recorridos
  }));

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
