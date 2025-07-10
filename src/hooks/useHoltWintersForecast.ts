import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HistoricalDataPoint {
  year: number;
  month: number;
  services: number;
  gmv: number;
  services_completed: number;
}

interface HoltWintersResult {
  forecast: number[];
  level: number;
  trend: number;
  seasonal: number[];
  parameters: {
    alpha: number;
    beta: number;
    gamma: number;
    mape: number;
  };
}

interface ForecastData {
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
  accuracy: {
    serviceMAPE: number;
    gmvMAPE: number;
    confidence: string;
  };
}

export const useHoltWintersForecast = (): ForecastData => {
  
  // Obtener datos históricos completos
  const { data: historicalData, isLoading, error } = useQuery({
    queryKey: ['holt-winters-historical-data'],
    queryFn: async () => {
      console.log('=== HOLT-WINTERS: OBTENIENDO DATOS HISTÓRICOS ===');
      
      const { data, error } = await supabase
        .rpc('get_historical_monthly_data');
      
      if (error) {
        console.error('Error obteniendo datos históricos:', error);
        throw error;
      }
      
      console.log('📊 DATOS HISTÓRICOS OBTENIDOS:', data?.length || 0, 'puntos de datos');
      return data as HistoricalDataPoint[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  });

  return useMemo(() => {
    if (isLoading || error || !historicalData || historicalData.length < 24) {
      console.warn('❌ HOLT-WINTERS: Datos insuficientes para el modelo');
      return getDefaultForecastData();
    }

    try {
      console.log('🧮 HOLT-WINTERS: INICIANDO CÁLCULOS');
      
      // Preparar series de tiempo
      const servicesTimeSeries = historicalData.map(d => d.services_completed);
      const gmvTimeSeries = historicalData.map(d => d.gmv);
      
      // Aplicar Holt-Winters a servicios y GMV
      const servicesForecast = holtWintersOptimized(servicesTimeSeries, 12, 12); // 12 meses estacionalidad, 12 periodos forecast
      const gmvForecast = holtWintersOptimized(gmvTimeSeries, 12, 12);
      
      // Datos actuales (hasta junio 2025)
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // Calcular datos reales acumulados del año
      const currentYearData = historicalData.filter(d => d.year === currentYear);
      const actualServicesYTD = currentYearData.reduce((sum, d) => sum + d.services_completed, 0);
      const actualGmvYTD = currentYearData.reduce((sum, d) => sum + d.gmv, 0);
      
      // Forecast para el mes actual y anual
      const monthlyServicesForecast = Math.round(servicesForecast.forecast[0] || 0);
      const monthlyGmvForecast = Math.round(gmvForecast.forecast[0] || 0);
      
      // Forecast anual = YTD actual + forecast meses restantes
      const remainingMonths = 12 - (currentMonth - 1);
      const remainingServicesForecast = servicesForecast.forecast.slice(0, remainingMonths).reduce((sum, val) => sum + val, 0);
      const remainingGmvForecast = gmvForecast.forecast.slice(0, remainingMonths).reduce((sum, val) => sum + val, 0);
      
      const annualServicesForecast = Math.round(actualServicesYTD + remainingServicesForecast);
      const annualGmvForecast = Math.round(actualGmvYTD + remainingGmvForecast);
      
      // Calcular varianzas (comparar con promedio histórico)
      const historicalAvgServices = servicesTimeSeries.reduce((sum, val) => sum + val, 0) / servicesTimeSeries.length;
      const historicalAvgGmv = gmvTimeSeries.reduce((sum, val) => sum + val, 0) / gmvTimeSeries.length;
      
      const monthlyServicesVariance = ((monthlyServicesForecast - historicalAvgServices) / historicalAvgServices) * 100;
      const monthlyGmvVariance = ((monthlyGmvForecast - historicalAvgGmv) / historicalAvgGmv) * 100;
      
      // Proyección lineal simple para comparar forecast anual
      const linearAnnualServices = historicalAvgServices * 12;
      const linearAnnualGmv = historicalAvgGmv * 12;
      
      const annualServicesVariance = ((annualServicesForecast - linearAnnualServices) / linearAnnualServices) * 100;
      const annualGmvVariance = ((annualGmvForecast - linearAnnualGmv) / linearAnnualGmv) * 100;
      
      // Nombres de meses
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const lastDataMonth = monthNames[currentMonth - 2] || 'junio';
      const forecastMonth = monthNames[currentMonth - 1] || 'julio';
      
      // Clasificar confianza basada en MAPE
      const getConfidenceLevel = (mape: number): string => {
        if (mape < 10) return 'Muy Alta';
        if (mape < 20) return 'Alta';
        if (mape < 30) return 'Media';
        return 'Baja';
      };
      
      const result = {
        monthlyServicesForecast,
        monthlyGmvForecast,
        annualServicesForecast,
        annualGmvForecast,
        monthlyServicesActual: actualServicesYTD,
        monthlyGmvActual: actualGmvYTD,
        annualServicesActual: actualServicesYTD,
        annualGmvActual: actualGmvYTD,
        monthlyServicesVariance,
        monthlyGmvVariance,
        annualServicesVariance,
        annualGmvVariance,
        lastDataMonth,
        forecastMonth,
        accuracy: {
          serviceMAPE: servicesForecast.parameters.mape,
          gmvMAPE: gmvForecast.parameters.mape,
          confidence: getConfidenceLevel((servicesForecast.parameters.mape + gmvForecast.parameters.mape) / 2)
        }
      };
      
      console.log('🎯 HOLT-WINTERS RESULTADO:');
      console.log(`└─ Forecast ${forecastMonth}: ${monthlyServicesForecast} servicios`);
      console.log(`└─ Forecast anual: ${annualServicesForecast} servicios`);
      console.log(`└─ Precisión servicios MAPE: ${servicesForecast.parameters.mape.toFixed(2)}%`);
      console.log(`└─ Precisión GMV MAPE: ${gmvForecast.parameters.mape.toFixed(2)}%`);
      console.log(`└─ Confianza: ${result.accuracy.confidence}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en Holt-Winters:', error);
      return getDefaultForecastData();
    }
  }, [historicalData, isLoading, error]);
};

// Implementación optimizada de Holt-Winters
function holtWintersOptimized(data: number[], seasonLength: number, forecastPeriods: number): HoltWintersResult {
  if (data.length < seasonLength * 2) {
    throw new Error('Datos insuficientes para Holt-Winters');
  }
  
  // Optimizar parámetros usando grid search
  let bestMAPE = Infinity;
  let bestParams = { alpha: 0.3, beta: 0.1, gamma: 0.1 };
  let bestResult: HoltWintersResult | null = null;
  
  // Grid search para encontrar mejores parámetros
  for (let alpha = 0.1; alpha <= 0.9; alpha += 0.2) {
    for (let beta = 0.1; beta <= 0.3; beta += 0.1) {
      for (let gamma = 0.1; gamma <= 0.3; gamma += 0.1) {
        try {
          const result = holtWintersCalculation(data, seasonLength, forecastPeriods, alpha, beta, gamma);
          if (result.parameters.mape < bestMAPE) {
            bestMAPE = result.parameters.mape;
            bestParams = { alpha, beta, gamma };
            bestResult = result;
          }
        } catch (e) {
          continue;
        }
      }
    }
  }
  
  return bestResult || holtWintersCalculation(data, seasonLength, forecastPeriods, 0.3, 0.1, 0.1);
}

function holtWintersCalculation(
  data: number[], 
  seasonLength: number, 
  forecastPeriods: number, 
  alpha: number, 
  beta: number, 
  gamma: number
): HoltWintersResult {
  
  const n = data.length;
  
  // Inicialización
  const level: number[] = new Array(n);
  const trend: number[] = new Array(n);
  const seasonal: number[] = new Array(n + seasonLength);
  
  // Calcular valores iniciales de estacionalidad
  for (let i = 0; i < seasonLength; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i; j < n; j += seasonLength) {
      sum += data[j];
      count++;
    }
    const avgForSeason = sum / count;
    
    let totalAvg = data.slice(0, seasonLength * 2).reduce((sum, val) => sum + val, 0) / (seasonLength * 2);
    seasonal[i] = avgForSeason / totalAvg;
  }
  
  // Nivel inicial (promedio de los primeros 12 meses)
  level[0] = data.slice(0, seasonLength).reduce((sum, val) => sum + val, 0) / seasonLength;
  
  // Tendencia inicial
  const firstSeasonAvg = data.slice(0, seasonLength).reduce((sum, val) => sum + val, 0) / seasonLength;
  const secondSeasonAvg = data.slice(seasonLength, seasonLength * 2).reduce((sum, val) => sum + val, 0) / seasonLength;
  trend[0] = (secondSeasonAvg - firstSeasonAvg) / seasonLength;
  
  // Aplicar Holt-Winters
  for (let i = 1; i < n; i++) {
    const seasonalIndex = (i - 1) % seasonLength;
    
    // Nivel
    level[i] = alpha * (data[i] / seasonal[seasonalIndex]) + (1 - alpha) * (level[i - 1] + trend[i - 1]);
    
    // Tendencia
    trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
    
    // Estacionalidad
    seasonal[i] = gamma * (data[i] / level[i]) + (1 - gamma) * seasonal[seasonalIndex];
  }
  
  // Generar forecast
  const forecast: number[] = [];
  const finalLevel = level[n - 1];
  const finalTrend = trend[n - 1];
  
  for (let h = 1; h <= forecastPeriods; h++) {
    const seasonalIndex = (n - 1 + h) % seasonLength;
    const forecastValue = (finalLevel + h * finalTrend) * seasonal[seasonalIndex];
    forecast.push(Math.max(0, forecastValue)); // Evitar valores negativos
  }
  
  // Calcular MAPE (Mean Absolute Percentage Error)
  let mapeSum = 0;
  let mapeCount = 0;
  
  for (let i = seasonLength; i < n; i++) {
    const seasonalIndex = (i - 1) % seasonLength;
    const predicted = (level[i - 1] + trend[i - 1]) * seasonal[seasonalIndex];
    const actual = data[i];
    
    if (actual > 0) {
      mapeSum += Math.abs((actual - predicted) / actual);
      mapeCount++;
    }
  }
  
  const mape = mapeCount > 0 ? (mapeSum / mapeCount) * 100 : 50;
  
  return {
    forecast,
    level: finalLevel,
    trend: finalTrend,
    seasonal: seasonal.slice(0, seasonLength),
    parameters: { alpha, beta, gamma, mape }
  };
}

function getDefaultForecastData(): ForecastData {
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
    lastDataMonth: 'junio',
    forecastMonth: 'julio',
    accuracy: {
      serviceMAPE: 0,
      gmvMAPE: 0,
      confidence: 'Sin datos'
    }
  };
}