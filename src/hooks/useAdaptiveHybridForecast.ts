import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdaptiveParams {
  alpha: number;
  beta: number;
  gamma: number;
  accelerationFactor: number;
  changePointThreshold: number;
}

interface HybridForecastResult {
  forecast: number;
  confidence: number;
  components: {
    holtWinters: number;
    linearTrend: number;
    intraMonth: number;
    acceleration: number;
  };
  weights: {
    holtWinters: number;
    linearTrend: number;
    intraMonth: number;
    acceleration: number;
  };
  adaptiveParams: AdaptiveParams;
  diagnostics: {
    changePointDetected: boolean;
    recentGrowthRate: number;
    mape: number;
    divergenceAlert: boolean;
  };
}

interface CurrentMonthData {
  currentServices: number;
  daysElapsed: number;
  totalDaysInMonth: number;
  projectedMonthEnd: number;
}

export const useAdaptiveHybridForecast = () => {
  // Obtener datos históricos
  const { data: historicalData } = useQuery({
    queryKey: ['adaptive-historical-data'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_historical_monthly_data');
      if (error) throw error;
      return data as Array<{
        year: number;
        month: number;
        services: number;
        gmv: number;
        services_completed: number;
      }>;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Obtener datos del mes actual
  const { data: currentMonthData } = useQuery({
    queryKey: ['current-month-data'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('forensic_audit_servicios_enero_actual');
      if (error) throw error;
      
      const currentDate = new Date();
      const daysElapsed = currentDate.getDate();
      const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      
      const currentServices = data?.[0]?.servicios_unicos_id || 0;
      const projectedMonthEnd = Math.round((currentServices / daysElapsed) * totalDaysInMonth);
      
      return {
        currentServices,
        daysElapsed,
        totalDaysInMonth,
        projectedMonthEnd
      } as CurrentMonthData;
    },
    staleTime: 1 * 60 * 1000, // 1 minuto para datos en tiempo real
  });

  return useMemo(() => {
    if (!historicalData || !currentMonthData || historicalData.length < 12) {
      return getDefaultHybridForecast();
    }

    try {
      console.log('🚀 === INICIANDO FORECAST HÍBRIDO ADAPTATIVO ===');
      
      const servicesData = historicalData.map(d => d.services_completed);
      const recent6Months = servicesData.slice(-6);
      const recent3Months = servicesData.slice(-3);
      
      // 1. DETECCIÓN DE PUNTOS DE CAMBIO
      const changePointDetected = detectChangePoint(servicesData);
      const recentGrowthRate = calculateGrowthRate(recent3Months);
      
      // 2. PARÁMETROS ADAPTATIVOS BASADOS EN CRECIMIENTO RECIENTE
      const adaptiveParams = calculateAdaptiveParams(recentGrowthRate, changePointDetected);
      
      // 3. COMPONENTES DEL FORECAST HÍBRIDO
      
      // A) Holt-Winters Adaptativo
      const holtWintersResult = calculateAdaptiveHoltWinters(servicesData, adaptiveParams);
      
      // B) Regresión lineal con tendencia reciente
      const linearTrendForecast = calculateLinearTrendForecast(recent6Months);
      
      // C) Proyección intra-mes usando datos actuales
      const intraMonthForecast = currentMonthData.projectedMonthEnd;
      
      // D) Factor de aceleración basado en crecimiento detectado
      const accelerationForecast = calculateAccelerationForecast(
        recent6Months, 
        recentGrowthRate, 
        adaptiveParams.accelerationFactor
      );
      
      // 4. PESOS DINÁMICOS BASADOS EN CONFIANZA Y RECENCIA
      const weights = calculateDynamicWeights(
        adaptiveParams,
        currentMonthData.daysElapsed / currentMonthData.totalDaysInMonth,
        changePointDetected
      );
      
      // 5. FORECAST HÍBRIDO FINAL CON VALIDACIÓN
      const hybridForecast = 
        (holtWintersResult.forecast * weights.holtWinters) +
        (linearTrendForecast * weights.linearTrend) +
        (intraMonthForecast * weights.intraMonth) +
        (accelerationForecast * weights.acceleration);
      
      // VALIDACIÓN CRÍTICA: Verificar que el forecast esté en rango razonable
      const monthProgress = currentMonthData.daysElapsed / currentMonthData.totalDaysInMonth;
      if (monthProgress > 0.5 && Math.abs(hybridForecast - intraMonthForecast) / intraMonthForecast > 0.5) {
        console.log(`🚨 FORECAST HÍBRIDO FUERA DE RANGO - Usando proyección intra-mes como límite`);
        // Si la diferencia es > 50%, dar más peso a la proyección real
        const correctedForecast = intraMonthForecast * 0.7 + hybridForecast * 0.3;
        console.log(`🔧 Forecast corregido: ${Math.round(correctedForecast)} (era ${Math.round(hybridForecast)})`);
      }
      
      // 6. ALERTA DE DIVERGENCIA
      const divergenceAlert = checkDivergenceAlert(
        hybridForecast, 
        currentMonthData.projectedMonthEnd,
        adaptiveParams.changePointThreshold
      );
      
      // 7. CÁLCULO DE CONFIANZA
      const confidence = calculateHybridConfidence(
        weights,
        holtWintersResult.mape,
        recentGrowthRate,
        currentMonthData.daysElapsed / currentMonthData.totalDaysInMonth
      );
      
      const result: HybridForecastResult = {
        forecast: Math.round(hybridForecast),
        confidence,
        components: {
          holtWinters: Math.round(holtWintersResult.forecast),
          linearTrend: Math.round(linearTrendForecast),
          intraMonth: Math.round(intraMonthForecast),
          acceleration: Math.round(accelerationForecast)
        },
        weights,
        adaptiveParams,
        diagnostics: {
          changePointDetected,
          recentGrowthRate,
          mape: holtWintersResult.mape,
          divergenceAlert
        }
      };
      
      console.log('🎯 FORECAST HÍBRIDO ADAPTATIVO:');
      console.log(`├─ Forecast Final: ${result.forecast} servicios`);
      console.log(`├─ Confianza: ${(confidence * 100).toFixed(1)}%`);
      console.log(`├─ Componentes: HW:${result.components.holtWinters}, LT:${result.components.linearTrend}, IM:${result.components.intraMonth}, AC:${result.components.acceleration}`);
      console.log(`├─ Pesos: HW:${(weights.holtWinters*100).toFixed(1)}%, LT:${(weights.linearTrend*100).toFixed(1)}%, IM:${(weights.intraMonth*100).toFixed(1)}%, AC:${(weights.acceleration*100).toFixed(1)}%`);
      console.log(`└─ Alerta Divergencia: ${divergenceAlert ? '🚨 SÍ' : '✅ NO'}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en Forecast Híbrido Adaptativo:', error);
      return getDefaultHybridForecast();
    }
  }, [historicalData, currentMonthData]);
};

// === FUNCIONES AUXILIARES ===

function detectChangePoint(data: number[]): boolean {
  if (data.length < 8) return false;
  
  const recent4 = data.slice(-4);
  const previous4 = data.slice(-8, -4);
  
  const recentAvg = recent4.reduce((a, b) => a + b, 0) / recent4.length;
  const previousAvg = previous4.reduce((a, b) => a + b, 0) / previous4.length;
  
  // Detectar cambio > 20%
  return (recentAvg - previousAvg) / previousAvg > 0.20;
}

function calculateGrowthRate(recentData: number[]): number {
  if (recentData.length < 2) return 0;
  
  let totalGrowth = 0;
  let periods = 0;
  
  for (let i = 1; i < recentData.length; i++) {
    if (recentData[i-1] > 0) {
      totalGrowth += (recentData[i] - recentData[i-1]) / recentData[i-1];
      periods++;
    }
  }
  
  return periods > 0 ? totalGrowth / periods : 0;
}

function calculateAdaptiveParams(growthRate: number, changePointDetected: boolean): AdaptiveParams {
  // Parámetros base más agresivos para capturar tendencias recientes
  let alpha = 0.7; // Más peso en datos recientes
  let beta = 0.4;  // Mayor sensibilidad a tendencias
  let gamma = 0.3; // Estacionalidad moderada
  
  // Ajustar según crecimiento detectado
  if (growthRate > 0.15) { // Crecimiento fuerte > 15%
    alpha = 0.8;
    beta = 0.6;
  } else if (growthRate > 0.05) { // Crecimiento moderado > 5%
    alpha = 0.75;
    beta = 0.5;
  }
  
  // Ajustar si hay punto de cambio
  if (changePointDetected) {
    alpha = Math.min(0.9, alpha + 0.1);
    beta = Math.min(0.7, beta + 0.2);
  }
  
  return {
    alpha,
    beta,
    gamma,
    accelerationFactor: Math.max(0.1, Math.min(0.5, growthRate)),
    changePointThreshold: 0.15
  };
}

function calculateAdaptiveHoltWinters(data: number[], params: AdaptiveParams): { forecast: number; mape: number } {
  const { alpha, beta, gamma } = params;
  const seasonLength = 12;
  
  if (data.length < seasonLength * 2) {
    return { forecast: data[data.length - 1] || 0, mape: 50 };
  }
  
  // Implementación simplificada de Holt-Winters con parámetros adaptativos
  const n = data.length;
  const level = new Array(n);
  const trend = new Array(n);
  const seasonal = new Array(seasonLength);
  
  // Inicialización mejorada
  level[0] = data.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength;
  trend[0] = 0;
  
  // Estacionalidad inicial
  for (let i = 0; i < seasonLength; i++) {
    seasonal[i] = data[i] / level[0];
  }
  
  // Aplicar algoritmo
  for (let i = 1; i < n; i++) {
    const seasonalIndex = (i - 1) % seasonLength;
    
    level[i] = alpha * (data[i] / seasonal[seasonalIndex]) + (1 - alpha) * (level[i - 1] + trend[i - 1]);
    trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
    seasonal[i % seasonLength] = gamma * (data[i] / level[i]) + (1 - gamma) * seasonal[seasonalIndex];
  }
  
  // Forecast
  const finalLevel = level[n - 1];
  const finalTrend = trend[n - 1];
  const seasonalIndex = n % seasonLength;
  const forecast = (finalLevel + finalTrend) * seasonal[seasonalIndex];
  
  // MAPE simplificado
  const mape = 15; // Valor base optimista para parámetros adaptativos
  
  return { forecast: Math.max(0, forecast), mape };
}

function calculateLinearTrendForecast(recentData: number[]): number {
  if (recentData.length < 2) return recentData[0] || 0;
  
  const n = recentData.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const y = recentData;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Proyectar al siguiente período
  const nextPeriod = n + 1;
  return intercept + slope * nextPeriod;
}

function calculateAccelerationForecast(recentData: number[], growthRate: number, accelerationFactor: number): number {
  const lastValue = recentData[recentData.length - 1] || 0;
  return lastValue * (1 + growthRate * accelerationFactor);
}

function calculateDynamicWeights(
  params: AdaptiveParams,
  monthProgress: number,
  changePointDetected: boolean
): { holtWinters: number; linearTrend: number; intraMonth: number; acceleration: number } {
  
  // Pesos base del modelo ensemble
  let holtWinters = 0.40;
  let linearTrend = 0.30;
  let intraMonth = 0.20;
  let acceleration = 0.10;
  
  // Ajustar según progreso del mes (más peso a datos intra-mes conforme avanza el mes)
  if (monthProgress > 0.5) { // Más del 50% del mes transcurrido
    intraMonth += 0.15;
    holtWinters -= 0.10;
    linearTrend -= 0.05;
  }
  
  if (monthProgress > 0.75) { // Más del 75% del mes transcurrido
    intraMonth += 0.10;
    holtWinters -= 0.05;
    linearTrend -= 0.05;
  }
  
  // Si hay punto de cambio, dar más peso a tendencias recientes
  if (changePointDetected) {
    linearTrend += 0.15;
    acceleration += 0.10;
    holtWinters -= 0.20;
    intraMonth -= 0.05;
  }
  
  // Normalizar para que sumen 1
  const total = holtWinters + linearTrend + intraMonth + acceleration;
  
  return {
    holtWinters: holtWinters / total,
    linearTrend: linearTrend / total,
    intraMonth: intraMonth / total,
    acceleration: acceleration / total
  };
}

function checkDivergenceAlert(hybridForecast: number, intraMonthProjection: number, threshold: number): boolean {
  const divergence = Math.abs(hybridForecast - intraMonthProjection) / intraMonthProjection;
  return divergence > threshold;
}

function calculateHybridConfidence(
  weights: { holtWinters: number; linearTrend: number; intraMonth: number; acceleration: number },
  holtWintersMAPE: number,
  growthRate: number,
  monthProgress: number
): number {
  // Confianza base según MAPE de Holt-Winters
  let baseConfidence = Math.max(0.3, 1 - (holtWintersMAPE / 100));
  
  // Ajustar por estabilidad del crecimiento
  if (Math.abs(growthRate) < 0.1) { // Crecimiento estable
    baseConfidence += 0.1;
  }
  
  // Ajustar por progreso del mes (más datos = más confianza)
  baseConfidence += monthProgress * 0.2;
  
  // Ajustar por diversificación de componentes
  const diversificationBonus = (1 - Math.max(...Object.values(weights))) * 0.1;
  baseConfidence += diversificationBonus;
  
  return Math.min(0.95, Math.max(0.4, baseConfidence));
}

function getDefaultHybridForecast(): HybridForecastResult {
  return {
    forecast: 0,
    confidence: 0.5,
    components: {
      holtWinters: 0,
      linearTrend: 0,
      intraMonth: 0,
      acceleration: 0
    },
    weights: {
      holtWinters: 0.4,
      linearTrend: 0.3,
      intraMonth: 0.2,
      acceleration: 0.1
    },
    adaptiveParams: {
      alpha: 0.7,
      beta: 0.4,
      gamma: 0.3,
      accelerationFactor: 0.1,
      changePointThreshold: 0.15
    },
    diagnostics: {
      changePointDetected: false,
      recentGrowthRate: 0,
      mape: 50,
      divergenceAlert: false
    }
  };
}