
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ForensicDashboardMetrics {
  totalServices: number;
  totalGMV: number;
  activeClients: number;
  averageServiceValue: number;
  completedServices: number;
  ongoingServices: number;
  pendingServices: number;
  cancelledServices: number;
  yearlyGrowth: number;
  totalServicesGrowth: number;
  totalGMVGrowth: number;
  activeClientsGrowth: number;
  averageServiceValueGrowth: number;
  completedServicesPercentage: number;
  ongoingServicesPercentage: number;
  pendingServicesPercentage: number;
  cancelledServicesPercentage: number;
  // Métricas adicionales de calidad de datos
  dataQualityScore: number;
  duplicatesFound: number;
  invalidRecords: number;
  missingCustodian: number;
  missingCharges: number;
}

export type TimeframeOption = "day" | "week" | "month" | "quarter" | "year" | "custom" | "thisMonth" | "thisQuarter" | "lastMonth" | "lastQuarter" | "last7Days" | "last30Days" | "last90Days" | "yearToDate";
export type ServiceTypeOption = "all" | "local" | "foraneo";

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

const getPreviousDateRange = (timeframe: TimeframeOption) => {
  const { startDate, endDate } = getDateRange(timeframe);
  const duration = endDate.getTime() - startDate.getTime();
  
  let prevEndDate = new Date(startDate.getTime());
  let prevStartDate = new Date(startDate.getTime() - duration);
  
  switch (timeframe) {
    case "thisMonth":
      prevStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
      prevEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
      break;
    case "thisQuarter":
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
      prevStartDate = new Date(startDate.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
      break;
  }
  
  return { startDate: prevStartDate, endDate: prevEndDate };
};

export const useDashboardForensicData = (
  timeframe: TimeframeOption = "thisMonth",
  serviceTypeFilter: ServiceTypeOption = "all"
) => {
  
  const { data: allServices, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-forensic-data', timeframe, serviceTypeFilter],
    queryFn: async () => {
      console.log('=== DASHBOARD FORENSIC: OBTENIENDO DATOS CON METODOLOGÍA FORENSE ===');
      
      try {
        const { data: serviceData, error } = await supabase
          .rpc('bypass_rls_get_servicios', { max_records: 50000 });

        if (error) {
          console.error('Error al obtener servicios:', error);
          throw error;
        }

        console.log(`🔍 FORENSIC: Total de registros obtenidos: ${serviceData?.length || 0}`);
        return serviceData || [];
      } catch (error) {
        console.error('Error en consulta forensic:', error);
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
        cancelledServicesPercentage: 0,
        dataQualityScore: 0,
        duplicatesFound: 0,
        invalidRecords: 0,
        missingCustodian: 0,
        missingCharges: 0
      };
    }

    console.log(`🔍 FORENSIC DASHBOARD: Aplicando metodología forense - ${timeframe}`);
    
    // PASO 1: Aplicar validaciones de integridad de datos (metodología forense)
    const validationResults = {
      duplicatesFound: 0,
      invalidRecords: 0,
      missingCustodian: 0,
      missingCharges: 0
    };

    // Detectar duplicados por id_servicio
    const serviceIdCount = new Map<string, number>();
    allServices.forEach(service => {
      if (service.id_servicio && service.id_servicio.trim() !== '') {
        const id = service.id_servicio.trim();
        serviceIdCount.set(id, (serviceIdCount.get(id) || 0) + 1);
      }
    });

    // Contar duplicados
    for (const [id, count] of serviceIdCount.entries()) {
      if (count > 1) {
        validationResults.duplicatesFound += count - 1; // Solo los extras
      }
    }

    // Detectar registros con problemas de calidad
    allServices.forEach(service => {
      // Custodios faltantes o con errores
      if (!service.custodio || service.custodio.trim() === '' || service.custodio === '#N/A') {
        validationResults.missingCustodian++;
      }
      
      // Registros sin cobro válido
      const cobro = Number(service.cobro_cliente);
      if (isNaN(cobro) || cobro <= 0) {
        validationResults.missingCharges++;
      }
      
      // Registros con datos inválidos generales
      if (service.nombre_cliente === '#N/A' || !service.fecha_hora_cita) {
        validationResults.invalidRecords++;
      }
    });

    // PASO 2: Calcular rangos de fechas
    const { startDate, endDate } = getDateRange(timeframe);
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousDateRange(timeframe);
    
    console.log(`📅 FORENSIC - Período actual: ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()}`);
    console.log(`📅 FORENSIC - Período anterior: ${prevStartDate.toLocaleDateString()} a ${prevEndDate.toLocaleDateString()}`);
    
    // PASO 3: Filtrar servicios por períodos
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
    
    console.log(`📅 FORENSIC - Servicios período actual: ${serviciosEnRango.length}`);
    console.log(`📅 FORENSIC - Servicios período anterior: ${serviciosRangoAnterior.length}`);

    // PASO 4: Procesar servicios con metodología forense
    const procesarServiciosForense = (servicios: any[]) => {
      let serviciosFiltrados = servicios;
      
      // Aplicar filtro de tipo de servicio
      if (serviceTypeFilter !== "all") {
        serviciosFiltrados = servicios.filter(service => {
          const tipoServicio = (service.local_foraneo || service.tipo_servicio || '').toLowerCase();
          return tipoServicio.includes(serviceTypeFilter.toLowerCase());
        });
      }

      // METODOLOGÍA FORENSE: Eliminar duplicados usando DISTINCT por id_servicio
      const uniqueServices = new Map();
      serviciosFiltrados.forEach(service => {
        if (service.id_servicio && service.id_servicio.trim() !== '') {
          const key = service.id_servicio.trim();
          if (!uniqueServices.has(key)) {
            uniqueServices.set(key, service);
          } else {
            // Mantener el más reciente basado en fecha_hora_cita
            const existing = uniqueServices.get(key);
            const existingDate = existing.fecha_hora_cita ? new Date(existing.fecha_hora_cita) : new Date(0);
            const currentDate = service.fecha_hora_cita ? new Date(service.fecha_hora_cita) : new Date(0);
            
            if (currentDate > existingDate) {
              uniqueServices.set(key, service);
            }
          }
        }
      });

      const serviciosUnicos = Array.from(uniqueServices.values());
      console.log(`🔍 FORENSIC: Servicios únicos después de deduplicación: ${serviciosUnicos.length} de ${serviciosFiltrados.length}`);

      // Análisis de estados con validación forense
      const serviciosFinalizados = serviciosUnicos.filter(service => {
        const estado = (service.estado || '').trim().toLowerCase();
        const cobro = Number(service.cobro_cliente);
        const custodio = service.custodio || '';
        
        // Validación forense: solo servicios realmente finalizados con datos válidos
        return estado === 'finalizado' && 
               !isNaN(cobro) && cobro > 0 && 
               custodio.trim() !== '' && custodio !== '#N/A';
      });

      const serviciosCancelados = serviciosUnicos.filter(service => {
        const estado = (service.estado || '').toLowerCase().trim();
        return estado.includes('cancelado');
      });

      const serviciosEnCurso = serviciosUnicos.filter(service => {
        const estado = (service.estado || '').toLowerCase().trim();
        return estado.includes('ruta') || estado.includes('destino') || estado.includes('origen');
      });

      const serviciosPendientes = serviciosUnicos.filter(service => {
        const estado = (service.estado || '').toLowerCase().trim();
        return estado.includes('pendiente') || estado.includes('programado') || estado.includes('espera');
      });

      // GMV con validación forense
      let totalGmvForense = 0;
      serviciosFinalizados.forEach(service => {
        const cobro = Number(service.cobro_cliente);
        if (!isNaN(cobro) && cobro > 0) {
          totalGmvForense += cobro;
        }
      });

      // Clientes únicos con validación forense
      const clientesUnicos = new Set();
      serviciosFinalizados.forEach(service => {
        if (service.nombre_cliente && 
            service.nombre_cliente.trim() !== '' && 
            service.nombre_cliente !== '#N/A') {
          clientesUnicos.add(service.nombre_cliente.trim().toUpperCase());
        }
      });

      // Valor promedio con validación forense
      const valorPromedio = serviciosFinalizados.length > 0 ? 
        totalGmvForense / serviciosFinalizados.length : 0;

      return {
        totalServices: serviciosUnicos.length,
        totalGMV: totalGmvForense,
        activeClients: clientesUnicos.size,
        averageServiceValue: valorPromedio,
        completedServices: serviciosFinalizados.length,
        ongoingServices: serviciosEnCurso.length,
        pendingServices: serviciosPendientes.length,
        cancelledServices: serviciosCancelados.length
      };
    };

    // Procesar ambos períodos
    const currentPeriod = procesarServiciosForense(serviciosEnRango);
    const previousPeriod = procesarServiciosForense(serviciosRangoAnterior);

    // Calcular crecimientos
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      const growth = ((current - previous) / previous) * 100;
      return Math.max(-100, Math.min(1000, Math.round(growth)));
    };

    const calculatePercentage = (value: number, total: number) => {
      if (total === 0) return 0;
      return Math.round((value / total) * 100);
    };

    // Calcular score de calidad de datos
    const totalRecords = serviciosEnRango.length;
    const problemRecords = validationResults.duplicatesFound + 
                          validationResults.invalidRecords + 
                          validationResults.missingCustodian + 
                          validationResults.missingCharges;
    
    const dataQualityScore = totalRecords > 0 ? 
      Math.round(((totalRecords - problemRecords) / totalRecords) * 100) : 100;

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
      cancelledServicesPercentage: calculatePercentage(currentPeriod.cancelledServices, currentPeriod.totalServices),
      // Métricas forenses
      dataQualityScore,
      duplicatesFound: validationResults.duplicatesFound,
      invalidRecords: validationResults.invalidRecords,
      missingCustodian: validationResults.missingCustodian,
      missingCharges: validationResults.missingCharges
    };

    console.log(`🎯 DASHBOARD FORENSIC RESULT para ${timeframe}:`, result);
    console.log(`📊 Métricas de calidad de datos:`);
    console.log(`   - Score de calidad: ${result.dataQualityScore}%`);
    console.log(`   - Duplicados encontrados: ${result.duplicatesFound}`);
    console.log(`   - Registros inválidos: ${result.invalidRecords}`);
    console.log(`   - Sin custodio: ${result.missingCustodian}`);
    console.log(`   - Sin cobro: ${result.missingCharges}`);
    
    return result;
  }, [allServices, isLoading, error, timeframe, serviceTypeFilter]);

  return {
    isLoading,
    error,
    dashboardData,
    refreshAllData: refetch
  };
};
