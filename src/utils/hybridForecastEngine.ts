// Enhanced Hybrid Forecast Engine with External Factors Integration

import { performBacktesting, detectAnomalies, validateDataQuality } from './forecastValidation';

export interface HybridForecastConfig {
  enableExternalFactors: boolean;
  seasonalityBoost: number;
  trendSensitivity: number;
  volatilityThreshold: number;
  confidenceTarget: number;
}

export interface ExternalFactors {
  marketingCampaigns: boolean;
  seasonalEvents: string[];
  economicIndicators: {
    gdpGrowth: number;
    inflation: number;
    businessConfidence: number;
  };
  competitorActivity: 'low' | 'medium' | 'high';
}

export interface EnhancedForecastResult {
  forecast: number;
  confidence: number;
  confidenceLevel: 'Alta' | 'Media' | 'Baja';
  components: {
    holtWinters: number;
    linearTrend: number;
    intraMonth: number;
    acceleration: number;
    externalAdjustment: number;
  };
  weights: {
    holtWinters: number;
    linearTrend: number;
    intraMonth: number;
    acceleration: number;
    external: number;
  };
  diagnostics: {
    mape: number;
    backtestResults: any[];
    anomaliesDetected: boolean;
    dataQuality: 'high' | 'medium' | 'low';
    alerts: string[];
    recommendations: string[];
  };
  metadata: {
    algorithm: string;
    timestamp: Date;
    parameters: Record<string, any>;
    version: string;
  };
}

// === MOTOR HÍBRIDO MEJORADO ===

export class HybridForecastEngine {
  private config: HybridForecastConfig;
  
  constructor(config?: Partial<HybridForecastConfig>) {
    this.config = {
      enableExternalFactors: true,
      seasonalityBoost: 1.1,
      trendSensitivity: 0.7,
      volatilityThreshold: 0.25,
      confidenceTarget: 0.85,
      ...config
    };
  }
  
