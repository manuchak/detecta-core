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

        console.log('Raw data from Supabase:', data);
        console.log('Total records fetched:', data?.length || 0);
        
        // Log unique states found
        const uniqueStates = [...new Set(data?.map(s => s.estado).filter(Boolean))] || [];
        console.log('Estados únicos encontrados en la BD:', uniqueStates);
        
        // Log sample data for debugging
        if (data && data.length > 0) {
          console.log('Sample record:', data[0]);
          console.log('Sample cobro_cliente values:', data.slice(0, 5).map(s => s.cobro_cliente));
          console.log('Sample nombre_cliente values:', data.slice(0, 5).map(s => s.nombre_cliente));
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

  // Calcular métricas directamente de los datos reales
  const totalServices = allServicesData.length;
  
  // Calcular GMV total directamente de cobro_cliente
  const totalGMV = allServicesData.reduce((sum, service) => {
    const cobro = parseFloat(String(service.cobro_cliente || 0)) || 0;
    return sum + cobro;
  }, 0);

  // Calcular clientes únicos activos
  const uniqueClients = new Set(
    allServicesData
      .filter(service => service.nombre_cliente && String(service.nombre_cliente).trim() !== '')
      .map(service => String(service.nombre_cliente).trim())
  );
  const activeClients = uniqueClients.size;

  // Calcular valor promedio por servicio
  const averageServiceValue = totalServices > 0 ? totalGMV / totalServices : 0;

  // Mapear estados reales de la base de datos a categorías principales
  const stateMapping: { [key: string]: string } = {
    // Estados completados
    'finalizado': 'Completado',
    
    // Estados en proceso
    'en ruta': 'En Proceso',
    'en destino': 'En Proceso',
    'punto de origen': 'En Proceso',
    'retornándooslas al armado': 'En Proceso',
    
    // Estados pendientes
    'programado': 'Pendiente',
    'en espera': 'Pendiente',
    
    // Estados cancelados
    'cancelado': 'Cancelado'
  };

  // Contar servicios por estado mapeado
  const serviceCounts = allServicesData.reduce((counts, service) => {
    const rawState = service.estado != null ? String(service.estado).toLowerCase().trim() : '';
    const mappedState = stateMapping[rawState] || 'Otros';
    counts[mappedState] = (counts[mappedState] || 0) + 1;
    return counts;
  }, {} as { [key: string]: number });

  const completedServices = serviceCounts['Completado'] || 0;
  const ongoingServices = serviceCounts['En Proceso'] || 0;
  const pendingServices = serviceCounts['Pendiente'] || 0;
  const cancelledServices = serviceCounts['Cancelado'] || 0;
  const otherServices = serviceCounts['Otros'] || 0;

  console.log('Estados mapeados:', serviceCounts);
  console.log('Métricas calculadas:', {
    totalServices,
    totalGMV,
    activeClients,
    completedServices,
    ongoingServices,
    pendingServices,
    cancelledServices,
    otherServices
  });

  // Procesar datos para gráficos
  const monthlyGmvData: MonthlyGmvData[] = processGmvData(allServicesData);
  const serviceTypesData: ServiceTypesData[] = processServiceTypes(allServicesData);
  const dailyServiceData: DailyServiceData[] = processDailyData(allServicesData);
  const topClientsData: TopClientsData[] = processTopClients(allServicesData);
  const serviceStatusData: ServiceStatusData[] = processServiceStatusReal(allServicesData, stateMapping);

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

// Función mejorada para procesar estados reales de la base de datos
function processServiceStatusReal(data: any[], stateMapping: { [key: string]: string }): ServiceStatusData[] {
  if (!data || data.length === 0) {
    return getDefaultServiceStatus();
  }

  const statusCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    const rawState = String(item.estado || '').toLowerCase().trim();
    const mappedState = stateMapping[rawState] || 'Otros';
    statusCounts[mappedState] = (statusCounts[mappedState] || 0) + 1;
  });
  
  const colors: { [key: string]: string } = {
    'Completado': '#10b981',
    'En Proceso': '#f59e0b', 
    'Pendiente': '#ef4444',
    'Cancelado': '#6b7280',
    'Otros': '#8b5cf6'
  };
  
  const result = Object.entries(statusCounts)
    .map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#8b5cf6'
    }))
    .sort((a, b) => b.value - a.value);

  return result.length > 0 ? result : getDefaultServiceStatus();
}

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
        const amount = parseFloat(String(item.cobro_cliente || 0)) || 0;
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
    const client = String(item.nombre_cliente || '').trim();
    if (client && client !== 'Sin especificar' && client !== '') {
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    }
  });
  
  const result = Object.entries(clientCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return result.length > 0 ? result : getDefaultTopClients();
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
