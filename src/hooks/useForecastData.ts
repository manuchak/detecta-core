
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
  
  // Query para obtener servicios finalizados de enero a mayo 2025
  const { data: realData, isLoading } = useQuery({
    queryKey: ['forecast-real-data'],
    queryFn: async () => {
      console.log('Obteniendo datos reales de servicios finalizados...');
      
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('id_servicio, cobro_cliente, fecha_hora_cita')
        .eq('estado', 'Finalizado')
        .gte('fecha_hora_cita', '2025-01-01T00:00:00.000Z')
        .lte('fecha_hora_cita', '2025-05-31T23:59:59.999Z')
        .not('id_servicio', 'is', null)
        .not('cobro_cliente', 'is', null);

      if (error) {
        console.error('Error al obtener datos reales:', error);
        throw error;
      }

      // Conteo distintivo de ID servicios y suma de GMV
      const uniqueServices = new Set(data.map(item => item.id_servicio)).size;
      const totalGmv = data.reduce((sum, item) => sum + (Number(item.cobro_cliente) || 0), 0);

      console.log('Datos reales obtenidos:', {
        serviciosUnicos: uniqueServices,
        gmvTotal: totalGmv,
        registrosTotales: data.length
      });

      return {
        uniqueServices,
        totalGmv,
        rawData: data
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
  
  return useMemo(() => {
    console.log('useForecastData - Calculando forecast con datos:', { 
      realData: realData ? `${realData.uniqueServices} servicios, $${realData.totalGmv}` : 'cargando...',
      isLoading 
    });
    
    // Si aún no tenemos datos reales, usar valores por defecto temporales
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

    // Usar datos reales de la base de datos
    const realServicesJanMay = realData.uniqueServices;
    const realGmvJanMay = realData.totalGmv;
    
    // Calcular promedios mensuales basados en datos reales
    const monthsWithData = 5; // Enero a Mayo
    const avgServicesPerMonth = Math.round(realServicesJanMay / monthsWithData);
    const avgGmvPerMonth = Math.round(realGmvJanMay / monthsWithData);
    const avgServiceValue = realGmvJanMay / realServicesJanMay;
    
    console.log('useForecastData - Datos reales de BDD:', {
      realServicesJanMay,
      realGmvJanMay,
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
    const monthlyServicesVariance = ((juneServicesForecast - avgServicesPerMonth) / avgServicesPerMonth) * 100;
    const monthlyGmvVariance = ((juneGmvForecast - avgGmvPerMonth) / avgGmvPerMonth) * 100;
    
    // Calcular varianzas anuales comparando con proyección lineal simple
    const linearAnnualServicesProjection = avgServicesPerMonth * 12;
    const linearAnnualGmvProjection = avgGmvPerMonth * 12;
    
    const annualServicesVariance = ((annualServicesForecast - linearAnnualServicesProjection) / linearAnnualServicesProjection) * 100;
    const annualGmvVariance = ((annualGmvForecast - linearAnnualGmvProjection) / linearAnnualGmvProjection) * 100;
    
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
    
    console.log('useForecastData - Resultado final con datos reales:', result);
    
    return result;
  }, [realData, isLoading]);
};
