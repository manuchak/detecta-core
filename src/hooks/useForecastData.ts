
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ForecastData {
  monthlyServicesForecast: number;
  monthlyGmvForecast: number;
  annualServicesForecast: number;
  annualGmvForecast: number;
  monthlyServicesActual: number;
  monthlyGmvActual: number;
  annualServicesActual: number;
  annualGmvActual: number;
  monthlyServicesVariance: number;
  monthlyGmvVariance: number;
  annualServicesVariance: number;
  annualGmvVariance: number;
  lastDataMonth: string;
  forecastMonth: string;
}

export const useForecastData = (
  totalServices: number,
  totalGMV: number,
  historicalData?: Array<{ month: number; services: number; gmv: number }>
): ForecastData => {
  
  // Query para obtener todos los servicios usando la función que ya funciona
  const { data: allServices, isLoading, error } = useQuery({
    queryKey: ['forecast-services-data'],
    queryFn: async () => {
      console.log('=== INICIO DIAGNÓSTICO FORECAST ===');
      
      try {
        // Usar la función que ya funciona en otros componentes
        const { data: serviceData, error } = await supabase
          .rpc('bypass_rls_get_servicios', { max_records: 25000 });

        if (error) {
          console.error('Error al obtener servicios con bypass:', error);
          throw error;
        }

        console.log('📊 FASE 1: AUDITORÍA DE DATOS TOTALES');
        console.log(`Total de registros retornados por RLS: ${serviceData?.length || 0}`);

        // Analizar estados únicos
        const estadosUnicos = [...new Set(serviceData?.map(s => s.estado))];
        console.log('📋 Estados únicos en la base de datos:', estadosUnicos);
        
        // Contar por cada estado
        const conteoEstados = estadosUnicos.reduce((acc, estado) => {
          acc[estado || 'NULL'] = serviceData?.filter(s => s.estado === estado).length || 0;
          return acc;
        }, {} as Record<string, number>);
        console.log('📈 Conteo por estado:', conteoEstados);

        // Analizar distribución de cobro_cliente
        const serviciosConCobro = serviceData?.filter(s => s.cobro_cliente && !isNaN(Number(s.cobro_cliente))) || [];
        const serviciosSinCobro = serviceData?.filter(s => !s.cobro_cliente || isNaN(Number(s.cobro_cliente))) || [];
        console.log(`💰 Servicios con cobro válido: ${serviciosConCobro.length}`);
        console.log(`❌ Servicios sin cobro o inválido: ${serviciosSinCobro.length}`);

        // Analizar IDs de servicio
        const serviciosConId = serviceData?.filter(s => s.id_servicio && s.id_servicio.trim() !== '') || [];
        const serviciosSinId = serviceData?.filter(s => !s.id_servicio || s.id_servicio.trim() === '') || [];
        console.log(`🆔 Servicios con ID válido: ${serviciosConId.length}`);
        console.log(`❌ Servicios sin ID o ID vacío: ${serviciosSinId.length}`);

        return serviceData || [];
      } catch (error) {
        console.error('Error en consulta de forecast:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
  
  return useMemo(() => {
    console.log('📊 FASE 2: ANÁLISIS DE FILTROS');
    
    // Si hay error, mostrar el error en consola y usar valores por defecto
    if (error) {
      console.error('Error en forecast data:', error);
      return {
        monthlyServicesForecast: 0,
        monthlyGmvForecast: 0,
        annualServicesForecast: 0,
        annualGmvForecast: 0,
        monthlyServicesActual: 0,
        monthlyGmvActual: 0,
        annualServicesActual: 0,
        annualGmvActual: 0,
        monthlyServicesVariance: 0,
        monthlyGmvVariance: 0,
        annualServicesVariance: 0,
        annualGmvVariance: 0,
        lastDataMonth: 'mayo',
        forecastMonth: 'junio'
      };
    }
    
    // Si aún está cargando, mostrar valores temporales
    if (isLoading || !allServices) {
      return {
        monthlyServicesForecast: 0,
        monthlyGmvForecast: 0,
        annualServicesForecast: 0,
        annualGmvForecast: 0,
        monthlyServicesActual: 0,
        monthlyGmvActual: 0,
        annualServicesActual: 0,
        annualGmvActual: 0,
        monthlyServicesVariance: 0,
        monthlyGmvVariance: 0,
        annualServicesVariance: 0,
        annualGmvVariance: 0,
        lastDataMonth: 'mayo',
        forecastMonth: 'junio'
      };
    }

    // Procesar datos localmente con análisis paso a paso
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // Filtrar servicios desde enero 1, 2025 hasta hoy
    const startDate = new Date(2025, 0, 1); // Enero 1, 2025
    const endDate = new Date(); // Hasta hoy
    
    console.log('🗓️ Filtros de fecha:', {
      año: 2025,
      mesActual: currentMonth,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalRegistrosOriginales: allServices.length
    });

    // PASO 1: Filtrar por rango de fechas
    const serviciosEnRango = allServices.filter(service => {
      const serviceDate = new Date(service.fecha_hora_cita);
      const inDateRange = serviceDate >= startDate && serviceDate <= endDate;
      return inDateRange;
    });
    console.log(`📅 Después de filtro de fechas: ${serviciosEnRango.length} servicios (${((serviciosEnRango.length/allServices.length)*100).toFixed(1)}%)`);

    // PASO 2: Analizar estados en servicios filtrados por fecha
    const estadosEnRango = [...new Set(serviciosEnRango.map(s => s.estado))];
    console.log('📋 Estados disponibles en rango de fechas:', estadosEnRango);
    
    const conteoEstadosRango = estadosEnRango.reduce((acc, estado) => {
      acc[estado || 'NULL'] = serviciosEnRango.filter(s => s.estado === estado).length;
      return acc;
    }, {} as Record<string, number>);
    console.log('📈 Conteo por estado en rango:', conteoEstadosRango);

    // PASO 3: Probar diferentes variaciones de "finalizado"
    const variacionesFinalizados = serviciosEnRango.filter(service => {
      const estado = service.estado?.toLowerCase().trim() || '';
      return estado.includes('final') || estado.includes('complet') || estado === 'finalizado' || estado === 'completado';
    });
    console.log(`✅ Servicios con variaciones de "finalizado/completado": ${variacionesFinalizados.length}`);

    // PASO 4: Filtrar por estado exacto "finalizado"
    const serviciosFinalizados = serviciosEnRango.filter(service => {
      const isFinalized = service.estado?.toLowerCase().trim() === 'finalizado';
      return isFinalized;
    });
    console.log(`🎯 Servicios con estado exacto "finalizado": ${serviciosFinalizados.length}`);

    // PASO 5: Validar IDs
    const serviciosConIdValido = serviciosFinalizados.filter(service => {
      const hasValidId = service.id_servicio && service.id_servicio.trim() !== '';
      return hasValidId;
    });
    console.log(`🆔 Servicios finalizados con ID válido: ${serviciosConIdValido.length}`);

    // PASO 6: Validar montos
    const serviciosConMontoValido = serviciosConIdValido.filter(service => {
      const hasValidAmount = service.cobro_cliente && !isNaN(Number(service.cobro_cliente)) && Number(service.cobro_cliente) > 0;
      return hasValidAmount;
    });
    console.log(`💰 Servicios finalizados con monto válido: ${serviciosConMontoValido.length}`);

    // PASO 7: Conteo distintivo final
    const uniqueServiceIds = new Set();
    let totalGmvCalculated = 0;

    serviciosConMontoValido.forEach(service => {
      if (service.id_servicio && !uniqueServiceIds.has(service.id_servicio)) {
        uniqueServiceIds.add(service.id_servicio);
        const cobroCliente = Number(service.cobro_cliente) || 0;
        totalGmvCalculated += cobroCliente;
      }
    });

    const realServicesEneroAHoy = uniqueServiceIds.size;
    const realGmvEneroAHoy = totalGmvCalculated;
    
    console.log('🎯 RESULTADOS FINALES DEL DIAGNÓSTICO:');
    console.log(`└─ Servicios únicos procesados: ${realServicesEneroAHoy}`);
    console.log(`└─ GMV total calculado: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(realGmvEneroAHoy)}`);
    console.log(`└─ Porcentaje de registros finales vs originales: ${((realServicesEneroAHoy/allServices.length)*100).toFixed(2)}%`);
    
    // Análisis de pérdidas
    console.log('📉 ANÁLISIS DE PÉRDIDAS POR FILTRO:');
    console.log(`└─ Pérdida por fechas: ${allServices.length - serviciosEnRango.length} registros`);
    console.log(`└─ Pérdida por estado: ${serviciosEnRango.length - serviciosFinalizados.length} registros`);
    console.log(`└─ Pérdida por ID inválido: ${serviciosFinalizados.length - serviciosConIdValido.length} registros`);
    console.log(`└─ Pérdida por monto inválido: ${serviciosConIdValido.length - serviciosConMontoValido.length} registros`);
    console.log(`└─ Servicios duplicados removidos: ${serviciosConMontoValido.length - realServicesEneroAHoy} registros`);
    
    // Calcular nombres de meses dinámicamente
    const lastDataMonth = new Date(2025, currentMonth - 2, 1).toLocaleDateString('es-ES', { month: 'long' });
    const forecastMonth = new Date(2025, currentMonth - 1, 1).toLocaleDateString('es-ES', { month: 'long' });
    
    // Calcular cuántos meses completos tenemos de datos (enero a mes anterior)
    const monthsWithData = Math.max(1, currentMonth - 1); // Al menos 1 mes
    
    // Si no hay servicios reales, retornar ceros
    if (realServicesEneroAHoy === 0) {
      console.warn('❌ No se encontraron servicios finalizados para el cálculo de forecast');
      return {
        monthlyServicesForecast: 0,
        monthlyGmvForecast: 0,
        annualServicesForecast: 0,
        annualGmvForecast: 0,
        monthlyServicesActual: realServicesEneroAHoy,
        monthlyGmvActual: realGmvEneroAHoy,
        annualServicesActual: realServicesEneroAHoy,
        annualGmvActual: realGmvEneroAHoy,
        monthlyServicesVariance: 0,
        monthlyGmvVariance: 0,
        annualServicesVariance: 0,
        annualGmvVariance: 0,
        lastDataMonth,
        forecastMonth
      };
    }
    
    // Calcular promedios mensuales basados en datos reales corregidos
    const avgServicesPerMonth = Math.round(realServicesEneroAHoy / monthsWithData);
    const avgGmvPerMonth = Math.round(realGmvEneroAHoy / monthsWithData);
    const avgServiceValue = realGmvEneroAHoy / realServicesEneroAHoy;
    
    const monthlyDistribution = {
      1: { factor: 0.90, name: 'enero' },
      2: { factor: 0.95, name: 'febrero' },
      3: { factor: 1.05, name: 'marzo' },
      4: { factor: 1.10, name: 'abril' },
      5: { factor: 1.00, name: 'mayo' },
      6: { factor: 0.95, name: 'junio' },
      7: { factor: 0.85, name: 'julio' },
      8: { factor: 0.90, name: 'agosto' },
      9: { factor: 1.00, name: 'septiembre' },
      10: { factor: 1.10, name: 'octubre' },
      11: { factor: 1.15, name: 'noviembre' },
      12: { factor: 0.95, name: 'diciembre' }
    };
    
    // Calcular forecast para el mes actual usando factor estacional
    const currentMonthServicesForecast = Math.round(avgServicesPerMonth * monthlyDistribution[currentMonth].factor);
    const currentMonthGmvForecast = Math.round(currentMonthServicesForecast * avgServiceValue);
    
    // Calcular forecast anual usando factores estacionales
    const remainingMonthsServices = Object.keys(monthlyDistribution)
      .filter(month => parseInt(month) >= currentMonth)
      .reduce((sum, month) => {
        const monthNum = parseInt(month);
        const forecastServices = Math.round(avgServicesPerMonth * monthlyDistribution[monthNum].factor);
        return sum + forecastServices;
      }, 0);
    
    const remainingMonthsGmv = Math.round(remainingMonthsServices * avgServiceValue);
    
    const annualServicesForecast = realServicesEneroAHoy + remainingMonthsServices;
    const annualGmvForecast = realGmvEneroAHoy + remainingMonthsGmv;
    
    // Calcular varianzas comparando con promedio histórico
    const monthlyServicesVariance = avgServicesPerMonth > 0 ? ((currentMonthServicesForecast - avgServicesPerMonth) / avgServicesPerMonth) * 100 : 0;
    const monthlyGmvVariance = avgGmvPerMonth > 0 ? ((currentMonthGmvForecast - avgGmvPerMonth) / avgGmvPerMonth) * 100 : 0;
    
    // Calcular varianzas anuales comparando con proyección lineal simple
    const linearAnnualServicesProjection = avgServicesPerMonth * 12;
    const linearAnnualGmvProjection = avgGmvPerMonth * 12;
    
    const annualServicesVariance = linearAnnualServicesProjection > 0 ? ((annualServicesForecast - linearAnnualServicesProjection) / linearAnnualServicesProjection) * 100 : 0;
    const annualGmvVariance = linearAnnualGmvProjection > 0 ? ((annualGmvForecast - linearAnnualGmvProjection) / linearAnnualGmvProjection) * 100 : 0;
    
    const result = {
      monthlyServicesForecast: currentMonthServicesForecast,
      monthlyGmvForecast: currentMonthGmvForecast,
      annualServicesForecast,
      annualGmvForecast,
      monthlyServicesActual: realServicesEneroAHoy,
      monthlyGmvActual: realGmvEneroAHoy,
      annualServicesActual: realServicesEneroAHoy,
      annualGmvActual: realGmvEneroAHoy,
      monthlyServicesVariance,
      monthlyGmvVariance,
      annualServicesVariance,
      annualGmvVariance,
      lastDataMonth,
      forecastMonth
    };
    
    console.log('=== DIAGNÓSTICO COMPLETO ===');
    
    return result;
  }, [allServices, isLoading, error]);
};