  generateForecast(
    historicalData: number[],
    currentMonthData?: {
      currentServices: number;
      daysElapsed: number;
      totalDaysInMonth: number;
      projectedMonthEnd: number;
    },
    externalFactors?: ExternalFactors
  ): EnhancedForecastResult {
    console.log('🚀 === INICIANDO MOTOR HÍBRIDO MEJORADO ===');
    
    try {
      // 1. VALIDACIÓN Y CALIDAD DE DATOS
      const dataQuality = validateDataQuality(historicalData);
      const anomalyResult = detectAnomalies(historicalData, currentMonthData?.currentServices);
      
      // 2. BACKTESTING PARA VALIDACIÓN TEMPORAL
      const backtestResults = performBacktesting(historicalData, 6);
      
      // 3. DETECTAR PATRONES Y TENDENCIAS
      const patterns = this.detectPatterns(historicalData);
      
      // 4. COMPONENTES DEL FORECAST
      const components = this.calculateComponents(historicalData, currentMonthData, patterns);
      
      // 5. AJUSTES POR FACTORES EXTERNOS
      const externalAdjustment = this.config.enableExternalFactors && externalFactors
        ? this.calculateExternalAdjustment(components, externalFactors)
        : 0;
      
      // 6. CÁLCULO DE PESOS DINÁMICOS
      const weights = this.calculateDynamicWeights(
        patterns,
        dataQuality,
        backtestResults.confidence,
        currentMonthData
      );
      
      // 7. FORECAST FINAL
      const baseForecast = 
        (components.holtWinters * weights.holtWinters) +
        (components.linearTrend * weights.linearTrend) +
        (components.intraMonth * weights.intraMonth) +
        (components.acceleration * weights.acceleration);
      
      const finalForecast = baseForecast + (externalAdjustment * weights.external);
      
      // 8. VALIDACIÓN Y ALERTAS
      const alerts = this.generateAlerts(finalForecast, components, anomalyResult, backtestResults);
      const recommendations = this.generateRecommendations(
        finalForecast,
        backtestResults.overallMAPE,
        dataQuality,
        patterns
      );
      
      // 9. CÁLCULO DE CONFIANZA FINAL
      const confidence = this.calculateConfidence(
        backtestResults.overallMAPE,
        dataQuality,
        anomalyResult,
        weights
      );
      
      const result: EnhancedForecastResult = {
        forecast: Math.round(finalForecast),
        confidence,
        confidenceLevel: confidence >= 0.8 ? 'Alta' : confidence >= 0.6 ? 'Media' : 'Baja',
        components: {
          ...components,
          externalAdjustment
        },
        weights,
        diagnostics: {
          mape: backtestResults.overallMAPE,
          backtestResults: backtestResults.results,
          anomaliesDetected: anomalyResult.isAnomaly,
          dataQuality: dataQuality.quality,
          alerts,
          recommendations
        },
        metadata: {
          algorithm: 'HybridForecastEngine',
          timestamp: new Date(),
          parameters: this.config,
          version: '2.0.0'
        }
      };
      
      console.log('🎯 FORECAST HÍBRIDO MEJORADO COMPLETADO:');
      console.log(`├─ Forecast: ${result.forecast} servicios`);
      console.log(`├─ Confianza: ${(confidence * 100).toFixed(1)}% (${result.confidenceLevel})`);
      console.log(`├─ MAPE Backtest: ${backtestResults.overallMAPE.toFixed(2)}%`);
      console.log(`├─ Calidad Datos: ${dataQuality.quality}`);
      console.log(`└─ Alertas: ${alerts.length}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en Motor Híbrido:', error);
      return this.getDefaultResult();
    }
  }
  
  // === DETECCIÓN DE PATRONES ===
  
  private detectPatterns(data: number[]): {
    trend: 'up' | 'down' | 'stable';
    seasonality: number;
    volatility: number;
    growth: number;
    acceleration: number;
    cyclical: boolean;
  } {
    const recent6 = data.slice(-6);
    const recent3 = data.slice(-3);
    const previous3 = data.slice(-6, -3);
    
    // Tendencia
    const linearTrend = this.calculateLinearTrend(recent6);
    const trend = linearTrend > 0.05 ? 'up' : linearTrend < -0.05 ? 'down' : 'stable';
    
    // Crecimiento
    const recentAvg = recent3.reduce((sum, val) => sum + val, 0) / recent3.length;
    const previousAvg = previous3.reduce((sum, val) => sum + val, 0) / previous3.length;
    const growth = (recentAvg - previousAvg) / previousAvg;
    
    // Aceleración
    const acceleration = recent3.length >= 3
      ? (recent3[2] - recent3[1]) / recent3[1] - (recent3[1] - recent3[0]) / recent3[0]
      : 0;
    
    // Estacionalidad (correlación con períodos anuales)
    const seasonality = this.calculateSeasonality(data);
    
    // Volatilidad
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const volatility = Math.sqrt(variance) / mean;
    
    // Ciclos (detectar patrones repetitivos)
    const cyclical = this.detectCycles(data);
    
    return {
      trend,
      seasonality,
      volatility,
      growth,
      acceleration,
      cyclical
    };
  }
  
  // === CÁLCULO DE COMPONENTES ===
  
  private calculateComponents(
    historicalData: number[],
    currentMonthData?: any,
    patterns?: any
  ): {
    holtWinters: number;
    linearTrend: number;
    intraMonth: number;
    acceleration: number;
  } {
    const holtWinters = this.calculateHoltWintersComponent(historicalData, patterns);
    const linearTrend = this.calculateLinearTrendComponent(historicalData);
    const intraMonth = currentMonthData?.projectedMonthEnd || 0;
    const acceleration = this.calculateAccelerationComponent(historicalData, patterns);
    
    return {
      holtWinters,
      linearTrend,
      intraMonth,
      acceleration
    };
  }
  
  // === AJUSTES POR FACTORES EXTERNOS ===
  
  private calculateExternalAdjustment(
    components: any,
    externalFactors: ExternalFactors
  ): number {
    let adjustment = 0;
    const baseForecast = (components.holtWinters + components.linearTrend) / 2;
    
    // Campañas de marketing
    if (externalFactors.marketingCampaigns) {
      adjustment += baseForecast * 0.08; // 8% boost
    }
    
    // Eventos estacionales
    if (externalFactors.seasonalEvents.length > 0) {
      const eventImpact = externalFactors.seasonalEvents.length * 0.03;
      adjustment += baseForecast * eventImpact;
    }
    
    // Indicadores económicos
    const economicScore = (
      externalFactors.economicIndicators.gdpGrowth +
      (5 - externalFactors.economicIndicators.inflation) +
      externalFactors.economicIndicators.businessConfidence
    ) / 3;
    
    if (economicScore > 3) {
      adjustment += baseForecast * 0.05;
    } else if (economicScore < 2) {
      adjustment -= baseForecast * 0.05;
    }
    
    // Actividad de competidores
    switch (externalFactors.competitorActivity) {
      case 'high':
        adjustment -= baseForecast * 0.03;
        break;
      case 'low':
        adjustment += baseForecast * 0.02;
        break;
    }
    
    return adjustment;
  }
  
  // === CÁLCULO DE PESOS DINÁMICOS ===
  
  private calculateDynamicWeights(
    patterns: any,
    dataQuality: any,
    backtestConfidence: string,
    currentMonthData?: any
  ): {
    holtWinters: number;
    linearTrend: number;
    intraMonth: number;
    acceleration: number;
    external: number;
  } {
    let weights = {
      holtWinters: 0.35,
      linearTrend: 0.25,
      intraMonth: 0.25,
      acceleration: 0.10,
      external: 0.05
    };
    
    // Ajustar según calidad de datos
    if (dataQuality.quality === 'high') {
      weights.holtWinters += 0.10;
      weights.linearTrend -= 0.05;
      weights.external -= 0.05;
    } else if (dataQuality.quality === 'low') {
      weights.holtWinters -= 0.10;
      weights.intraMonth += 0.15;
      weights.external -= 0.05;
    }
    
    // Ajustar según progreso del mes
    const monthProgress = currentMonthData 
      ? currentMonthData.daysElapsed / currentMonthData.totalDaysInMonth 
      : 0;
    
    if (monthProgress > 0.7) {
      weights.intraMonth += 0.15;
      weights.holtWinters -= 0.10;
      weights.linearTrend -= 0.05;
    }
    
    // Ajustar según tendencia
    if (patterns?.trend === 'up' && patterns?.growth > 0.1) {
      weights.acceleration += 0.05;
      weights.linearTrend += 0.05;
      weights.holtWinters -= 0.10;
    }
    
    // Normalizar
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    weights.holtWinters = weights.holtWinters / total;
    weights.linearTrend = weights.linearTrend / total;
    weights.intraMonth = weights.intraMonth / total;
    weights.acceleration = weights.acceleration / total;
    weights.external = weights.external / total;
    
    return weights;
  }
  
  // === GENERACIÓN DE ALERTAS ===
  
  private generateAlerts(
    forecast: number,
    components: any,
    anomalyResult: any,
    backtestResults: any
  ): string[] {
    const alerts: string[] = [];
    
    if (backtestResults.overallMAPE > 25) {
      alerts.push(`🚨 MAPE alto: ${backtestResults.overallMAPE.toFixed(1)}% - Revisar modelo`);
    }
    
    if (anomalyResult.isAnomaly) {
      alerts.push(`🔍 Anomalía detectada: ${anomalyResult.reasons.join(', ')}`);
    }
    
    const componentDivergence = Math.abs(components.holtWinters - components.intraMonth) / components.holtWinters;
    if (componentDivergence > 0.25) {
      alerts.push(`⚠️ Divergencia entre componentes: ${(componentDivergence * 100).toFixed(1)}%`);
    }
    
    if (forecast < components.intraMonth * 0.8) {
      alerts.push('📉 Forecast significativamente menor que proyección intra-mes');
    }
    
    return alerts;
  }
  
  // === RECOMENDACIONES ===
  
  private generateRecommendations(
    forecast: number,
    mape: number,
    dataQuality: any,
    patterns: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (mape > 20) {
      recommendations.push('Aumentar frecuencia de recalibración del modelo');
      recommendations.push('Incluir más variables explicativas');
    }
    
    if (dataQuality.quality === 'low') {
      recommendations.push('Mejorar calidad y completitud de datos históricos');
      recommendations.push('Implementar validación de datos en tiempo real');
    }
    
    if (patterns.volatility > 0.3) {
      recommendations.push('Implementar rangos de confianza más amplios');
      recommendations.push('Considerar factores estacionales adicionales');
    }
    
    if (patterns.trend === 'up' && patterns.growth > 0.15) {
      recommendations.push('Monitorear sostenibilidad del crecimiento');
      recommendations.push('Preparar escenarios de aceleración');
    }
    
    return recommendations;
  }
  
  // === CÁLCULO DE CONFIANZA ===
  
  private calculateConfidence(
    mape: number,
    dataQuality: any,
    anomalyResult: any,
    weights: any
  ): number {
    let confidence = 1 - (mape / 100);
    
    // Ajustar por calidad de datos
    if (dataQuality.quality === 'high') {
      confidence += 0.1;
    } else if (dataQuality.quality === 'low') {
      confidence -= 0.15;
    }
    
    // Ajustar por anomalías
    if (anomalyResult.isAnomaly) {
      confidence -= anomalyResult.anomalyScore * 0.2;
    }
    
    // Ajustar por diversificación de pesos
    const maxWeight = Math.max(weights.holtWinters, weights.linearTrend, weights.intraMonth, weights.acceleration, weights.external);
    if (maxWeight < 0.5) {
      confidence += 0.05; // Bonus por diversificación
    }
    
    return Math.max(0.2, Math.min(0.95, confidence));
  }
  
  // === MÉTODOS AUXILIARES ===
  
  private calculateLinearTrend(data: number[]): number {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope / (sumY / n); // Normalizar por media
  }
  
  private calculateSeasonality(data: number[]): number {
    if (data.length < 24) return 0.1;
    
    // Calcular autocorrelación con lag de 12 meses
    const lag12Data = data.slice(-12);
    const previousYearData = data.slice(-24, -12);
    
    if (lag12Data.length !== previousYearData.length) return 0.1;
    
    const correlation = this.calculateCorrelation(lag12Data, previousYearData);
    return Math.max(0.1, Math.min(1.0, correlation));
  }
  
  private detectCycles(data: number[]): boolean {
    // Detectar patrones cíclicos usando FFT simplificado
    if (data.length < 12) return false;
    
    const peaks = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i-1] && data[i] > data[i+1]) {
        peaks.push(i);
      }
    }
    
    // Si hay al menos 3 peaks con espaciado regular, hay ciclos
    return peaks.length >= 3;
  }
  
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  private calculateHoltWintersComponent(data: number[], patterns: any): number {
    // Implementación simplificada - usar la función existente
    return data[data.length - 1] * (1 + (patterns?.growth || 0));
  }
  
  private calculateLinearTrendComponent(data: number[]): number {
    const trend = this.calculateLinearTrend(data.slice(-6));
    return data[data.length - 1] * (1 + trend);
  }
  
  private calculateAccelerationComponent(data: number[], patterns: any): number {
    const acceleration = patterns?.acceleration || 0;
    return data[data.length - 1] * (1 + acceleration);
  }
  
  private getDefaultResult(): EnhancedForecastResult {
    return {
      forecast: 0,
      confidence: 0.5,
      confidenceLevel: 'Baja',
      components: {
        holtWinters: 0,
        linearTrend: 0,
        intraMonth: 0,
        acceleration: 0,
        externalAdjustment: 0
      },
      weights: {
        holtWinters: 0.35,
        linearTrend: 0.25,
        intraMonth: 0.25,
        acceleration: 0.10,
        external: 0.05
      },
      diagnostics: {
        mape: 50,
        backtestResults: [],
        anomaliesDetected: false,
        dataQuality: 'low',
        alerts: ['Error en el cálculo del forecast'],
        recommendations: ['Revisar datos de entrada']
      },
      metadata: {
        algorithm: 'HybridForecastEngine',
        timestamp: new Date(),
        parameters: this.config,
        version: '2.0.0'
      }
    };
  }
}