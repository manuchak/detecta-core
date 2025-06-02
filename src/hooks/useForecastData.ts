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
      console.log('=== INICIO DIAGNÓSTICO MEJORADO ===');
      
      try {
        // Usar la función que ya funciona en otros componentes
        const { data: serviceData, error } = await supabase
          .rpc('bypass_rls_get_servicios', { max_records: 25000 });

        if (error) {
          console.error('Error al obtener servicios con bypass:', error);
          throw error;
        }

        console.log('📊 FASE 1: AUDITORÍA TOTAL DE DATOS');
        console.log(`Total de registros retornados por RLS: ${serviceData?.length || 0}`);

        // Analizar todas las fechas para entender el rango real
        const fechasValidas = serviceData?.filter(s => s.fecha_hora_cita).map(s => new Date(s.fecha_hora_cita)) || [];
        const fechaMinima = fechasValidas.length > 0 ? new Date(Math.min(...fechasValidas.map(f => f.getTime()))) : null;
        const fechaMaxima = fechasValidas.length > 0 ? new Date(Math.max(...fechasValidas.map(f => f.getTime()))) : null;
        
        console.log('📅 RANGO REAL DE FECHAS EN LA BDD:');
        console.log(`└─ Fecha más antigua: ${fechaMinima?.toLocaleDateString('es-MX') || 'N/A'}`);
        console.log(`└─ Fecha más reciente: ${fechaMaxima?.toLocaleDateString('es-MX') || 'N/A'}`);
        console.log(`└─ Total de registros con fecha válida: ${fechasValidas.length}`);

        // Analizar distribución por mes de 2025
        const registrosPor2025 = serviceData?.filter(s => {
          if (!s.fecha_hora_cita) return false;
          const fecha = new Date(s.fecha_hora_cita);
          return fecha.getFullYear() === 2025;
        }) || [];

        console.log('📈 DISTRIBUCIÓN POR MES EN 2025:');
        const mesesConteo = {};
        registrosPor2025.forEach(s => {
          const fecha = new Date(s.fecha_hora_cita);
          const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
          mesesConteo[mesKey] = (mesesConteo[mesKey] || 0) + 1;
        });
        
        Object.keys(mesesConteo).sort().forEach(mes => {
          console.log(`└─ ${mes}: ${mesesConteo[mes]} registros`);
        });

        // Analizar específicamente del 30 de abril a la fecha
        const fechaAbril30 = new Date('2025-04-30');
        const fechaHoy = new Date();
        const registrosAbril30AHoy = serviceData?.filter(s => {
          if (!s.fecha_hora_cita) return false;
          const fecha = new Date(s.fecha_hora_cita);
          return fecha >= fechaAbril30 && fecha <= fechaHoy;
        }) || [];

        console.log('🎯 ANÁLISIS ESPECÍFICO (30 ABR - HOY):');
        console.log(`└─ Registros del 30 abril a hoy: ${registrosAbril30AHoy.length}`);
        console.log(`└─ Usuario dice que hay 1,000 registros del 30 abril a la fecha`);
        console.log(`└─ Diferencia encontrada: ${1000 - registrosAbril30AHoy.length}`);

        // Analizar estados únicos
        const estadosUnicos = [...new Set(serviceData?.map(s => s.estado))];
        console.log('📋 Estados únicos en la base de datos:', estadosUnicos);
        
        // Contar por cada estado
        const conteoEstados = estadosUnicos.reduce((acc, estado) => {
          acc[estado || 'NULL'] = serviceData?.filter(s => s.estado === estado).length || 0;
          return acc;
        }, {} as Record<string, number>);
        console.log('📈 Conteo por estado:', conteoEstados);

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
    console.log('📊 FASE 2: ANÁLISIS DE FILTROS CORREGIDO');
    
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

    // Procesar datos localmente con análisis paso a paso CORREGIDO
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // CORREGIR: Usar fechas más amplias para capturar todos los datos
    const startDate = new Date(2025, 0, 1); // Enero 1, 2025
    const endDate = new Date(2025, 11, 31); // Diciembre 31, 2025 (todo el año)
    
    console.log('🗓️ FILTROS DE FECHA CORREGIDOS:', {
      año: 2025,
      mesActual: currentMonth,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalRegistrosOriginales: allServices.length
    });

    // PASO 1: Filtrar por rango de fechas MÁS AMPLIO
    const serviciosEnRango = allServices.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      // Solo filtrar por año 2025, no por fecha específica
      return serviceDate.getFullYear() === 2025;
    });
    console.log(`📅 Después de filtro por año 2025: ${serviciosEnRango.length} servicios (${((serviciosEnRango.length/allServices.length)*100).toFixed(1)}%)`);

    // PASO 2: Analizar estados EN DETALLE
    const estadosEnRango = [...new Set(serviciosEnRango.map(s => s.estado))];
    console.log('📋 Estados disponibles en 2025:', estadosEnRango);
    
    const conteoEstadosRango = estadosEnRango.reduce((acc, estado) => {
      acc[estado || 'NULL'] = serviciosEnRango.filter(s => s.estado === estado).length;
      return acc;
    }, {} as Record<string, number>);
    console.log('📈 Conteo por estado en 2025:', conteoEstadosRango);

    // PASO 3: Probar MÚLTIPLES variaciones de estados "completados"
    const variacionesCompletas = ['finalizado', 'completado', 'finished', 'completed', 'done'];
    const serviciosCompletados = serviciosEnRango.filter(service => {
      const estado = (service.estado || '').toLowerCase().trim();
      return variacionesCompletas.some(variacion => estado.includes(variacion));
    });
    console.log(`✅ Servicios con cualquier variación de completado: ${serviciosCompletados.length}`);

    // PASO 4: Análisis de IDs y montos SIN EXCLUSIONES
    const serviciosConId = serviciosCompletados.filter(service => {
      return service.id_servicio && service.id_servicio.trim() !== '';
    });
    console.log(`🆔 Servicios completados con ID válido: ${serviciosConId.length}`);

    const serviciosConMonto = serviciosConId.filter(service => {
      const monto = Number(service.cobro_cliente);
      return !isNaN(monto) && monto > 0;
    });
    console.log(`💰 Servicios completados con monto > 0: ${serviciosConMonto.length}`);

    // PASO 5: Análisis de servicios SIN monto pero válidos
    const serviciosSinMonto = serviciosConId.filter(service => {
      const monto = Number(service.cobro_cliente);
      return isNaN(monto) || monto === 0;
    });
    console.log(`❓ Servicios completados SIN monto válido: ${serviciosSinMonto.length}`);

    // PASO 6: Conteo distintivo INCLUYENDO servicios sin monto
    const uniqueServiceIds = new Set();
    let totalGmvCalculated = 0;

    // Incluir TODOS los servicios con ID válido, tengan monto o no
    serviciosConId.forEach(service => {
      if (service.id_servicio && !uniqueServiceIds.has(service.id_servicio)) {
        uniqueServiceIds.add(service.id_servicio);
        const cobroCliente = Number(service.cobro_cliente) || 0;
        totalGmvCalculated += cobroCliente;
      }
    });

    const realServicesEneroAHoy = uniqueServiceIds.size;
    const realGmvEneroAHoy = totalGmvCalculated;
    
    console.log('🎯 RESULTADOS FINALES CORREGIDOS:');
    console.log(`└─ Servicios únicos procesados: ${realServicesEneroAHoy}`);
    console.log(`└─ GMV total calculado: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(realGmvEneroAHoy)}`);
    console.log(`└─ Porcentaje de registros finales vs originales: ${((realServicesEneroAHoy/allServices.length)*100).toFixed(2)}%`);
    
    // Análisis de pérdidas CORREGIDO
    console.log('📉 ANÁLISIS DE PÉRDIDAS POR FILTRO CORREGIDO:');
    console.log(`└─ Pérdida por año (no 2025): ${allServices.length - serviciosEnRango.length} registros`);
    console.log(`└─ Pérdida por estado (no completado): ${serviciosEnRango.length - serviciosCompletados.length} registros`);
    console.log(`└─ Pérdida por ID inválido: ${serviciosCompletados.length - serviciosConId.length} registros`);
    console.log(`└─ Servicios incluidos SIN monto: ${serviciosSinMonto.length} registros`);
    console.log(`└─ Servicios CON monto válido: ${serviciosConMonto.length} registros`);
    console.log(`└─ Servicios duplicados removidos: ${serviciosConId.length - realServicesEneroAHoy} registros`);
    
    // Comparación con expectativa del usuario
    console.log('🔍 COMPARACIÓN CON EXPECTATIVA DEL USUARIO:');
    console.log(`└─ Usuario esperaba: >1,000 servicios (del 30 abril a hoy)`);
    console.log(`└─ Encontramos: ${realServicesEneroAHoy} servicios (enero a diciembre 2025)`);
    console.log(`└─ Diferencia: ${1000 - realServicesEneroAHoy} servicios`);
    
    // Calcular nombres de meses dinámicamente
    const lastDataMonth = new Date(2025, currentMonth - 2, 1).toLocaleDateString('es-ES', { month: 'long' });
    const forecastMonth = new Date(2025, currentMonth - 1, 1).toLocaleDateString('es-ES', { month: 'long' });
    
    // Calcular cuántos meses completos tenemos de datos (enero a mes anterior)
    const monthsWithData = Math.max(1, currentMonth - 1); // Al menos 1 mes
    
    // Si no hay servicios reales, retornar ceros
    if (realServicesEneroAHoy === 0) {
      console.warn('❌ No se encontraron servicios completados para el cálculo de forecast');
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
    
    // ... keep existing code (monthlyDistribution and forecast calculations) the same
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
    
    console.log('=== DIAGNÓSTICO MEJORADO COMPLETO ===');
    
    return result;
  }, [allServices, isLoading, error]);
};
