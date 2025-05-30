
import { MonthlyGmvData, ServiceTypesData, DailyServiceData, TopClientsData, ServiceStatusData } from "@/hooks/useDashboardData";

// Tipos para los datos de servicios
export interface ServiceData {
  estado?: string | null;
  cobro_cliente?: number | string | null;
  nombre_cliente?: string | null;
  fecha_hora_cita?: string | Date | null;
  tipo_servicio?: string | null;
  km_recorridos?: number | string | null;
}

// Mapeo de estados de la base de datos a categorías principales
export const STATE_MAPPING: { [key: string]: string } = {
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

// Función para limpiar y validar el estado
export const cleanState = (estado: string | null | undefined): string => {
  if (!estado) return '';
  return String(estado).toLowerCase().trim();
};

// Función para limpiar y validar números
export const cleanNumericValue = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
};

// Función para limpiar texto
export const cleanTextValue = (value: string | null | undefined): string => {
  if (!value) return '';
  const cleaned = String(value).trim();
  return cleaned === '#N/A' ? '' : cleaned;
};

// Calcular métricas básicas
export const calculateBasicMetrics = (data: ServiceData[]) => {
  const totalServices = data.length;
  
  const totalGMV = data.reduce((sum, service) => {
    return sum + cleanNumericValue(service.cobro_cliente);
  }, 0);

  const uniqueClients = new Set(
    data
      .map(service => cleanTextValue(service.nombre_cliente))
      .filter(name => name !== '')
  );
  const activeClients = uniqueClients.size;

  const averageServiceValue = totalServices > 0 ? totalGMV / totalServices : 0;

  return {
    totalServices,
    totalGMV,
    activeClients,
    averageServiceValue
  };
};

// Calcular contadores por estado
export const calculateServiceCounts = (data: ServiceData[]) => {
  const serviceCounts = data.reduce((counts, service) => {
    const rawState = cleanState(service.estado);
    const mappedState = STATE_MAPPING[rawState] || 'Otros';
    counts[mappedState] = (counts[mappedState] || 0) + 1;
    return counts;
  }, {} as { [key: string]: number });

  return {
    completedServices: serviceCounts['Completado'] || 0,
    ongoingServices: serviceCounts['En Proceso'] || 0,
    pendingServices: serviceCounts['Pendiente'] || 0,
    cancelledServices: serviceCounts['Cancelado'] || 0,
    otherServices: serviceCounts['Otros'] || 0
  };
};

// Procesar datos de GMV mensual
export const processMonthlyGmv = (data: ServiceData[]): MonthlyGmvData[] => {
  if (!data || data.length === 0) {
    return getDefaultGmvData();
  }

  const monthlyTotals: { [key: string]: number } = {};
  
  data.forEach(item => {
    if (item.fecha_hora_cita && item.cobro_cliente) {
      try {
        const date = new Date(item.fecha_hora_cita);
        const month = date.getMonth();
        const monthKey = new Date(2025, month).toLocaleDateString('es-ES', { month: 'short' });
        const amount = cleanNumericValue(item.cobro_cliente);
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
};

// Procesar tipos de servicio
export const processServiceTypes = (data: ServiceData[]): ServiceTypesData[] => {
  if (!data || data.length === 0) {
    return getDefaultServiceTypes();
  }

  const typeCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    const type = cleanTextValue(item.tipo_servicio) || 'Sin especificar';
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
};

// Procesar datos diarios
export const processDailyData = (data: ServiceData[]): DailyServiceData[] => {
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
};

// Procesar top clientes
export const processTopClients = (data: ServiceData[]): TopClientsData[] => {
  if (!data || data.length === 0) {
    return getDefaultTopClients();
  }

  const clientCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    const client = cleanTextValue(item.nombre_cliente);
    if (client && client !== 'Sin especificar') {
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    }
  });
  
  const result = Object.entries(clientCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return result.length > 0 ? result : getDefaultTopClients();
};

// Procesar estado de servicios
export const processServiceStatus = (data: ServiceData[]): ServiceStatusData[] => {
  if (!data || data.length === 0) {
    return getDefaultServiceStatus();
  }

  const statusCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    const rawState = cleanState(item.estado);
    const mappedState = STATE_MAPPING[rawState] || 'Otros';
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
};

// Datos por defecto
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
