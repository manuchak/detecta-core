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
  // Query para obtener servicios con verificación simple de permisos
  const { data: allServicesData = [], isLoading, error } = useQuery({
    queryKey: ['dashboard-services', timeframe, serviceTypeFilter],
    queryFn: async () => {
      try {
        console.log("Fetching dashboard data...");
        
        // Verificación simple de usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn('User not authenticated');
          return [];
        }
        
        console.log("User authenticated, fetching services...");
        
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
        
        console.log(`Fetching data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
        
        // Construir consulta base
        let query = supabase
          .from('servicios_custodia')
          .select('*')
          .gte('fecha_hora_cita', startDate.toISOString())
          .lte('fecha_hora_cita', endDate.toISOString())
          .order('fecha_hora_cita', { ascending: false });

        // Aplicar filtro de tipo de servicio usando el nombre correcto de la columna
        if (serviceTypeFilter !== 'all') {
          const filterValue = serviceTypeFilter === 'local' ? 'Local' : 'Foráneo';
          query = query.eq('local_foraneo', filterValue);
          console.log(`Applying service type filter: ${filterValue}`);
        }

        // Ejecutar consulta sin límite para obtener todos los registros
        const { data, error } = await query;

        if (error) {
          console.error('Error fetching dashboard data:', error);
          throw error;
        }

        console.log('Dashboard data fetched successfully:', data?.length || 0);
        console.log(`Timeframe: ${timeframe}, Service filter: ${serviceTypeFilter}`);
        
        // Log sample data for debugging
        if (data && data.length > 0) {
          console.log('Sample record:', data[0]);
          console.log('Date range in results:', {
            first: data[data.length - 1]?.fecha_hora_cita,
            last: data[0]?.fecha_hora_cita
          });
          console.log('Sample local_foraneo values:', data.slice(0, 5).map(d => d.local_foraneo));
        }
        
        return data || [];
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
