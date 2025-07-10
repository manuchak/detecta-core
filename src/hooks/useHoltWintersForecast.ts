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
      
      const historicalData = (data || []) as Array<{
        year: number;
        month: number;
        services: number;
        gmv: number;
        services_completed: number;
      }>;
      
      console.log('📊 DATOS HISTÓRICOS OBTENIDOS:', historicalData.length, 'puntos de datos');
      return historicalData.map(d => ({
        year: d.year,
        month: d.month,
        services: d.services,
        gmv: Number(d.gmv),
        services_completed: d.services_completed
      }));
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
  
  // Limpiar y validar datos
  const cleanData = data.map(d => Math.max(0, d || 0));
  
  // Optimizar parámetros usando grid search más fino y amplio
  let bestMAPE = Infinity;
  let bestParams = { alpha: 0.3, beta: 0.1, gamma: 0.1 };
  let bestResult: HoltWintersResult | null = null;
  
  // Grid search optimizado basado en mejores prácticas
  // Alpha: 0.1-0.9 (nivel/smoothing principal)
  // Beta: 0.0-0.5 (tendencia)  
  // Gamma: 0.1-0.9 (estacionalidad)
  const alphaValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const betaValues = [0.0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5];
  const gammaValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  
  for (const alpha of alphaValues) {
    for (const beta of betaValues) {
      for (const gamma of gammaValues) {
        try {
          const result = holtWintersCalculation(cleanData, seasonLength, forecastPeriods, alpha, beta, gamma);
          if (result.parameters.mape < bestMAPE && !isNaN(result.parameters.mape)) {
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
  
  console.log(`🎯 HOLT-WINTERS: Mejores parámetros encontrados - α:${bestParams.alpha}, β:${bestParams.beta}, γ:${bestParams.gamma}, MAPE:${bestMAPE.toFixed(2)}%`);
  
  return bestResult || holtWintersCalculation(cleanData, seasonLength, forecastPeriods, 0.3, 0.1, 0.1);
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
  
  // Inicialización mejorada según mejores prácticas
  const level: number[] = new Array(n);
  const trend: number[] = new Array(n);
  const seasonal: number[] = new Array(n + seasonLength);
  
  // Validar que tenemos suficientes datos para inicialización
  if (n < seasonLength * 2) {
    throw new Error('Datos insuficientes para inicialización estacional');
  }
  
  // Calcular valores iniciales de estacionalidad (método mejorado)
  for (let i = 0; i < seasonLength; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i; j < n; j += seasonLength) {
      if (data[j] > 0) { // Solo considerar valores positivos
        sum += data[j];
        count++;
      }
    }
    const avgForSeason = count > 0 ? sum / count : 1;
    
    // Calcular promedio general más robusto
    let totalSum = 0;
    let totalCount = 0;
    for (let k = 0; k < Math.min(n, seasonLength * 3); k++) {
      if (data[k] > 0) {
        totalSum += data[k];
        totalCount++;
      }
    }
    const totalAvg = totalCount > 0 ? totalSum / totalCount : avgForSeason;
    
    // Evitar división por cero y valores extremos
    seasonal[i] = totalAvg > 0 ? Math.max(0.1, Math.min(10, avgForSeason / totalAvg)) : 1;
  }
  
  // Nivel inicial (promedio más robusto de la primera temporada)
  let firstSeasonSum = 0;
  let firstSeasonCount = 0;
  for (let i = 0; i < seasonLength && i < n; i++) {
    if (data[i] > 0) {
      firstSeasonSum += data[i];
      firstSeasonCount++;
    }
  }
  level[0] = firstSeasonCount > 0 ? firstSeasonSum / firstSeasonCount : 1;
  
  // Tendencia inicial corregida (sin dividir por seasonLength)
  let secondSeasonSum = 0;
  let secondSeasonCount = 0;
  for (let i = seasonLength; i < seasonLength * 2 && i < n; i++) {
    if (data[i] > 0) {
      secondSeasonSum += data[i];
      secondSeasonCount++;
    }
  }
  const firstSeasonAvg = firstSeasonCount > 0 ? firstSeasonSum / firstSeasonCount : level[0];
  const secondSeasonAvg = secondSeasonCount > 0 ? secondSeasonSum / secondSeasonCount : firstSeasonAvg;
  
  // Tendencia inicial = diferencia promedio por período (no dividir por seasonLength)
  trend[0] = (secondSeasonAvg - firstSeasonAvg);
  
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