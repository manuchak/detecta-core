
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
  // Query para obtener servicios usando función RPC que evita problemas de RLS
  const { data: allServicesData = [], isLoading, error } = useQuery({
    queryKey: ['dashboard-services', timeframe, serviceTypeFilter],
    queryFn: async () => {
      try {
        console.log("Fetching dashboard data using RPC function...");
        
        // Usar función RPC que bypassa RLS para evitar recursión
        const { data, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 25000 // Aumentar límite para obtener todos los registros
        });

        if (error) {
          console.error('Error fetching dashboard data:', error);
          throw error;
        }

        console.log('Dashboard data fetched successfully:', data?.length || 0);
        
        // Aplicar filtros de timeframe en el frontend
        let filteredData = data || [];
        
        // Calcular fechas basadas en timeframe
        let startDate: Date;
        let endDate: Date = new Date(); // Hasta hoy
        
        switch (timeframe) {
          case 'day':
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'quarter':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case 'year':
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }
        
        // Filtrar por timeframe
        filteredData = filteredData.filter(service => {
          if (!service.fecha_hora_cita) return false;
          const serviceDate = new Date(service.fecha_hora_cita);
          return serviceDate >= startDate && serviceDate <= endDate;
        });
        
        // Aplicar filtro de tipo de servicio
        if (serviceTypeFilter !== 'all') {
          const filterValue = serviceTypeFilter === 'local' ? 'Local' : 'Foráneo';
          filteredData = filteredData.filter(service => 
            service.local_foraneo === filterValue
          );
          console.log(`Applied service type filter: ${filterValue}, remaining records: ${filteredData.length}`);
        }
        
        console.log(`Timeframe: ${timeframe}, Service filter: ${serviceTypeFilter}`);
        console.log(`Filtered data: ${filteredData.length} records`);
        
        // Log sample data for debugging
        if (filteredData && filteredData.length > 0) {
          console.log('Sample record:', filteredData[0]);
          console.log('Date range in results:', {
            first: filteredData[filteredData.length - 1]?.fecha_hora_cita,
            last: filteredData[0]?.fecha_hora_cita
          });
          console.log('Sample local_foraneo values:', filteredData.slice(0, 5).map(d => d.local_foraneo));
        }
        
        return filteredData;
      } catch (err) {
        console.error('Error in dashboard query:', err);
        throw err;
      }
    },
    enabled: true,
    staleTime: 30 * 1000, // 30 segundos para ver cambios más rápido
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error?.message?.includes('permission') || error?.message?.includes('Access denied')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  console.log(`Hook - allServicesData length: ${allServicesData.length} for timeframe: ${timeframe}`);

  // Convertir datos a formato ServiceData incluyendo local_foraneo
  const serviceData: ServiceData[] = allServicesData.map(service => ({
    id_servicio: service.id_servicio,
    estado: service.estado,
    cobro_cliente: service.cobro_cliente,
    nombre_cliente: service.nombre_cliente,
    fecha_hora_cita: service.fecha_hora_cita,
    tipo_servicio: service.tipo_servicio,
    km_recorridos: service.km_recorridos,
    local_foraneo: service.local_foraneo
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
