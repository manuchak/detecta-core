
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  // Nuevos campos para comparativos
  totalServicesGrowth: number;
  totalGMVGrowth: number;
  activeClientsGrowth: number;
  averageServiceValueGrowth: number;
  completedServicesPercentage: number;
  ongoingServicesPercentage: number;
  pendingServicesPercentage: number;
  cancelledServicesPercentage: number;
}

export type TimeframeOption = "day" | "week" | "month" | "quarter" | "year" | "custom" | "thisMonth" | "thisQuarter";
export type ServiceTypeOption = "all" | "local" | "foraneo";

// Función para calcular el rango de fechas basado en el timeframe
const getDateRange = (timeframe: TimeframeOption) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case "day":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setDate(now.getDate() - 30);
      break;
    case "thisMonth":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "quarter":
      startDate.setDate(now.getDate() - 90);
      break;
    case "thisQuarter":
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate.setMonth(currentQuarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "custom":
      startDate.setDate(now.getDate() - 30);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }
  
  return { startDate, endDate: now };
};

// Función para calcular el período anterior para comparación
const getPreviousDateRange = (timeframe: TimeframeOption) => {
  const { startDate, endDate } = getDateRange(timeframe);
  const duration = endDate.getTime() - startDate.getTime();
  
  const prevEndDate = new Date(startDate.getTime());
  const prevStartDate = new Date(startDate.getTime() - duration);
  
  return { startDate: prevStartDate, endDate: prevEndDate };
};

export const useDashboardDataCorrected = (
  timeframe: TimeframeOption = "month",
  serviceTypeFilter: ServiceTypeOption = "all"
) => {
  
  // Query para obtener todos los servicios usando la función que ya funciona
  const { data: allServices, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-services-corrected', timeframe, serviceTypeFilter],
    queryFn: async () => {
      console.log('=== DASHBOARD DATA CORRECTED: OBTENIENDO DATOS ===');
      
      try {
        const { data: serviceData, error } = await supabase
          .rpc('bypass_rls_get_servicios', { max_records: 25000 });

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
    
    // PASO 1: Calcular rangos de fechas para período actual y anterior
    const { startDate, endDate } = getDateRange(timeframe);
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousDateRange(timeframe);
    
    console.log(`📅 Dashboard - Período actual: ${startDate.toISOString()} a ${endDate.toISOString()}`);
    console.log(`📅 Dashboard - Período anterior: ${prevStartDate.toISOString()} a ${prevEndDate.toISOString()}`);
    
    // PASO 2: Filtrar servicios por período actual
    const serviciosEnRango = allServices.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      return serviceDate >= startDate && serviceDate <= endDate;
    });

    // PASO 3: Filtrar servicios por período anterior para comparación
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

      // Análisis de GMV Corregido basado en auditoría forense
      const serviciosFinalizadosConCobro = serviciosFiltrados.filter(service => {
        const estado = (service.estado || '').trim();
        const cobro = Number(service.cobro_cliente);
        return estado === 'Finalizado' && !isNaN(cobro) && cobro > 0;
      });

      // Calcular GMV solo de servicios finalizados (según auditoría forense)
      let totalGmvCalculated = 0;
      const uniqueServiceIds = new Set();

      serviciosFinalizadosConCobro.forEach(service => {
        if (service.id_servicio && !uniqueServiceIds.has(service.id_servicio)) {
          uniqueServiceIds.add(service.id_servicio);
          const cobroCliente = Number(service.cobro_cliente) || 0;
          totalGmvCalculated += cobroCliente;
        }
      });

      // Análizar estados para métricas de estado
      const serviciosFinalizados = serviciosFiltrados.filter(service => {
        const estado = (service.estado || '').trim();
        return estado === 'Finalizado';
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

      // Clientes únicos en el período (solo de servicios finalizados)
      const clientesUnicos = new Set(
        serviciosFinalizados
          .filter(s => s.nombre_cliente)
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

    // Calcular crecimientos y porcentajes
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const calculatePercentage = (value: number, total: number) => {
      if (total === 0) return 0;
      return Math.round((value / total) * 100);
    };

    const result = {
      ...currentPeriod,
      yearlyGrowth: 15,
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
    console.log(`   - GMV: ${result.totalGMVGrowth}% (${currentPeriod.totalGMV} vs ${previousPeriod.totalGMV})`);
    console.log(`   - Clientes: ${result.activeClientsGrowth}% (${currentPeriod.activeClients} vs ${previousPeriod.activeClients})`);
    console.log(`   - Valor promedio: ${result.averageServiceValueGrowth}% (${currentPeriod.averageServiceValue} vs ${previousPeriod.averageServiceValue})`);
    
    return result;
  }, [allServices, isLoading, error, timeframe, serviceTypeFilter]);

  return {
    isLoading,
    error,
    dashboardData,
    refreshAllData: refetch,
    // Datos dummy para mantener compatibilidad
    serviceStatusData: [],
    serviceTypesData: [],
    dailyServiceData: [],
    topClientsData: []
  };
};
