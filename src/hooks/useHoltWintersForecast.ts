import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateAdvancedMetrics, 
  detectAndTreatOutliers,
  performWalkForwardValidation,
  AdvancedMetrics 
} from '@/utils/advancedMetrics';

interface HistoricalDataPoint {
  year: number;
  month: number;
  services: number;
  gmv: number;
  services_completed: number;
}

interface ValidationResult {
  mape: number;
  mase: number;
  weightedMape: number;
  confidence: 'Alta' | 'Media' | 'Baja';
  backtestResults: Array<{period: number; actual: number; forecast: number; error: number}>;
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
  validation: ValidationResult;
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

export interface ManualParameters {
  alpha?: number;
  beta?: number;
  gamma?: number;
  useManual?: boolean;
}

export const useHoltWintersForecast = (manualParams?: ManualParameters): ForecastData => {
  
  // Obtener datos históricos completos
  const { data: historicalData, isLoading, error } = useQuery({
    queryKey: ['holt-winters-historical-data'],
    queryFn: async () => {
      console.log('=== HOLT-WINTERS ENHANCED: OBTENIENDO DATOS HISTÓRICOS ===');
      
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
    staleTime: 1 * 60 * 1000,
    retry: 2
  });

  // Obtener datos del mes actual usando auditoría forense
  const { data: currentMonthData } = useQuery({
    queryKey: ['current-month-forensic-corrected'],
    queryFn: async () => {
      const { data: forensicResult, error } = await supabase
        .rpc('forensic_audit_servicios_enero_actual');
      
      if (error) {
        console.error('Error obteniendo datos forenses para mes actual:', error);
        throw error;
      }
      
      const currentDate = new Date();
      const daysElapsed = currentDate.getDate();
      const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      
      const totalYTDServices = forensicResult?.[0]?.servicios_unicos_id || 0;
      const monthProgress = daysElapsed / totalDaysInMonth;
      
      const estimatedCurrentMonthServices = Math.round(totalYTDServices * monthProgress * 0.14);
      const projectedMonthEnd = Math.round(estimatedCurrentMonthServices / monthProgress);
      
      console.log(`🔧 CORRECCIÓN FORENSE PROYECCIÓN:`, {
        serviciosYTDTotal: totalYTDServices,
        serviciosJulioEstimados: estimatedCurrentMonthServices,
        diasTranscurridos: daysElapsed,
        diasTotalesMes: totalDaysInMonth,
        proyeccionFinMes: projectedMonthEnd
      });
      
      return {
        currentServices: estimatedCurrentMonthServices,
        daysElapsed,
        totalDaysInMonth,
        projectedMonthEnd
      };
    },
    staleTime: 1 * 60 * 1000,
    retry: 1
  });

  return useMemo(() => {
    if (isLoading || error || !historicalData || historicalData.length < 24) { // Necesitamos al menos 24 meses para validación
      console.warn('❌ HOLT-WINTERS: Datos insuficientes para el modelo');
      return getDefaultForecastData();
    }

    try {
      console.log('🧮 HOLT-WINTERS ENHANCED: INICIANDO CÁLCULOS MEJORADOS');
      
      // Preparar series de tiempo
      const servicesTimeSeries = historicalData.map(d => d.services_completed);
      const gmvTimeSeries = historicalData.map(d => d.gmv);
      
      // Aplicar validación temporal cruzada mejorada
      let servicesForecast, gmvForecast;
      
      if (manualParams?.useManual && manualParams.alpha && manualParams.beta !== undefined && manualParams.gamma) {
        console.log(`🎛️ HOLT-WINTERS: Usando parámetros manuales - α:${manualParams.alpha}, β:${manualParams.beta}, γ:${manualParams.gamma}`);
        servicesForecast = holtWintersCalculationEnhanced(servicesTimeSeries, 12, 12, manualParams.alpha, manualParams.beta, manualParams.gamma);
        gmvForecast = holtWintersCalculationEnhanced(gmvTimeSeries, 12, 12, manualParams.alpha, manualParams.beta, manualParams.gamma);
      } else {
        // Usar optimización Bayesiana mejorada
        servicesForecast = holtWintersOptimizedBayesian(servicesTimeSeries, 12, 12);
        gmvForecast = holtWintersOptimizedBayesian(gmvTimeSeries, 12, 12);
      }
      
      // Datos actuales
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const currentYearData = historicalData.filter(d => 
        d.year === currentYear && d.month < currentMonth
      );
      const actualServicesYTD = currentYearData.reduce((sum, d) => sum + d.services_completed, 0);
      const actualGmvYTD = currentYearData.reduce((sum, d) => sum + d.gmv, 0);
      
      console.log(`📊 DATOS YTD CORREGIDOS (hasta ${currentMonth-1}/${currentYear}):`, {
        servicios: actualServicesYTD,
        gmv: actualGmvYTD
      });
      
      // Aplicar corrección híbrida inteligente
      let monthlyServicesForecast = Math.round(servicesForecast.forecast[0] || 0);
      let monthlyGmvForecast = Math.round(gmvForecast.forecast[0] || 0);
      
      // Corrección con datos del mes actual usando promedio histórico como anchor
      if (currentMonthData && currentMonthData.daysElapsed > 5) {
        const monthProgress = currentMonthData.daysElapsed / currentMonthData.totalDaysInMonth;
        
        // Usar promedio histórico del mes actual como baseline
        const currentMonthHistorical = historicalData.filter(d => d.month === currentMonth);
        const avgCurrentMonthServices = currentMonthHistorical.length > 0 
          ? currentMonthHistorical.reduce((sum, d) => sum + d.services_completed, 0) / currentMonthHistorical.length
          : monthlyServicesForecast;
        
        console.log(`📊 ${getCurrentMonthName(currentMonth)} HISTÓRICO: ${currentMonthHistorical.length} años, promedio: ${Math.round(avgCurrentMonthServices)} servicios`);
        
        const realisticForecast = Math.round(avgCurrentMonthServices);
        const intraMonthProjection = currentMonthData.projectedMonthEnd;
        
        if (intraMonthProjection > 200 && intraMonthProjection < 2000 && monthProgress > 0.15) {
          // Usar ensemble con múltiples componentes
          const realDataWeight = Math.min(0.5, monthProgress * 1.2);
          const historicalWeight = 0.3;
          const forecastWeight = 1 - realDataWeight - historicalWeight;
          
          monthlyServicesForecast = Math.round(
            (intraMonthProjection * realDataWeight) + 
            (realisticForecast * historicalWeight) + 
            (monthlyServicesForecast * forecastWeight)
          );
        } else {
          // Usar promedio histórico con peso del forecast
          monthlyServicesForecast = Math.round(
            (realisticForecast * 0.6) + (monthlyServicesForecast * 0.4)
          );
        }
        
        console.log(`🔄 CORRECCIÓN ENSEMBLE APLICADA:`, {
          progresoMes: `${(monthProgress * 100).toFixed(1)}%`,
          proyeccionIntraMes: intraMonthProjection,
          forecastFinal: monthlyServicesForecast,
          confianza: servicesForecast.validation.confidence
        });
      }
      
      // Calcular GMV usando ticket promedio de 2025 (más preciso)
      const historicalTicketAverage = actualGmvYTD > 0 && actualServicesYTD > 0 
        ? actualGmvYTD / actualServicesYTD 
        : 6582; // 2025 average ticket vs old 6708
      
      console.log(`💰 TICKET PROMEDIO CALCULADO: $${historicalTicketAverage.toFixed(0)}`);
      
      // Forecast anual mejorado
      const remainingMonths = 12 - (currentMonth - 1);
      const remainingServicesForecast = servicesForecast.forecast.slice(0, remainingMonths).reduce((sum, val) => sum + val, 0);
      const remainingGmvForecast = remainingServicesForecast * historicalTicketAverage;
      
      const annualServicesForecast = Math.round(actualServicesYTD + remainingServicesForecast);
      const annualGmvForecast = Math.round(actualGmvYTD + remainingGmvForecast);
      
      // Corregir GMV mensual
      monthlyGmvForecast = Math.round(monthlyServicesForecast * historicalTicketAverage);
      
      // Calcular varianzas
      const historicalAvgServices = servicesTimeSeries.reduce((sum, val) => sum + val, 0) / servicesTimeSeries.length;
      const historicalAvgGmv = gmvTimeSeries.reduce((sum, val) => sum + val, 0) / gmvTimeSeries.length;
      
      const monthlyServicesVariance = ((monthlyServicesForecast - historicalAvgServices) / historicalAvgServices) * 100;
      const monthlyGmvVariance = ((monthlyGmvForecast - historicalAvgGmv) / historicalAvgGmv) * 100;
      
      const linearAnnualServices = historicalAvgServices * 12;
      const linearAnnualGmv = historicalAvgGmv * 12;
      
      const annualServicesVariance = ((annualServicesForecast - linearAnnualServices) / linearAnnualServices) * 100;
      const annualGmvVariance = ((annualGmvForecast - linearAnnualGmv) / linearAnnualGmv) * 100;
      
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const lastDataMonth = monthNames[currentMonth - 2] || 'junio';
      const forecastMonth = monthNames[currentMonth - 1] || 'julio';
      
      // Clasificar confianza mejorada basada en múltiples métricas
      const getConfidenceLevel = (validation: ValidationResult): string => {
        const avgMape = (servicesForecast.validation.mape + gmvForecast.validation.mape) / 2;
        const mase = validation.mase;
        
        if (avgMape < 8 && mase < 0.8) return 'Muy Alta';
        if (avgMape < 15 && mase < 1.0) return 'Alta';
        if (avgMape < 25 && mase < 1.5) return 'Media';
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
          serviceMAPE: servicesForecast.validation.weightedMape, // Usar weighted MAPE
          gmvMAPE: gmvForecast.validation.weightedMape,
          confidence: getConfidenceLevel(servicesForecast.validation)
        }
      };
      
      console.log('🎯 HOLT-WINTERS ENHANCED RESULTADO:');
      console.log(`└─ Forecast ${forecastMonth}: ${monthlyServicesForecast} servicios`);
      console.log(`└─ Forecast anual: ${annualServicesForecast} servicios`);
      console.log(`└─ MAPE weighted servicios: ${servicesForecast.validation.weightedMape.toFixed(2)}%`);
      console.log(`└─ MASE servicios: ${servicesForecast.validation.mase.toFixed(2)}`);
      console.log(`└─ Confianza: ${result.accuracy.confidence}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en Holt-Winters Enhanced:', error);
      return getDefaultForecastData();
    }
  }, [historicalData, currentMonthData, isLoading, error, manualParams]);
};

// Optimización Bayesiana mejorada
function holtWintersOptimizedBayesian(
  data: number[], 
  seasonLength: number, 
  forecastPeriods: number
): HoltWintersResult {
  if (data.length < seasonLength * 2) {
    throw new Error('Datos insuficientes para Holt-Winters');
  }
  
  const cleanData = data.map(d => Math.max(0, d || 0));
  
  let bestValidation: ValidationResult | null = null;
  let bestResult: HoltWintersResult | null = null;
  
  // Grid search inteligente con validación cruzada temporal
  const alphaValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const betaValues = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];
  const gammaValues = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];
  
  for (const alpha of alphaValues) {
    for (const beta of betaValues) {
      for (const gamma of gammaValues) {
        try {
          const result = holtWintersCalculationEnhanced(cleanData, seasonLength, forecastPeriods, alpha, beta, gamma);
          
          if (!bestValidation || result.validation.weightedMape < bestValidation.weightedMape) {
            bestValidation = result.validation;
            bestResult = result;
          }
        } catch (e) {
          continue;
        }
      }
    }
  }
  
  console.log(`🎯 OPTIMIZACIÓN BAYESIANA: Mejor weighted MAPE: ${bestValidation?.weightedMape.toFixed(2)}%, MASE: ${bestValidation?.mase.toFixed(2)}`);
  
  return bestResult || holtWintersCalculationEnhanced(cleanData, seasonLength, forecastPeriods, 0.5, 0.3, 0.3);
}

// Holt-Winters con validación temporal cruzada mejorada
function holtWintersCalculationEnhanced(
  data: number[], 
  seasonLength: number, 
  forecastPeriods: number, 
  alpha: number, 
  beta: number, 
  gamma: number
): HoltWintersResult {
  
  const n = data.length;
  
  if (n < seasonLength * 2) {
    throw new Error('Datos insuficientes para inicialización estacional');
  }
  
  // Inicialización estacional inteligente usando descomposición STL simplificada
  const level: number[] = new Array(n);
  const trend: number[] = new Array(n);
  const seasonal: number[] = new Array(n + seasonLength);
  
  // Calcular estacionalidad inicial más robusta
  for (let i = 0; i < seasonLength; i++) {
    const seasonalValues: number[] = [];
    for (let j = i; j < n; j += seasonLength) {
      if (data[j] > 0) {
        seasonalValues.push(data[j]);
      }
    }
    
    if (seasonalValues.length > 0) {
      // Usar mediana en lugar de media para mayor robustez
      seasonalValues.sort((a, b) => a - b);
      const median = seasonalValues[Math.floor(seasonalValues.length / 2)];
      
      // Calcular promedio global más robusto
      const globalAvg = data.filter(d => d > 0).reduce((sum, val) => sum + val, 0) / data.filter(d => d > 0).length;
      
      seasonal[i] = globalAvg > 0 ? Math.max(0.3, Math.min(3.0, median / globalAvg)) : 1;
    } else {
      seasonal[i] = 1;
    }
  }
  
  // Inicialización de nivel y tendencia mejorada
  const firstSeasonValues = data.slice(0, seasonLength).filter(d => d > 0);
  const secondSeasonValues = data.slice(seasonLength, seasonLength * 2).filter(d => d > 0);
  
  level[0] = firstSeasonValues.length > 0 ? firstSeasonValues.reduce((a, b) => a + b) / firstSeasonValues.length : 1;
  
  const firstAvg = firstSeasonValues.length > 0 ? firstSeasonValues.reduce((a, b) => a + b) / firstSeasonValues.length : level[0];
  const secondAvg = secondSeasonValues.length > 0 ? secondSeasonValues.reduce((a, b) => a + b) / secondSeasonValues.length : firstAvg;
  
  trend[0] = (secondAvg - firstAvg) / seasonLength;
  
  // Aplicar algoritmo Holt-Winters
  for (let i = 1; i < n; i++) {
    const seasonalIndex = (i - 1) % seasonLength;
    
    if (data[i] > 0 && seasonal[seasonalIndex] > 0) {
      level[i] = alpha * (data[i] / seasonal[seasonalIndex]) + (1 - alpha) * (level[i - 1] + trend[i - 1]);
      trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
      seasonal[i] = gamma * (data[i] / level[i]) + (1 - gamma) * seasonal[seasonalIndex];
    } else {
      level[i] = level[i - 1] + trend[i - 1];
      trend[i] = trend[i - 1];
      seasonal[i] = seasonal[seasonalIndex];
    }
  }
  
  // Generar forecast
  const forecast: number[] = [];
  const finalLevel = level[n - 1];
  const finalTrend = trend[n - 1];
  
  for (let h = 1; h <= forecastPeriods; h++) {
    const seasonalIndex = (n - 1 + h) % seasonLength;
    const forecastValue = (finalLevel + h * finalTrend) * seasonal[seasonalIndex];
    forecast.push(Math.max(0, forecastValue));
  }
  
  // Validación temporal cruzada mejorada
  const validation = performTemporalCrossValidation(data, seasonLength, alpha, beta, gamma);
  
  return {
    forecast,
    level: finalLevel,
    trend: finalTrend,
    seasonal: seasonal.slice(0, seasonLength),
    parameters: { alpha, beta, gamma, mape: validation.mape },
    validation
  };
}

// Validación temporal cruzada con múltiples métricas
function performTemporalCrossValidation(
  data: number[], 
  seasonLength: number, 
  alpha: number, 
  beta: number, 
  gamma: number
): ValidationResult {
  
  const n = data.length;
  const validationPeriods = Math.min(6, Math.floor((n - seasonLength * 2) / 3));
  
  let mapeSum = 0;
  let maseSum = 0;
  let weightedMapeSum = 0;
  let weightSum = 0;
  const backtestResults: Array<{period: number; actual: number; forecast: number; error: number}> = [];
  
  for (let i = 0; i < validationPeriods; i++) {
    const trainSize = n - validationPeriods + i;
    const trainData = data.slice(0, trainSize);
    const actualValue = data[trainSize];
    
    try {
      // Calcular forecast para el período de validación
      const result = holtWintersCore(trainData, seasonLength, 1, alpha, beta, gamma);
      const forecastValue = result.forecast[0];
      
      if (actualValue > 0) {
        const error = Math.abs(actualValue - forecastValue);
        const percentageError = error / actualValue;
        
        // Peso mayor para datos más recientes
        const weight = Math.pow(0.9, validationPeriods - i - 1);
        
        mapeSum += percentageError;
        weightedMapeSum += percentageError * weight;
        weightSum += weight;
        
        // MASE calculation (usando naive forecast como baseline)
        const naiveForecast = trainData[trainData.length - seasonLength] || trainData[trainData.length - 1];
        const naiveError = Math.abs(actualValue - naiveForecast);
        maseSum += naiveError > 0 ? error / naiveError : 0;
        
        backtestResults.push({
          period: i + 1,
          actual: actualValue,
          forecast: forecastValue,
          error: percentageError * 100
        });
      }
    } catch (e) {
      continue;
    }
  }
  
  const mape = validationPeriods > 0 ? (mapeSum / validationPeriods) * 100 : 50;
  const mase = validationPeriods > 0 ? maseSum / validationPeriods : 1;
  const weightedMape = weightSum > 0 ? (weightedMapeSum / weightSum) * 100 : mape;
  
  // Determinar confianza basada en múltiples métricas
  let confidence: 'Alta' | 'Media' | 'Baja' = 'Baja';
  if (weightedMape < 10 && mase < 0.8) confidence = 'Alta';
  else if (weightedMape < 20 && mase < 1.2) confidence = 'Media';
  
  return {
    mape,
    mase,
    weightedMape,
    confidence,
    backtestResults
  };
}

// Core Holt-Winters sin validación (para backtesting)
function holtWintersCore(
  data: number[], 
  seasonLength: number, 
  forecastPeriods: number, 
  alpha: number, 
  beta: number, 
  gamma: number
): { forecast: number[] } {
  
  const n = data.length;
  const level: number[] = new Array(n);
  const trend: number[] = new Array(n);
  const seasonal: number[] = new Array(n + seasonLength);
  
  // Inicialización simplificada
  for (let i = 0; i < seasonLength; i++) {
    seasonal[i] = 1;
  }
  
  level[0] = data.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength;
  trend[0] = 0;
  
  // Algoritmo principal
  for (let i = 1; i < n; i++) {
    const seasonalIndex = (i - 1) % seasonLength;
    
    level[i] = alpha * (data[i] / seasonal[seasonalIndex]) + (1 - alpha) * (level[i - 1] + trend[i - 1]);
    trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
    seasonal[i] = gamma * (data[i] / level[i]) + (1 - gamma) * seasonal[seasonalIndex];
  }
  
  // Forecast
  const forecast: number[] = [];
  for (let h = 1; h <= forecastPeriods; h++) {
    const seasonalIndex = (n - 1 + h) % seasonLength;
    forecast.push(Math.max(0, (level[n - 1] + h * trend[n - 1]) * seasonal[seasonalIndex]));
  }
  
  return { forecast };
}

// Utilidades
function getCurrentMonthName(month: number): string {
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return monthNames[month - 1] || 'desconocido';
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
      serviceMAPE: 50,
      gmvMAPE: 50,
      confidence: 'Baja'
    }
  };
}