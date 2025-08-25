import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { processDailyData } from '@/utils/dashboardCalculations';

export interface DashboardMetrics {
  totalServices: number;
  totalGMV: number;
  activeClients: number;
  averageServiceValue: number;
  completedServices: number;
  ongoingServices: number;
  pendingServices: number;
  cancelledServices: number;
  yearlyGrowth: number;
  // Nuevos campos para comparativos corregidos
  totalServicesGrowth: number;
  totalGMVGrowth: number;
  activeClientsGrowth: number;
  averageServiceValueGrowth: number;
  completedServicesPercentage: number;
  ongoingServicesPercentage: number;
  pendingServicesPercentage: number;
  cancelledServicesPercentage: number;
}

export interface ServiceStatusData {
  name: string;
  value: number;
  color: string;
}

export interface ServiceTypesData {
  name: string;
  value: number;
}

export interface DailyServiceData {
  day: string;
  count: number;
  previousWeekCount?: number;
  date: string;
  weekRange: string;
}

export interface TopClientsData {
  name: string;
  value: number;
}

export type TimeframeOption = "day" | "week" | "month" | "quarter" | "year" | "custom" | "thisMonth" | "thisQuarter" | "lastMonth" | "lastQuarter" | "last7Days" | "last30Days" | "last90Days" | "yearToDate" | "monthToDate";
export type ServiceTypeOption = "all" | "local" | "foraneo";

// Función mejorada para calcular rangos de fechas - ESPECIALMENTE PARA MES HASTA LA FECHA
const getDateRange = (timeframe: TimeframeOption) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case "day":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate.setDate(now.getDate() + mondayOffset);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "thisMonth":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthToDate":
      // MES HASTA LA FECHA: Desde el 1ro del mes actual hasta HOY
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      console.log(`📅 MONTH TO DATE: ${startDate.toLocaleDateString()} hasta ${now.toLocaleDateString()}`);
      break;
    case "lastMonth":
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: lastMonth, endDate: lastMonthEnd };
    case "thisQuarter":
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate.setMonth(currentQuarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "lastQuarter":
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const quarterStart = new Date(now.getFullYear(), lastQuarter * 3, 1);
      const quarterEnd = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0);
      if (lastQuarter < 0) {
        quarterStart.setFullYear(now.getFullYear() - 1, 9, 1);
        quarterEnd.setFullYear(now.getFullYear() - 1, 11, 31);
      }
      return { startDate: quarterStart, endDate: quarterEnd };
    case "last7Days":
      startDate.setDate(now.getDate() - 7);
      break;
    case "last30Days":
      startDate.setDate(now.getDate() - 30);
      break;
    case "last90Days":
      startDate.setDate(now.getDate() - 90);
      break;
    case "yearToDate":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }
  
  return { startDate, endDate: now };
};

