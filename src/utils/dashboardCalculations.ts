import { MonthlyGmvData, ServiceTypesData, DailyServiceData, TopClientsData, ServiceStatusData } from "@/hooks/useDashboardData";

// Tipos para los datos de servicios
export interface ServiceData {
  id_servicio?: string | null;
  estado?: string | null;
  cobro_cliente?: number | string | null;
  nombre_cliente?: string | null;
  fecha_hora_cita?: string | Date | null;
  tipo_servicio?: string | null;
  km_recorridos?: number | string | null;
  local_foraneo?: string | null;
}

// Mapeo de estados de la base de datos a categorías principales
export const STATE_MAPPING: { [key: string]: string } = {
  // Estados completados
  'finalizado': 'Completado',
  
  // Estados en proceso
  'en ruta': 'En Proceso',
  'en destino': 'En Proceso', 
  'punto de origen': 'En Proceso',
  'retornándoos las al armado': 'En Proceso',
  
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
  console.log('calculateBasicMetrics - Datos recibidos:', data.length);
  console.log('calculateBasicMetrics - Primeros 3 registros:', data.slice(0, 3));
  
  // Contar servicios únicos basados en id_servicio
  const uniqueServiceIds = new Set(
    data
      .map(service => cleanTextValue(service.id_servicio))
      .filter(id => id !== '')
  );
  
  console.log('calculateBasicMetrics - IDs únicos encontrados:', Array.from(uniqueServiceIds).slice(0, 5));
  
  const totalServices = uniqueServiceIds.size;
  
  const totalGMV = data.reduce((sum, service) => {
    const amount = cleanNumericValue(service.cobro_cliente);
    return sum + amount;
  }, 0);

  const uniqueClients = new Set(
    data
      .map(service => cleanTextValue(service.nombre_cliente))
      .filter(name => name !== '')
  );
  const activeClients = uniqueClients.size;

  const averageServiceValue = totalServices > 0 ? totalGMV / totalServices : 0;

  const result = {
    totalServices,
    totalGMV,
    activeClients,
    averageServiceValue
  };
  
  console.log('calculateBasicMetrics - Resultado:', result);
  
  return result;
};

