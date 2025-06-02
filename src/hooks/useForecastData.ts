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
  
  // Query para obtener servicios usando la función RPC segura que ya existe
  const { data: realData, isLoading, error } = useQuery({
    queryKey: ['forecast-real-data-secure'],
    queryFn: async () => {
      console.log('=== INICIO DEBUG FORECAST (FUNCIÓN SEGURA) ===');
      
      try {
        // Calcular rango dinámico: desde enero hasta mes anterior al actual
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const startDate = new Date(currentYear, 0, 1); // 1 enero del año actual
        const endDate = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59); // Último día del mes anterior
        
        console.log('Rango de fechas configurado:', {
          año: currentYear,
          mesActual: currentMonth,
          rangoDesde: startDate.toISOString(),
          rangoHasta: endDate.toISOString(),
          descripcion: `Enero a ${new Date(currentYear, currentMonth - 2, 1).toLocaleDateString('es-ES', { month: 'long' })} ${currentYear}`
        });

        // Usar la función RPC segura que ya existe en la base de datos
        const { data: serviceData, error } = await supabase.rpc('get_finalized_services_data_secure', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

        if (error) {
          console.error('Error al obtener servicios con función segura:', error);
          throw error;
        }

        console.log('Datos obtenidos con función segura:', serviceData);

        if (!serviceData || !Array.isArray(serviceData) || serviceData.length === 0) {
          console.warn('No se encontraron datos usando la función segura');
          return {
            uniqueServices: 0,
            totalGmv: 0,
            currentMonth,
            currentYear,
            debugInfo: { 
              totalFromDB: 0, 
              dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
              source: 'secure_function'
            }
          };
        }

        // La función devuelve los datos agregados directamente
        const result = serviceData[0];

        const response = {
          uniqueServices: Number(result.total_services) || 0,
          totalGmv: Number(result.total_gmv) || 0,
          currentMonth,
          currentYear,
          debugInfo: {
            totalFromDB: Number(result.service_count) || 0,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            source: 'secure_function'
          }
        };

        console.log('=== RESULTADO FINAL (FUNCIÓN SEGURA) ===');
        console.log('Servicios únicos encontrados:', response.uniqueServices);
        console.log('GMV total calculado:', response.totalGmv);
        console.log('Debug info completo:', response.debugInfo);
        console.log('=== FIN DEBUG FORECAST ===');

        return response;
      } catch (error) {
        console.error('Error en consulta con función segura:', error);
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

    // Usar datos reales de la función segura
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