// Función mejorada para calcular el período anterior para comparación más precisa - ESPECIALMENTE PARA MES HASTA LA FECHA
const getPreviousDateRange = (timeframe: TimeframeOption) => {
  const { startDate, endDate } = getDateRange(timeframe);
  const duration = endDate.getTime() - startDate.getTime();
  
  let prevEndDate = new Date(startDate.getTime());
  let prevStartDate = new Date(startDate.getTime() - duration);
  
  // Ajustes específicos por tipo de período para comparaciones más lógicas
  switch (timeframe) {
    case "monthToDate":
      // Para MES HASTA LA FECHA: comparar con el mismo período del mes anterior
      const currentDay = endDate.getDate();
      const currentMonth = endDate.getMonth();
      const currentYear = endDate.getFullYear();
      
      // Período anterior: desde el 1ro del mes anterior hasta el mismo día del mes anterior
      prevStartDate = new Date(currentYear, currentMonth - 1, 1);
      prevEndDate = new Date(currentYear, currentMonth - 1, currentDay);
      
      // Si estamos en enero, ir al año anterior
      if (currentMonth === 0) {
        prevStartDate = new Date(currentYear - 1, 11, 1);
        prevEndDate = new Date(currentYear - 1, 11, currentDay);
      }
      
      console.log(`📅 MONTH TO DATE COMPARISON: ${prevStartDate.toLocaleDateString()} hasta ${prevEndDate.toLocaleDateString()}`);
      break;
    case "thisMonth":
      // Comparar con el mes anterior completo
      prevStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
      prevEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
      break;
    case "thisQuarter":
      // Comparar con el trimestre anterior completo
      const currentQuarter = Math.floor(startDate.getMonth() / 3);
      const prevQuarter = currentQuarter - 1;
      if (prevQuarter >= 0) {
        prevStartDate = new Date(startDate.getFullYear(), prevQuarter * 3, 1);
        prevEndDate = new Date(startDate.getFullYear(), (prevQuarter + 1) * 3, 0);
      } else {
        prevStartDate = new Date(startDate.getFullYear() - 1, 9, 1);
        prevEndDate = new Date(startDate.getFullYear() - 1, 11, 31);
      }
      break;
    case "yearToDate":
      // Comparar con el mismo período del año anterior
      prevStartDate = new Date(startDate.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
      break;
  }
  
  return { startDate: prevStartDate, endDate: prevEndDate };
};

export const useDashboardDataCorrected = (
  timeframe: TimeframeOption = "monthToDate",
  serviceTypeFilter: ServiceTypeOption = "all"
) => {
  
  // Query para obtener todos los servicios
  const { data: allServices, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-services-corrected', timeframe, serviceTypeFilter],
    queryFn: async () => {
      console.log('=== DASHBOARD DATA CORRECTED: OBTENIENDO DATOS ===');
      
      try {
        const { data: serviceData, error } = await supabase
          .rpc('bypass_rls_get_servicios', { max_records: 50000 });

        if (error) {
          console.error('Error al obtener servicios:', error);
          throw error;
        }

        console.log(`📊 Total de registros dashboard: ${serviceData?.length || 0}`);
        return serviceData || [];
      } catch (error) {
        console.error('Error en consulta dashboard:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
  
  const dashboardData = useMemo(() => {
    if (isLoading || error || !allServices) {
      return {
        totalServices: 0,
        totalGMV: 0,
        activeClients: 0,
        averageServiceValue: 0,
        completedServices: 0,
        ongoingServices: 0,
        pendingServices: 0,
        cancelledServices: 0,
        yearlyGrowth: 0,
        totalServicesGrowth: 0,
        totalGMVGrowth: 0,
        activeClientsGrowth: 0,
        averageServiceValueGrowth: 0,
        completedServicesPercentage: 0,
        ongoingServicesPercentage: 0,
        pendingServicesPercentage: 0,
        cancelledServicesPercentage: 0
      };
    }

    console.log(`📈 DASHBOARD: Aplicando filtro temporal - ${timeframe}`);
    
    // PASO 1: Calcular rangos de fechas
    const { startDate, endDate } = getDateRange(timeframe);
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousDateRange(timeframe);
    
    console.log(`📅 Dashboard - Período actual: ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()}`);
    console.log(`📅 Dashboard - Período anterior: ${prevStartDate.toLocaleDateString()} a ${prevEndDate.toLocaleDateString()}`);
    
    // PASO 2: Filtrar servicios por períodos
    const serviciosEnRango = allServices.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      return serviceDate >= startDate && serviceDate <= endDate;
    });

    const serviciosRangoAnterior = allServices.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      return serviceDate >= prevStartDate && serviceDate <= prevEndDate;
    });
    
    console.log(`📅 Dashboard - Servicios período actual: ${serviciosEnRango.length}`);
    console.log(`📅 Dashboard - Servicios período anterior: ${serviciosRangoAnterior.length}`);

    // Función para procesar servicios con filtros
    const procesarServicios = (servicios: any[]) => {
      let serviciosFiltrados = servicios;
      
      // Aplicar filtro de tipo de servicio si no es "all"
      if (serviceTypeFilter !== "all") {
        serviciosFiltrados = servicios.filter(service => {
          const tipoServicio = (service.local_foraneo || service.tipo_servicio || '').toLowerCase();
          return tipoServicio.includes(serviceTypeFilter.toLowerCase());
        });
      }

      // Análisis de GMV Corregido - todos los estados excepto cancelado con cobro válido
      const serviciosValidosParaGMV = serviciosFiltrados.filter(service => {
        const estado = (service.estado || '').trim().toLowerCase();
        const cobro = Number(service.cobro_cliente);
        
        // Excluir solo servicios cancelados
        const esCancelado = estado.includes('cancelado') || estado.includes('canceled');
        
        return !esCancelado && !isNaN(cobro) && cobro > 0;
      });

      // Calcular GMV de todos los servicios válidos únicos (excepto cancelados)
      let totalGmvCalculated = 0;
      const uniqueServiceIds = new Set();

      serviciosValidosParaGMV.forEach(service => {
        if (service.id_servicio && !uniqueServiceIds.has(service.id_servicio)) {
          uniqueServiceIds.add(service.id_servicio);
          const cobroCliente = Number(service.cobro_cliente) || 0;
          totalGmvCalculated += cobroCliente;
        }
      });

      // Log para debugging del nuevo cálculo de GMV
      console.log(`💰 GMV METODOLOGÍA ACTUALIZADA:`);
      console.log(`   - Servicios válidos para GMV (sin cancelados): ${serviciosValidosParaGMV.length}`);
      console.log(`   - Servicios únicos para GMV: ${uniqueServiceIds.size}`);
      console.log(`   - GMV Total Calculado: $${totalGmvCalculated.toLocaleString()}`);

      // Análizar estados para métricas
      const serviciosFinalizados = serviciosFiltrados.filter(service => {
        const estado = (service.estado || '').trim().toLowerCase();
        return estado === 'finalizado';
      });

      const serviciosCancelados = serviciosFiltrados.filter(service => {
        const estado = (service.estado || '').toLowerCase().trim();
        return estado.includes('cancelado');
      });

      const serviciosEnCurso = serviciosFiltrados.filter(service => {
        const estado = (service.estado || '').toLowerCase().trim();
        return estado.includes('ruta') || estado.includes('destino') || estado.includes('origen');
      });

      const serviciosPendientes = serviciosFiltrados.filter(service => {
        const estado = (service.estado || '').toLowerCase().trim();
        return estado.includes('pendiente') || estado.includes('programado') || estado.includes('espera');
      });

      // Servicios únicos finalizados
      const finishedServiceIds = new Set();
      serviciosFinalizados.forEach(service => {
        if (service.id_servicio) {
          finishedServiceIds.add(service.id_servicio);
        }
      });

      // Clientes únicos (solo de servicios finalizados)
      const clientesUnicos = new Set(
        serviciosFinalizados
          .filter(s => s.nombre_cliente && s.nombre_cliente.trim() !== '' && s.nombre_cliente !== '#N/A')
          .map(s => s.nombre_cliente.trim().toUpperCase())
      ).size;

      // Valor promedio basado solo en servicios finalizados con cobro
      const valorPromedio = uniqueServiceIds.size > 0 ? totalGmvCalculated / uniqueServiceIds.size : 0;

      return {
        totalServices: serviciosFiltrados.length,
        totalGMV: totalGmvCalculated,
        activeClients: clientesUnicos,
        averageServiceValue: valorPromedio,
        completedServices: finishedServiceIds.size,
        ongoingServices: serviciosEnCurso.length,
        pendingServices: serviciosPendientes.length,
        cancelledServices: serviciosCancelados.length
      };
    };

    // Procesar ambos períodos
    const currentPeriod = procesarServicios(serviciosEnRango);
    const previousPeriod = procesarServicios(serviciosRangoAnterior);

    // Calcular crecimientos más precisos con manejo de casos especiales
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      const growth = ((current - previous) / previous) * 100;
      // Limitar a valores razonables para evitar porcentajes extremos
      return Math.max(-100, Math.min(1000, Math.round(growth)));
    };

    const calculatePercentage = (value: number, total: number) => {
      if (total === 0) return 0;
      return Math.round((value / total) * 100);
    };

    const result = {
      ...currentPeriod,
      yearlyGrowth: 15, // Placeholder para crecimiento anual
      totalServicesGrowth: calculateGrowth(currentPeriod.totalServices, previousPeriod.totalServices),
      totalGMVGrowth: calculateGrowth(currentPeriod.totalGMV, previousPeriod.totalGMV),
      activeClientsGrowth: calculateGrowth(currentPeriod.activeClients, previousPeriod.activeClients),
      averageServiceValueGrowth: calculateGrowth(currentPeriod.averageServiceValue, previousPeriod.averageServiceValue),
      completedServicesPercentage: calculatePercentage(currentPeriod.completedServices, currentPeriod.totalServices),
      ongoingServicesPercentage: calculatePercentage(currentPeriod.ongoingServices, currentPeriod.totalServices),
      pendingServicesPercentage: calculatePercentage(currentPeriod.pendingServices, currentPeriod.totalServices),
      cancelledServicesPercentage: calculatePercentage(currentPeriod.cancelledServices, currentPeriod.totalServices)
    };

    console.log(`🎯 DASHBOARD RESULT CORREGIDO para ${timeframe}:`, result);
    console.log(`📊 Crecimientos calculados:`);
    console.log(`   - Servicios: ${result.totalServicesGrowth}% (${currentPeriod.totalServices} vs ${previousPeriod.totalServices})`);
    console.log(`   - GMV: ${result.totalGMVGrowth}% ($${currentPeriod.totalGMV.toLocaleString()} vs $${previousPeriod.totalGMV.toLocaleString()})`);
    console.log(`   - Clientes: ${result.activeClientsGrowth}% (${currentPeriod.activeClients} vs ${previousPeriod.activeClients})`);
    console.log(`   - Valor promedio: ${result.averageServiceValueGrowth}% ($${currentPeriod.averageServiceValue.toFixed(0)} vs $${previousPeriod.averageServiceValue.toFixed(0)})`);
    
    return result;
  }, [allServices, isLoading, error, timeframe, serviceTypeFilter]);

  // Nuevos datos para gráficos secundarios
  const secondaryData = useMemo(() => {
    if (isLoading || error || !allServices) {
      return {
        serviceStatusData: [],
        serviceTypesData: [],
        dailyServiceData: [],
        topClientsData: []
      };
    }

    console.log('🔄 Generando datos para gráficos secundarios...');
    
    // Filtrar servicios por período actual
    const { startDate, endDate } = getDateRange(timeframe);
    const serviciosEnRango = allServices.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      return serviceDate >= startDate && serviceDate <= endDate;
    });

    // Aplicar filtro de tipo de servicio
    let serviciosFiltrados = serviciosEnRango;
    if (serviceTypeFilter !== "all") {
      serviciosFiltrados = serviciosEnRango.filter(service => {
        const tipoServicio = (service.local_foraneo || service.tipo_servicio || '').toLowerCase();
        return tipoServicio.includes(serviceTypeFilter.toLowerCase());
      });
    }

    console.log(`📊 Servicios filtrados para gráficos: ${serviciosFiltrados.length}`);

    // 1. SERVICE STATUS DATA
    const statusCounts = {
      'Finalizado': 0,
      'En Curso': 0,
      'Pendiente': 0,
      'Cancelado': 0
    };

    serviciosFiltrados.forEach(service => {
      const estado = (service.estado || '').toLowerCase().trim();
      
      if (estado === 'finalizado') {
        statusCounts['Finalizado']++;
      } else if (estado.includes('ruta') || estado.includes('destino') || estado.includes('origen')) {
        statusCounts['En Curso']++;
      } else if (estado.includes('pendiente') || estado.includes('programado') || estado.includes('espera')) {
        statusCounts['Pendiente']++;
      } else if (estado.includes('cancelado')) {
        statusCounts['Cancelado']++;
      }
    });

    const serviceStatusData: ServiceStatusData[] = [
      { name: 'Finalizado', value: statusCounts['Finalizado'], color: '#10b981' },
      { name: 'En Curso', value: statusCounts['En Curso'], color: '#3b82f6' },
      { name: 'Pendiente', value: statusCounts['Pendiente'], color: '#f59e0b' },
      { name: 'Cancelado', value: statusCounts['Cancelado'], color: '#ef4444' }
    ];

    // 2. SERVICE TYPES DATA
    const typeCounts = new Map<string, number>();
    serviciosFiltrados.forEach(service => {
      const tipo = service.local_foraneo || service.tipo_servicio || 'Sin especificar';
      typeCounts.set(tipo, (typeCounts.get(tipo) || 0) + 1);
    });

    const total = serviciosFiltrados.length;
    const serviceTypesData: ServiceTypesData[] = Array.from(typeCounts.entries())
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 3. DAILY SERVICE DATA - usando función importada
    const dailyServiceData = processDailyData(allServices);

    // 4. TOP CLIENTS DATA
    const clientCounts = new Map<string, number>();
    serviciosFiltrados.forEach(service => {
      if (!service.nombre_cliente || service.nombre_cliente.trim() === '' || service.nombre_cliente === '#N/A') return;
      
      const cliente = service.nombre_cliente.trim().toUpperCase();
      clientCounts.set(cliente, (clientCounts.get(cliente) || 0) + 1);
    });

    const topClients = Array.from(clientCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topClientsTotal = topClients.reduce((sum, [, count]) => sum + count, 0);
    const othersCount = serviciosFiltrados.length - topClientsTotal;

    const topClientsData: TopClientsData[] = [
      ...topClients.map(([name, value]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        value
      })),
      ...(othersCount > 0 ? [{ name: 'Otros', value: othersCount }] : [])
    ];

    console.log('📊 Datos secundarios generados:');
    console.log('  - Estados:', serviceStatusData.map(s => `${s.name}: ${s.value}`));
    console.log('  - Tipos:', serviceTypesData.map(s => `${s.name}: ${s.value}%`));
    console.log('  - Diarios:', dailyServiceData.map(s => `${s.day}: ${s.count}`));
    console.log('  - Clientes:', topClientsData.map(s => `${s.name}: ${s.value}`));

    return {
      serviceStatusData,
      serviceTypesData,
      dailyServiceData,
      topClientsData
    };
  }, [allServices, isLoading, error, timeframe, serviceTypeFilter]);

  return {
    isLoading,
    error,
    dashboardData,
    refreshAllData: refetch,
    serviceStatusData: secondaryData.serviceStatusData, // Placeholder - mantener funcionalidad existente
    serviceTypesData: secondaryData.serviceTypesData,
    dailyServiceData: secondaryData.dailyServiceData,
    topClientsData: secondaryData.topClientsData
  };
};
