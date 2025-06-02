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
  
  // Query para obtener servicios finalizados directamente de la tabla
  const { data: realData, isLoading, error } = useQuery({
    queryKey: ['forecast-real-data'],
    queryFn: async () => {
      console.log('=== INICIO DEBUG FORECAST ===');
      
      try {
        // Calcular rango dinámico: desde enero hasta mes anterior al actual
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        
        // Crear fechas de inicio y fin para el filtro
        const startDate = `${currentYear}-01-01T00:00:00.000Z`;
        const endDate = `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}-${new Date(currentYear, currentMonth - 1, 0).getDate()}T23:59:59.999Z`;
        
        console.log('Rango de fechas configurado:', {
          año: currentYear,
          mesActual: currentMonth,
          rangoDesde: startDate,
          rangoHasta: endDate,
          descripcion: `Enero a ${new Date(currentYear, currentMonth - 2, 1).toLocaleDateString('es-ES', { month: 'long' })} ${currentYear}`
        });

        // Consultar servicios finalizados directamente
        const { data: serviceData, error, count } = await supabase
          .from('servicios_custodia')
          .select('id_servicio, cobro_cliente, estado, fecha_hora_cita', { count: 'exact' })
          .eq('estado', 'Finalizado')
          .gte('fecha_hora_cita', startDate)
          .lte('fecha_hora_cita', endDate)
          .not('id_servicio', 'is', null)
          .not('cobro_cliente', 'is', null)
          .limit(50000);

        if (error) {
          console.error('Error al obtener servicios:', error);
          throw error;
        }

        console.log('Datos brutos obtenidos:', {
          totalRecords: count,
          dataLength: serviceData?.length || 0,
          sampleRecord: serviceData?.[0]
        });

        if (!serviceData || serviceData.length === 0) {
          console.warn('No se encontraron datos');
          return {
            uniqueServices: 0,
            totalGmv: 0,
            currentMonth,
            currentYear,
            debugInfo: { 
              totalFromDB: 0, 
              dateRange: { startDate, endDate },
              source: 'direct_query'
            }
          };
        }

        // Procesar datos para obtener servicios únicos y GMV total
        const uniqueServiceIds = new Set();
        let totalGmv = 0;

        serviceData.forEach(record => {
          if (record.id_servicio) {
            uniqueServiceIds.add(record.id_servicio);
            totalGmv += Number(record.cobro_cliente) || 0;
          }
        });

        const uniqueServices = uniqueServiceIds.size;

        const response = {
          uniqueServices,
          totalGmv,
          currentMonth,
          currentYear,
          debugInfo: {
            totalFromDB: serviceData.length,
            dateRange: { startDate, endDate },
            source: 'direct_query',
            uniqueServicesCalculated: uniqueServices,
            totalGmvCalculated: totalGmv
          }
        };

        console.log('=== RESULTADO FINAL ===');
        console.log('Servicios únicos calculados:', response.uniqueServices);
        console.log('GMV total calculado:', response.totalGmv);
        console.log('Debug info completo:', response.debugInfo);
        console.log('=== FIN DEBUG FORECAST ===');

        return response;
      } catch (error) {
        console.error('Error en consulta de forecast:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
  
  return useMemo(() => {
    console.log('useForecastData - Estado de datos:', { 
      isLoading,
      hasError: !!error,
      error: error?.message,
      hasData: !!realData,
      uniqueServices: realData?.uniqueServices,
      totalGmv: realData?.totalGmv,
      debugInfo: realData?.debugInfo
    });
    
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
    if (isLoading || !realData) {
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

    // Usar datos reales calculados
    const realServicesJanToLastMonth = realData.uniqueServices;
    const realGmvJanToLastMonth = realData.totalGmv;
    
    // Calcular nombres de meses dinámicamente
    const currentMonth = realData.currentMonth || new Date().getMonth() + 1;
    const lastDataMonth = new Date(2025, currentMonth - 2, 1).toLocaleDateString('es-ES', { month: 'long' });
    const forecastMonth = new Date(2025, currentMonth - 1, 1).toLocaleDateString('es-ES', { month: 'long' });
    const monthsWithData = currentMonth - 1; // Enero a mes anterior
    
    console.log('useForecastData - Datos reales confirmados:', {
      realServicesJanToLastMonth,
      realGmvJanToLastMonth,
      monthsWithData,
      lastDataMonth,
      forecastMonth,
      formatoGMV: new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
      }).format(realGmvJanToLastMonth)
    });
    
    // Si no hay servicios reales, retornar ceros
    if (realServicesJanToLastMonth === 0) {
      console.warn('No se encontraron servicios finalizados para el cálculo de forecast');
      return {
        monthlyServicesForecast: 0,
        monthlyGmvForecast: 0,
        annualServicesForecast: 0,
        annualGmvForecast: 0,
        monthlyServicesActual: realServicesJanToLastMonth,
        monthlyGmvActual: realGmvJanToLastMonth,
        annualServicesActual: realServicesJanToLastMonth,
        annualGmvActual: realGmvJanToLastMonth,
        monthlyServicesVariance: 0,
        monthlyGmvVariance: 0,
        annualServicesVariance: 0,
        annualGmvVariance: 0,
        lastDataMonth,
        forecastMonth
      };
    }
    
    // Calcular promedios mensuales basados en datos reales
    const avgServicesPerMonth = Math.round(realServicesJanToLastMonth / monthsWithData);
    const avgGmvPerMonth = Math.round(realGmvJanToLastMonth / monthsWithData);
    const avgServiceValue = realGmvJanToLastMonth / realServicesJanToLastMonth;
    
    console.log('useForecastData - Promedios calculados:', {
      avgServicesPerMonth,
      avgGmvPerMonth,
      avgServiceValue,
      monthsWithData
    });
    
    // Distribución mensual con factores estacionales conservadores
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
    
    const annualServicesForecast = realServicesJanToLastMonth + remainingMonthsServices;
    const annualGmvForecast = realGmvJanToLastMonth + remainingMonthsGmv;
    
    console.log('useForecastData - Forecast calculado:', {
      currentMonthServicesForecast,
      currentMonthGmvForecast,
      remainingMonthsServices,
      remainingMonthsGmv,
      annualServicesForecast,
      annualGmvForecast,
      avgServiceValue
    });
    
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
      monthlyServicesActual: realServicesJanToLastMonth,
      monthlyGmvActual: realGmvJanToLastMonth,
      annualServicesActual: realServicesJanToLastMonth,
      annualGmvActual: realGmvJanToLastMonth,
      monthlyServicesVariance,
      monthlyGmvVariance,
      annualServicesVariance,
      annualGmvVariance,
      lastDataMonth,
      forecastMonth
    };
    
    console.log('useForecastData - Resultado final:', result);
    
    return result;
  }, [realData, isLoading, error]);
};
