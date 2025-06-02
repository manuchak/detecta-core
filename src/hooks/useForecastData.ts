
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
  
  // Query para obtener servicios usando función bypass con rango dinámico
  const { data: realData, isLoading, error } = useQuery({
    queryKey: ['forecast-real-data-bypass'],
    queryFn: async () => {
      console.log('Obteniendo datos reales usando bypass RLS...');
      
      try {
        // Usar la función bypass con límite aumentado
        const { data: allServices, error } = await supabase.rpc('bypass_rls_get_servicios', {
          max_records: 25000
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
            rawData: [],
            currentMonth: new Date().getMonth() + 1,
            currentYear: new Date().getFullYear()
          };
        }

        // Calcular rango dinámico: desde enero hasta mes anterior al actual
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const startDate = new Date(currentYear, 0, 1); // 1 enero del año actual
        const endDate = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59); // Último día del mes anterior
        
        console.log('Rango de fechas:', {
          año: currentYear,
          mesActual: currentMonth,
          rangoDesde: startDate.toISOString(),
          rangoHasta: endDate.toISOString(),
          descripcion: `Enero a ${new Date(currentYear, currentMonth - 2, 1).toLocaleDateString('es-ES', { month: 'long' })} ${currentYear}`
        });

        // Filtrar servicios finalizados en el rango de fechas
        const finalizedServices = allServices.filter(service => {
          const isFinalizado = service.estado === 'Finalizado';
          const hasValidDate = service.fecha_hora_cita;
          const hasValidData = service.id_servicio && service.cobro_cliente !== null;
          
          if (!isFinalizado || !hasValidDate || !hasValidData) {
            return false;
          }
          
          const serviceDate = new Date(service.fecha_hora_cita);
          const isInDateRange = serviceDate >= startDate && serviceDate <= endDate;
          
          return isInDateRange;
        });

        console.log('Servicios finalizados en rango:', finalizedServices.length);

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
          rawData: finalizedServices,
          currentMonth,
          currentYear
        };

        console.log('Datos procesados:', {
          serviciosUnicos: result.uniqueServices,
          gmvTotal: result.totalGmv,
          formatoGMV: new Intl.NumberFormat('es-MX', { 
            style: 'currency', 
            currency: 'MXN' 
          }).format(result.totalGmv),
          rangoEvaluado: `Enero-${new Date(currentYear, currentMonth - 2, 1).toLocaleDateString('es-ES', { month: 'long' })} ${currentYear}`
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
