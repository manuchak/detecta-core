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
  
  // Query para obtener servicios usando función bypass segura
  const { data: realData, isLoading, error } = useQuery({
    queryKey: ['forecast-real-data-bypass'],
    queryFn: async () => {
      console.log('Obteniendo datos reales usando bypass RLS...');
      
      try {
        // Usar la función bypass disponible en el sistema
        const { data: allServices, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 1000
        });

        if (error) {
          console.error('Error al obtener servicios:', error);
          throw error;
        }

        console.log('Servicios obtenidos:', allServices?.length || 0);

        if (!allServices || !Array.isArray(allServices) || allServices.length === 0) {
          console.warn('No se encontraron servicios');
          return {
            uniqueServices: 0,
            totalGmv: 0,
            rawData: []
          };
        }

        // Filtrar servicios finalizados del 2025
        const finalizedServices = allServices.filter(service => {
          const isFinalizado = service.estado === 'Finalizado';
          const isYear2025 = service.fecha_hora_cita && 
            new Date(service.fecha_hora_cita).getFullYear() === 2025;
          const hasValidData = service.id_servicio && service.cobro_cliente !== null;
          
          return isFinalizado && isYear2025 && hasValidData;
        });

        console.log('Servicios finalizados 2025:', finalizedServices.length);

        // Obtener servicios únicos y calcular GMV total
        const uniqueServiceIds = new Set();
        let totalGmvCalculated = 0;

        finalizedServices.forEach(service => {
          if (!uniqueServiceIds.has(service.id_servicio)) {
            uniqueServiceIds.add(service.id_servicio);
            totalGmvCalculated += Number(service.cobro_cliente) || 0;
          }
        });

        const result = {
          uniqueServices: uniqueServiceIds.size,
          totalGmv: totalGmvCalculated,
          rawData: finalizedServices
        };

        console.log('Datos procesados:', {
          serviciosUnicos: result.uniqueServices,
          gmvTotal: result.totalGmv,
          formatoGMV: new Intl.NumberFormat('es-MX', { 
            style: 'currency', 
            currency: 'MXN' 
          }).format(result.totalGmv)
        });

        return result;
      } catch (error) {
        console.error('Error en bypass RLS:', error);
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
      totalGmv: realData?.totalGmv
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

    // Usar datos reales de la función bypass
    const realServicesJanMay = realData.uniqueServices;
    const realGmvJanMay = realData.totalGmv;
    
    console.log('useForecastData - Datos reales confirmados:', {
      realServicesJanMay,
      realGmvJanMay,
      formatoGMV: new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
      }).format(realGmvJanMay)
    });
    
    // Si no hay servicios reales, retornar ceros
    if (realServicesJanMay === 0) {
      console.warn('No se encontraron servicios finalizados para el cálculo de forecast');
      return {
        monthlyServicesForecast: 0,
        monthlyGmvForecast: 0,
        annualServicesForecast: 0,
        annualGmvForecast: 0,
        monthlyServicesActual: realServicesJanMay,
        monthlyGmvActual: realGmvJanMay,
        annualServicesActual: realServicesJanMay,
        annualGmvActual: realGmvJanMay,
        monthlyServicesVariance: 0,
        monthlyGmvVariance: 0,
        annualServicesVariance: 0,
        annualGmvVariance: 0,
        lastDataMonth: 'mayo',
        forecastMonth: 'junio'
      };
    }
    
    // Calcular promedios mensuales basados en datos reales
    const monthsWithData = 5; // Enero a Mayo
    const avgServicesPerMonth = Math.round(realServicesJanMay / monthsWithData);
    const avgGmvPerMonth = Math.round(realGmvJanMay / monthsWithData);
    const avgServiceValue = realGmvJanMay / realServicesJanMay;
    
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
    
    // Calcular forecast para junio usando factor estacional
    const juneServicesForecast = Math.round(avgServicesPerMonth * monthlyDistribution[6].factor);
    const juneGmvForecast = Math.round(juneServicesForecast * avgServiceValue);
    
    // Calcular forecast anual usando factores estacionales
    const remainingMonthsServices = Object.keys(monthlyDistribution)
      .filter(month => parseInt(month) > 5)
      .reduce((sum, month) => {
        const monthNum = parseInt(month);
        const forecastServices = Math.round(avgServicesPerMonth * monthlyDistribution[monthNum].factor);
        return sum + forecastServices;
      }, 0);
    
    const remainingMonthsGmv = Math.round(remainingMonthsServices * avgServiceValue);
    
    const annualServicesForecast = realServicesJanMay + remainingMonthsServices;
    const annualGmvForecast = realGmvJanMay + remainingMonthsGmv;
    
    console.log('useForecastData - Forecast calculado:', {
      juneServicesForecast,
      juneGmvForecast,
      remainingMonthsServices,
      remainingMonthsGmv,
      annualServicesForecast,
      annualGmvForecast,
      avgServiceValue
    });
    
    // Calcular varianzas comparando con promedio histórico
    const monthlyServicesVariance = avgServicesPerMonth > 0 ? ((juneServicesForecast - avgServicesPerMonth) / avgServicesPerMonth) * 100 : 0;
    const monthlyGmvVariance = avgGmvPerMonth > 0 ? ((juneGmvForecast - avgGmvPerMonth) / avgGmvPerMonth) * 100 : 0;
    
    // Calcular varianzas anuales comparando con proyección lineal simple
    const linearAnnualServicesProjection = avgServicesPerMonth * 12;
    const linearAnnualGmvProjection = avgGmvPerMonth * 12;
    
    const annualServicesVariance = linearAnnualServicesProjection > 0 ? ((annualServicesForecast - linearAnnualServicesProjection) / linearAnnualServicesProjection) * 100 : 0;
    const annualGmvVariance = linearAnnualGmvProjection > 0 ? ((annualGmvForecast - linearAnnualGmvProjection) / linearAnnualGmvProjection) * 100 : 0;
    
    const result = {
      monthlyServicesForecast: juneServicesForecast,
      monthlyGmvForecast: juneGmvForecast,
      annualServicesForecast,
      annualGmvForecast,
      monthlyServicesActual: realServicesJanMay,
      monthlyGmvActual: realGmvJanMay,
      annualServicesActual: realServicesJanMay,
      annualGmvActual: realGmvJanMay,
      monthlyServicesVariance,
      monthlyGmvVariance,
      annualServicesVariance,
      annualGmvVariance,
      lastDataMonth: 'mayo',
      forecastMonth: 'junio'
    };
    
    console.log('useForecastData - Resultado final:', result);
    
    return result;
  }, [realData, isLoading, error]);
};