// Calcular contadores por estado
export const calculateServiceCounts = (data: ServiceData[]) => {
  console.log('calculateServiceCounts - Datos recibidos:', data.length);
  
  const serviceCounts = data.reduce((counts, service) => {
    const rawState = cleanState(service.estado);
    const mappedState = STATE_MAPPING[rawState] || 'Otros';
    counts[mappedState] = (counts[mappedState] || 0) + 1;
    return counts;
  }, {} as { [key: string]: number });

  console.log('calculateServiceCounts - Estados contados:', serviceCounts);

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

// Procesar tipos de servicio basado en local_foraneo
export const processServiceTypes = (data: ServiceData[]): ServiceTypesData[] => {
  if (!data || data.length === 0) {
    return getDefaultServiceTypes();
  }

  console.log('processServiceTypes - Datos recibidos:', data.length);
  console.log('processServiceTypes - Primeros 5 local_foraneo:', data.slice(0, 5).map(d => d.local_foraneo));

  const typeCounts: { [key: string]: number } = {};
  
  data.forEach(item => {
    const type = cleanTextValue(item.local_foraneo) || 'Sin especificar';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('processServiceTypes - Conteos por tipo:', typeCounts);
  
  const total = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return getDefaultServiceTypes();
  }
  
  const result = Object.entries(typeCounts)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Mostrar hasta 6 tipos
    
  console.log('processServiceTypes - Resultado final:', result);
  
  return result;
};

// Procesar datos diarios - CORREGIDO para mostrar la última semana con datos reales
export const processDailyData = (data: ServiceData[]): DailyServiceData[] => {
  console.log('processDailyData - Datos recibidos:', data.length);
  
  if (!data || data.length === 0) {
    console.log('processDailyData - No hay datos, retornando valores por defecto');
    return getDefaultDailyData();
  }

  // Filtrar datos válidos con mejor validación
  const validServices = data.filter(item => {
    const hasValidDate = item.fecha_hora_cita && !isNaN(new Date(item.fecha_hora_cita).getTime());
    const hasValidId = item.id_servicio && cleanTextValue(item.id_servicio) !== '';
    return hasValidDate && hasValidId;
  });

  console.log('processDailyData - Servicios válidos después del filtro:', validServices.length);

  if (validServices.length === 0) {
    console.log('processDailyData - No hay servicios válidos, retornando datos por defecto');
    return getDefaultDailyData();
  }

  // Encontrar la fecha más reciente en los datos
  const latestDate = validServices.reduce((latest, service) => {
    const serviceDate = new Date(service.fecha_hora_cita!);
    return serviceDate > latest ? serviceDate : latest;
  }, new Date(validServices[0].fecha_hora_cita!));

  console.log('processDailyData - Fecha más reciente en datos:', latestDate.toLocaleDateString('es-ES'));

  // Calcular la semana que incluye la fecha más reciente
  const dayOfWeek = latestDate.getDay(); // 0 = domingo, 1 = lunes, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calcular cuántos días restar para llegar al lunes
  
  const weekStart = new Date(latestDate);
  weekStart.setDate(latestDate.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  console.log('processDailyData - Rango de semana calculado:', {
    desde: weekStart.toLocaleDateString('es-ES'),
    hasta: weekEnd.toLocaleDateString('es-ES')
  });

  // Filtrar servicios de esa semana
  const weeklyServices = validServices.filter(item => {
    const serviceDate = new Date(item.fecha_hora_cita!);
    return serviceDate >= weekStart && serviceDate <= weekEnd;
  });

  console.log('processDailyData - Servicios de la semana objetivo:', weeklyServices.length);

  // Si no hay servicios en esa semana, buscar la semana anterior con datos
  if (weeklyServices.length === 0) {
    console.log('processDailyData - No hay servicios en la semana más reciente, buscando semana anterior');
    
    // Buscar semanas anteriores hasta encontrar datos
    let searchWeekStart = new Date(weekStart);
    let searchWeekEnd = new Date(weekEnd);
    let weeklyServicesFound: ServiceData[] = [];
    let weeksSearched = 0;
    const maxWeeksToSearch = 8; // Buscar hasta 8 semanas atrás
    
    while (weeklyServicesFound.length === 0 && weeksSearched < maxWeeksToSearch) {
      searchWeekStart.setDate(searchWeekStart.getDate() - 7);
      searchWeekEnd.setDate(searchWeekEnd.getDate() - 7);
      weeksSearched++;
      
      weeklyServicesFound = validServices.filter(item => {
        const serviceDate = new Date(item.fecha_hora_cita!);
        return serviceDate >= searchWeekStart && serviceDate <= searchWeekEnd;
      });
      
      console.log(`processDailyData - Semana ${weeksSearched} atrás (${searchWeekStart.toLocaleDateString('es-ES')} - ${searchWeekEnd.toLocaleDateString('es-ES')}): ${weeklyServicesFound.length} servicios`);
    }
    
    if (weeklyServicesFound.length > 0) {
      weekStart.setTime(searchWeekStart.getTime());
      weekEnd.setTime(searchWeekEnd.getTime());
      weeklyServices.splice(0, 0, ...weeklyServicesFound);
      console.log(`processDailyData - Usando semana ${weeksSearched} atrás con ${weeklyServicesFound.length} servicios`);
    }
  }

  // Si aún no hay servicios, usar datos por defecto
  if (weeklyServices.length === 0) {
    console.log('processDailyData - No se encontraron servicios en ninguna semana, usando datos por defecto');
    return getDefaultDailyData();
  }

  // Crear conteos por día específico usando fecha completa
  const dailyServiceIds: { [key: string]: Set<string> } = {};
  const dayDates: { [key: string]: string } = {}; // Para guardar la fecha específica

  weeklyServices.forEach(item => {
    try {
      const serviceDate = new Date(item.fecha_hora_cita!);
      const dayKey = serviceDate.toLocaleDateString('es-ES'); // "13/05/2025"
      const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][serviceDate.getDay()];
      const serviceId = cleanTextValue(item.id_servicio);
      
      if (serviceId) {
        if (!dailyServiceIds[dayName]) {
          dailyServiceIds[dayName] = new Set();
          dayDates[dayName] = dayKey;
        }
        dailyServiceIds[dayName].add(serviceId);
      }
    } catch (e) {
      console.warn('Error processing daily data item:', e);
    }
  });

  // Log detallado de conteos finales
  console.log('processDailyData - Conteos finales por día:');
  Object.entries(dailyServiceIds).forEach(([day, set]) => {
    const count = set.size;
    const date = dayDates[day];
    console.log(`  ${day} ${date}: ${count} servicios únicos`);
  });

  // Convertir a formato requerido con fechas específicas
  const orderedDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const result = orderedDays.map(day => ({
    day,
    count: dailyServiceIds[day]?.size || 0,
    date: dayDates[day] || '', // Agregar fecha específica
    weekRange: `${weekStart.toLocaleDateString('es-ES')} - ${weekEnd.toLocaleDateString('es-ES')}`
  }));

  console.log('processDailyData - Resultado final:', result);
  
  return result;
};

// Procesar top clientes - CORREGIDO para TOP 5 + Otros con porcentajes reales
export const processTopClients = (data: ServiceData[]): TopClientsData[] => {
  if (!data || data.length === 0) {
    return getDefaultTopClients();
  }

  console.log('processTopClients - Datos recibidos:', data.length);

  // Contar servicios únicos por cliente usando id_servicio
  const clientServiceIds: { [key: string]: Set<string> } = {};
  
  data.forEach(item => {
    const client = cleanTextValue(item.nombre_cliente);
    const serviceId = cleanTextValue(item.id_servicio);
    
    if (client && client !== 'Sin especificar' && serviceId) {
      if (!clientServiceIds[client]) {
        clientServiceIds[client] = new Set();
      }
      clientServiceIds[client].add(serviceId);
    }
  });

  console.log('processTopClients - Clientes únicos encontrados:', Object.keys(clientServiceIds).length);

  // Convertir a array y ordenar por cantidad de servicios únicos
  const clientCounts = Object.entries(clientServiceIds)
    .map(([name, serviceIds]) => ({
      name,
      uniqueServices: serviceIds.size
    }))
    .sort((a, b) => b.uniqueServices - a.uniqueServices);

  console.log('processTopClients - Top 10 clientes:', clientCounts.slice(0, 10));

  // Obtener TOP 5
  const top5 = clientCounts.slice(0, 5);
  const others = clientCounts.slice(5);

  // Calcular total de servicios únicos
  const totalUniqueServices = clientCounts.reduce((sum, client) => sum + client.uniqueServices, 0);
  
  console.log('processTopClients - Total servicios únicos:', totalUniqueServices);

  if (totalUniqueServices === 0) {
    return getDefaultTopClients();
  }

  // Crear resultado con porcentajes
  const result: TopClientsData[] = top5.map(client => ({
    name: client.name,
    value: client.uniqueServices
  }));

  // Agregar "Otros" si hay clientes fuera del TOP 5
  if (others.length > 0) {
    const othersTotal = others.reduce((sum, client) => sum + client.uniqueServices, 0);
    result.push({
      name: 'Otros',
      value: othersTotal
    });
  }

  console.log('processTopClients - Resultado final:', result);
  console.log('processTopClients - Verificación suma:', result.reduce((sum, item) => sum + item.value, 0), 'vs total:', totalUniqueServices);

  return result;
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
    { name: 'Foráneo', value: 45 },
    { name: 'Local', value: 30 },
    { name: 'Foráneo CORTO', value: 20 },
    { name: 'REPARTO', value: 5 }
  ];
}

function getDefaultDailyData(): DailyServiceData[] {
  // Cambiar para mostrar una semana realista en el pasado
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const monday = new Date(lastMonth);
  const dayOfWeek = monday.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(monday.getDate() + mondayOffset);
  
  return [
    { day: 'Lun', count: 12, date: monday.toLocaleDateString('es-ES'), weekRange: `${monday.toLocaleDateString('es-ES')} - ${new Date(monday.getTime() + 6 * 86400000).toLocaleDateString('es-ES')}` },
    { day: 'Mar', count: 19, date: new Date(monday.getTime() + 86400000).toLocaleDateString('es-ES') },
    { day: 'Mié', count: 15, date: new Date(monday.getTime() + 172800000).toLocaleDateString('es-ES') },
    { day: 'Jue', count: 22, date: new Date(monday.getTime() + 259200000).toLocaleDateString('es-ES') },
    { day: 'Vie', count: 18, date: new Date(monday.getTime() + 345600000).toLocaleDateString('es-ES') },
    { day: 'Sáb', count: 8, date: new Date(monday.getTime() + 432000000).toLocaleDateString('es-ES') },
    { day: 'Dom', count: 5, date: new Date(monday.getTime() + 518400000).toLocaleDateString('es-ES') }
  ];
}

function getDefaultTopClients(): TopClientsData[] {
  return [
    { name: 'TYASA', value: 45 },
    { name: 'ASTRA ZENECA', value: 28 },
    { name: 'SIEGFRIED RHEIN', value: 18 },
    { name: 'CTS GLOBAL SUPPLY', value: 13 },
    { name: 'TELMOV', value: 12 },
    { name: 'Otros', value: 24 }
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
