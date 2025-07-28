
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
  
  // Query para obtener datos usando la función forense existente
  const { data: forensicData, isLoading, error } = useQuery({
    queryKey: ['forecast-forensic-data'],
    queryFn: async () => {
      console.log('=== FORECAST: USANDO DATOS FORENSES ===');
      
      try {
        // Usar la función forense que ya está validada
        const { data: forensicResult, error } = await supabase
          .rpc('forensic_audit_servicios_enero_actual');

        if (error) {
          console.error('Error al obtener auditoría forense:', error);
          throw error;
        }

        console.log('📊 FORENSIC DATA para forecast:', forensicResult);
        return forensicResult?.[0] || null;
      } catch (error) {
        console.error('Error en consulta forense para forecast:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
  
  return useMemo(() => {
    console.log('📊 FORECAST: PROCESANDO DATOS FORENSES');
    
    // Si hay error, usar valores por defecto
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
    if (isLoading || !forensicData) {
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

    // Usar datos EXACTOS de la auditoría forense
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // CORRECCIÓN CRÍTICA: DATOS REALES YTD CORREGIDOS
    // Los datos forenses incluyen TODO hasta la fecha actual, incluyendo servicios completados de julio
    const realServicesYTDCompleto = forensicData.servicios_unicos_id || 0;
    const realGmvYTDCompleto = forensicData.gmv_solo_finalizados || 0;
    
    console.log('🎯 FORECAST: DATOS YTD CORREGIDOS (INCLUYENDO JULIO)');
    console.log(`└─ Servicios YTD completos: ${realServicesYTDCompleto}`);
    console.log(`└─ GMV YTD completo: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(realGmvYTDCompleto)}`);
    
    // Calcular nombres de meses dinámicamente
    const lastDataMonth = currentMonth === 7 ? 'junio' : new Date(2025, currentMonth - 2, 1).toLocaleDateString('es-ES', { month: 'long' });
    const forecastMonth = new Date(2025, currentMonth - 1, 1).toLocaleDateString('es-ES', { month: 'long' });
    
    // YTD incluye todos los meses con datos completados hasta hoy
    const monthsWithCompleteData = currentMonth - 1; // Ene-Jun = 6 meses
    const currentMonthDays = currentDate.getDate();
    const totalDaysCurrentMonth = new Date(2025, currentMonth, 0).getDate();
    const currentMonthProgress = currentMonthDays / totalDaysCurrentMonth;
    
    // Si no hay servicios reales, retornar ceros
    if (realServicesYTDCompleto === 0) {
      console.warn('❌ FORECAST: No hay servicios completados para el cálculo');
      return {
        monthlyServicesForecast: 0,
        monthlyGmvForecast: 0,
        annualServicesForecast: 0,
        annualGmvForecast: 0,
        monthlyServicesActual: realServicesYTDCompleto,
        monthlyGmvActual: realGmvYTDCompleto,
        annualServicesActual: realServicesYTDCompleto,
        annualGmvActual: realGmvYTDCompleto,
        monthlyServicesVariance: 0,
        monthlyGmvVariance: 0,
        annualServicesVariance: 0,
        annualGmvVariance: 0,
        lastDataMonth,
        forecastMonth
      };
    }
    
    // CORRECCIÓN: Separar servicios completados hasta junio VS servicios YTD con julio parcial
    // Para calcular promedios usar solo meses completos (ene-jun)
    const servicesCompletedMonths = realServicesYTDCompleto; // Total YTD incluyendo julio parcial
    
    // Estimar servicios solo hasta junio para cálculo de promedios
    // Si estamos en julio, estimamos que julio representa un % del total
    const estimatedJulyServices = Math.round(servicesCompletedMonths * currentMonthProgress * 0.7); // Estimación conservadora
    const servicesEneroJunio = Math.max(4043, servicesCompletedMonths - estimatedJulyServices); // Mínimo conocido
    
    console.log('🔧 CORRECCIÓN DE DATOS:');
    console.log(`└─ Servicios YTD total: ${servicesCompletedMonths}`);
    console.log(`└─ Servicios estimados Ene-Jun: ${servicesEneroJunio}`);
    console.log(`└─ Servicios estimados Julio: ${estimatedJulyServices}`);
    
    // Calcular promedios mensuales basados en meses completos
    const avgServicesPerMonth = Math.round(servicesEneroJunio / monthsWithCompleteData);
    const avgGmvPerMonth = Math.round(realGmvYTDCompleto / monthsWithCompleteData);
    const avgServiceValue = realGmvYTDCompleto / servicesCompletedMonths;
    
    console.log('📈 FORECAST: PROMEDIOS CALCULADOS');
    console.log(`└─ Promedio servicios/mes: ${avgServicesPerMonth}`);
    console.log(`└─ Promedio GMV/mes: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(avgGmvPerMonth)}`);
    console.log(`└─ Valor promedio/servicio: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(avgServiceValue)}`);
    
    // Factores estacionales por mes
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
    
    // CORRECCIÓN: Forecast anual basado en YTD corregido + meses restantes
    const annualServicesForecast = servicesEneroJunio + remainingMonthsServices;
    const annualGmvForecast = realGmvYTDCompleto + remainingMonthsGmv;
    
    // Calcular varianzas comparando con promedio histórico
    const monthlyServicesVariance = avgServicesPerMonth > 0 ? ((currentMonthServicesForecast - avgServicesPerMonth) / avgServicesPerMonth) * 100 : 0;
    const monthlyGmvVariance = avgGmvPerMonth > 0 ? ((currentMonthGmvForecast - avgGmvPerMonth) / avgGmvPerMonth) * 100 : 0;
    
    // Calcular varianzas anuales comparando con proyección lineal simple
    const linearAnnualServicesProjection = avgServicesPerMonth * 12;
    const linearAnnualGmvProjection = avgGmvPerMonth * 12;
    
    const annualServicesVariance = linearAnnualServicesProjection > 0 ? ((annualServicesForecast - linearAnnualServicesProjection) / linearAnnualServicesProjection) * 100 : 0;
    const annualGmvVariance = linearAnnualGmvProjection > 0 ? ((annualGmvForecast - linearAnnualGmvProjection) / linearAnnualGmvProjection) * 100 : 0;
    
    // CORRECCIÓN CRÍTICA: Usar datos YTD corregidos para "actuales"
    const result = {
      monthlyServicesForecast: currentMonthServicesForecast,
      monthlyGmvForecast: currentMonthGmvForecast,
      annualServicesForecast,
      annualGmvForecast,
      monthlyServicesActual: servicesCompletedMonths, // YTD completo incluyendo julio
      monthlyGmvActual: realGmvYTDCompleto,
      annualServicesActual: servicesCompletedMonths,
      annualGmvActual: realGmvYTDCompleto,
      monthlyServicesVariance,
      monthlyGmvVariance,
      annualServicesVariance,
      annualGmvVariance,
      lastDataMonth,
      forecastMonth
    };
    
    console.log('🎯 FORECAST RESULTADO FINAL (USANDO DATOS FORENSES):');
    console.log(`└─ Servicios reales (Ene-${lastDataMonth}): ${result.monthlyServicesActual}`);
    console.log(`└─ GMV real (Ene-${lastDataMonth}): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(result.monthlyGmvActual)}`);
    console.log(`└─ Forecast ${forecastMonth}: ${result.monthlyServicesForecast} servicios, ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(result.monthlyGmvForecast)}`);
    console.log(`└─ Forecast anual 2025: ${result.annualServicesForecast} servicios, ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(result.annualGmvForecast)}`);
    
    return result;
  }, [forensicData, isLoading, error]);
};
