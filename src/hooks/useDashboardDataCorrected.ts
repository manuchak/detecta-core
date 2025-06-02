
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
}

export type TimeframeOption = "day" | "week" | "month" | "quarter" | "year";
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
    case "quarter":
      startDate.setDate(now.getDate() - 90);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }
  
  return { startDate, endDate: now };
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
    staleTime: 5 * 60 * 1000, // 5 minutos
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
        yearlyGrowth: 0
      };
    }

    console.log(`📈 DASHBOARD: Aplicando filtro temporal - ${timeframe}`);
    
    // PASO 1: Calcular rango de fechas basado en el filtro seleccionado
    const { startDate, endDate } = getDateRange(timeframe);
    console.log(`📅 Dashboard - Rango de fechas: ${startDate.toISOString()} a ${endDate.toISOString()}`);
    
    // PASO 2: Filtrar servicios por rango de fechas
    const serviciosEnRango = allServices.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      return serviceDate >= startDate && serviceDate <= endDate;
    });
    console.log(`📅 Dashboard - Servicios en rango ${timeframe}: ${serviciosEnRango.length}`);

    // PASO 3: Aplicar filtro de tipo de servicio si no es "all"
    let serviciosFiltrados = serviciosEnRango;
    if (serviceTypeFilter !== "all") {
      serviciosFiltrados = serviciosEnRango.filter(service => {
        const tipoServicio = (service.local_foraneo || service.tipo_servicio || '').toLowerCase();
        return tipoServicio.includes(serviceTypeFilter.toLowerCase());
      });
      console.log(`🔍 Dashboard - Servicios después de filtro tipo "${serviceTypeFilter}": ${serviciosFiltrados.length}`);
    }

    // PASO 4: Analizar estados
    const estadosConteo = {};
    serviciosFiltrados.forEach(s => {
      const estado = s.estado || 'NULL';
      estadosConteo[estado] = (estadosConteo[estado] || 0) + 1;
    });
    console.log('📋 Dashboard - Estados en rango:', estadosConteo);

    // PASO 5: Servicios completados (mismas variaciones que forecast)
    const variacionesCompletas = ['finalizado', 'completado', 'finished', 'completed', 'done'];
    const serviciosCompletados = serviciosFiltrados.filter(service => {
      const estado = (service.estado || '').toLowerCase().trim();
      return variacionesCompletas.some(variacion => estado.includes(variacion));
    });
    console.log(`✅ Dashboard - Servicios completados en ${timeframe}: ${serviciosCompletados.length}`);

    // PASO 6: Otros estados
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

    // PASO 7: Calcular GMV de servicios completados únicos
    const uniqueServiceIds = new Set();
    let totalGmvCalculated = 0;

    serviciosCompletados.forEach(service => {
      if (service.id_servicio && !uniqueServiceIds.has(service.id_servicio)) {
        uniqueServiceIds.add(service.id_servicio);
        const cobroCliente = Number(service.cobro_cliente) || 0;
        totalGmvCalculated += cobroCliente;
      }
    });

    const serviciosUnicos = uniqueServiceIds.size;
    
    // PASO 8: Clientes únicos en el período
    const clientesUnicos = new Set(
      serviciosCompletados
        .filter(s => s.nombre_cliente)
        .map(s => s.nombre_cliente.trim().toUpperCase())
    ).size;

    // PASO 9: Valor promedio
    const valorPromedio = serviciosUnicos > 0 ? totalGmvCalculated / serviciosUnicos : 0;

    // PASO 10: Total de servicios en el período (todos los estados)
    const totalServiciosEnPeriodo = serviciosFiltrados.length;

    const result = {
      totalServices: totalServiciosEnPeriodo, // TOTAL DE SERVICIOS EN EL PERÍODO
      totalGMV: totalGmvCalculated,
      activeClients: clientesUnicos,
      averageServiceValue: valorPromedio,
      completedServices: serviciosUnicos, // SERVICIOS ÚNICOS COMPLETADOS
      ongoingServices: serviciosEnCurso.length,
      pendingServices: serviciosPendientes.length,
      cancelledServices: serviciosCancelados.length,
      yearlyGrowth: 15
    };

    console.log(`🎯 DASHBOARD RESULT para ${timeframe}:`, result);
    console.log(`📊 Resumen: ${totalServiciosEnPeriodo} servicios totales, ${serviciosUnicos} completados únicos`);
    
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
