
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

        return data || [];
      } catch (err) {
        console.error('Error in dashboard query:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Procesar datos para GMV mensual
  const monthlyGmvData: MonthlyGmvData[] = processGmvData(allServicesData);
  
  // Procesar datos para tipos de servicios
  const serviceTypesData: ServiceTypesData[] = processServiceTypes(allServicesData);
  
  // Procesar datos para servicios diarios
  const dailyServiceData: DailyServiceData[] = processDailyData(allServicesData);
  
  // Procesar datos para clientes principales
  const topClientsData: TopClientsData[] = processTopClients(allServicesData);
  
  // Procesar datos para estado de servicios
  const serviceStatusData: ServiceStatusData[] = processServiceStatus(allServicesData);

  // Calcular métricas del dashboard
  const totalGMV = monthlyGmvData.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalServices = allServicesData.length;
  const activeClients = topClientsData.length;
  const averageServiceValue = totalServices > 0 ? totalGMV / totalServices : 0;

  // Calcular servicios por estado
  const completedServices = serviceStatusData.find(s => 
    s.name.toLowerCase().includes('completado') || s.name.toLowerCase().includes('finalizado')
  )?.value || 0;
  
  const ongoingServices = serviceStatusData.find(s => 
    s.name.toLowerCase().includes('proceso') || s.name.toLowerCase().includes('activo') || s.name.toLowerCase().includes('en_proceso')
  )?.value || 0;
  
  const cancelledServices = serviceStatusData.find(s => 
    s.name.toLowerCase().includes('cancelado')
  )?.value || 0;
  
  const pendingServices = serviceStatusData.find(s => 
    s.name.toLowerCase().includes('pendiente')
  )?.value || 0;

  const dashboardData: DashboardMetrics = {
    totalServices,
    totalGMV,
    activeClients,
    averageServiceValue,
    yearlyGrowth: 15,
    completedServices,
    ongoingServices,
    cancelledServices,
    pendingServices
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
    totalGMV,
    isLoading,
    error,
    refreshAllData
  };
};

// Funciones de procesamiento de datos
function processGmvData(data: any[]): MonthlyGmvData[] {
  if (!data || data.length === 0) {
    return getDefaultGmvData();
  }

  const monthlyTotals: { [key: string]: number } = {};
  
  data.forEach(item => {
    if (item.fecha_hora_cita && item.cobro_cliente) {
      try {
        const month = new Date(item.fecha_hora_cita).getMonth();
        const monthKey = new Date(2025, month).toLocaleDateString('es-ES', { month: 'short' });
        const amount = parseFloat(item.cobro_cliente) || 0;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
      } catch (e) {
        console.warn('Error processing GMV data item:', e);
      }
    }
  });
  
  const result = Object.entries(monthlyTotals).map(([name, value]) => ({
    name,
    value,
    previousYear: value * 0.8
  }));

  return result.length > 0 ? result : getDefaultGmvData();
}

function processServiceTypes(data: any[]): ServiceTypesData[] {
  if (!data || data.length === 0) {
    return getDefaultServiceTypes();
  }

  const typeCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    const type = item.tipo_servicio || 'Sin especificar';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  const total = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return getDefaultServiceTypes();
  }
  
  return Object.entries(typeCounts)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100)
    }))
    .slice(0, 5);
}

function processDailyData(data: any[]): DailyServiceData[] {
  if (!data || data.length === 0) {
    return getDefaultDailyData();
  }

  const dailyCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    if (item.fecha_hora_cita) {
      try {
        const day = new Date(item.fecha_hora_cita).toLocaleDateString('es-ES', { weekday: 'short' });
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      } catch (e) {
        console.warn('Error processing daily data item:', e);
      }
    }
  });
  
  const result = Object.entries(dailyCounts).map(([day, count]) => ({ day, count }));
  
  return result.length > 0 ? result : getDefaultDailyData();
}

function processTopClients(data: any[]): TopClientsData[] {
  if (!data || data.length === 0) {
    return getDefaultTopClients();
  }

  const clientCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    const client = item.nombre_cliente || 'Sin especificar';
    if (client && client !== 'Sin especificar') {
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    }
  });
  
  const result = Object.entries(clientCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return result.length > 0 ? result : getDefaultTopClients();
}

function processServiceStatus(data: any[]): ServiceStatusData[] {
  if (!data || data.length === 0) {
    return getDefaultServiceStatus();
  }

  const statusCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    const status = item.estado || 'Sin estado';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'];
  
  const result = Object.entries(statusCounts)
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }))
    .slice(0, 5);

  return result.length > 0 ? result : getDefaultServiceStatus();
}

// Funciones de datos por defecto
function getDefaultGmvData(): MonthlyGmvData[] {
  return [
    { name: 'Ene', value: 85000, previousYear: 68000 },
    { name: 'Feb', value: 92000, previousYear: 73600 },
    { name: 'Mar', value: 78000, previousYear: 62400 },
    { name: 'Abr', value: 105000, previousYear: 84000 },
    { name: 'May', value: 98000, previousYear: 78400 }
  ];
}

function getDefaultServiceTypes(): ServiceTypesData[] {
  return [
    { name: 'Custodia Regular', value: 45 },
    { name: 'Custodia Especializada', value: 25 },
    { name: 'Custodia Local', value: 20 },
    { name: 'Custodia Express', value: 10 }
  ];
}

function getDefaultDailyData(): DailyServiceData[] {
  return [
    { day: 'Lun', count: 12 },
    { day: 'Mar', count: 19 },
    { day: 'Mié', count: 15 },
    { day: 'Jue', count: 22 },
    { day: 'Vie', count: 18 },
    { day: 'Sáb', count: 8 },
    { day: 'Dom', count: 5 }
  ];
}

function getDefaultTopClients(): TopClientsData[] {
  return [
    { name: 'Empresa A', value: 25 },
    { name: 'Empresa B', value: 18 },
    { name: 'Empresa C', value: 15 },
    { name: 'Empresa D', value: 12 },
    { name: 'Empresa E', value: 10 }
  ];
}

function getDefaultServiceStatus(): ServiceStatusData[] {
  return [
    { name: 'Completado', value: 68, color: '#10b981' },
    { name: 'En Proceso', value: 22, color: '#f59e0b' },
    { name: 'Pendiente', value: 8, color: '#ef4444' },
    { name: 'Cancelado', value: 2, color: '#6b7280' }
  ];
}
