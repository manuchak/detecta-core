/**
 * Motor matemático para cálculos avanzados de reclutamiento
 * Proporciona algoritmos estadísticamente sólidos para análisis de métricas
 */
export class RecruitmentMathEngine {
  
  /**
   * Calcula el CPA (Cost Per Acquisition) real basado en datos financieros
   */
  static calculateRealCPA(
    totalInvestment: number,
    custodiosAcquired: number,
    timeframe: number = 30
  ): number {
    if (custodiosAcquired === 0) return 0;
    return totalInvestment / custodiosAcquired;
  }

  /**
   * Calcula correlación entre rotación y necesidad de reclutamiento
   * Usa coeficiente de Pearson para correlación estadística
   */
  static calculateRotationRecruitmentCorrelation(
    rotationData: Array<{ month: number; rotationRate: number; recruitmentNeed: number }>
  ): number {
    if (rotationData.length < 2) return 0;

    const n = rotationData.length;
    const sumX = rotationData.reduce((sum, d) => sum + d.rotationRate, 0);
    const sumY = rotationData.reduce((sum, d) => sum + d.recruitmentNeed, 0);
    const sumXY = rotationData.reduce((sum, d) => sum + (d.rotationRate * d.recruitmentNeed), 0);
    const sumX2 = rotationData.reduce((sum, d) => sum + (d.rotationRate ** 2), 0);
    const sumY2 = rotationData.reduce((sum, d) => sum + (d.recruitmentNeed ** 2), 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX ** 2)) * ((n * sumY2) - (sumY ** 2)));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calcula LTV (Lifetime Value) de custodio basado en datos históricos
   */
  static calculateCustodianLTV(
    averageMonthlyRevenue: number,
    averageRetentionMonths: number,
    acquisitionCost: number
  ): number {
    const grossLTV = averageMonthlyRevenue * averageRetentionMonths;
    return grossLTV - acquisitionCost;
  }

  /**
   * Calcula ROI con análisis de sensibilidad
   */
  static calculateROIWithSensitivity(
    investment: number,
    revenue: number,
    timeframeDays: number,
    riskFactor: number = 0.1
  ): { roi: number; adjustedROI: number; confidence: number } {
    const basicROI = ((revenue - investment) / investment) * 100;
    const adjustedROI = basicROI * (1 - riskFactor);
    const confidence = Math.max(0, Math.min(1, (timeframeDays / 365) * (1 - riskFactor)));

    return {
      roi: basicROI,
      adjustedROI,
      confidence
    };
  }

  /**
   * Proyección de demanda usando regresión lineal múltiple
   */
  static projectDemand(
    historicalData: Array<{
      period: number;
      demand: number;
      seasonality: number;
      externalFactors: number;
    }>
  ): { projection: number; confidence: number } {
    if (historicalData.length < 3) {
      return { projection: 0, confidence: 0 };
    }

    // Regresión lineal simple para tendencia
    const n = historicalData.length;
    const sumX = historicalData.reduce((sum, d, i) => sum + i, 0);
    const sumY = historicalData.reduce((sum, d) => sum + d.demand, 0);
    const sumXY = historicalData.reduce((sum, d, i) => sum + (i * d.demand), 0);
    const sumX2 = historicalData.reduce((sum, d, i) => sum + (i ** 2), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
    const intercept = (sumY - slope * sumX) / n;

    // Proyección para el siguiente período
    const nextPeriod = n;
    const baseProjection = slope * nextPeriod + intercept;

    // Ajuste por estacionalidad promedio
    const avgSeasonality = historicalData.reduce((sum, d) => sum + d.seasonality, 0) / n;
    const projection = baseProjection * (1 + avgSeasonality);

    // Cálculo de confianza basado en R²
    const meanY = sumY / n;
    const totalVariation = historicalData.reduce((sum, d) => sum + ((d.demand - meanY) ** 2), 0);
    const explainedVariation = historicalData.reduce((sum, d, i) => {
      const predicted = slope * i + intercept;
      return sum + ((predicted - meanY) ** 2);
    }, 0);
    
    const rSquared = totalVariation === 0 ? 0 : explainedVariation / totalVariation;
    const confidence = Math.max(0, Math.min(1, rSquared));

    return { projection: Math.max(0, projection), confidence };
  }

  /**
   * Optimización de presupuesto usando algoritmo greedy
   */
  static optimizeBudgetAllocation(
    availableBudget: number,
    channels: Array<{
      id: string;
      name: string;
      cpa: number;
      conversionRate: number;
      capacity: number;
      currentROI: number;
    }>
  ): Array<{ channelId: string; allocation: number; expectedCustodios: number }> {
    // Ordenar canales por eficiencia (ROI/CPA ratio)
    const sortedChannels = [...channels].sort((a, b) => {
      const efficiencyA = a.currentROI / a.cpa;
      const efficiencyB = b.currentROI / b.cpa;
      return efficiencyB - efficiencyA;
    });

    const allocations: Array<{ channelId: string; allocation: number; expectedCustodios: number }> = [];
    let remainingBudget = availableBudget;

    for (const channel of sortedChannels) {
      if (remainingBudget <= 0) break;

      const maxAllocation = Math.min(remainingBudget, channel.capacity * channel.cpa);
      const allocation = maxAllocation;
      const expectedCustodios = allocation / channel.cpa;

      if (allocation > 0) {
        allocations.push({
          channelId: channel.id,
          allocation,
          expectedCustodios
        });
        remainingBudget -= allocation;
      }
    }

    return allocations;
  }

  /**
   * Simulación Monte Carlo para escenarios de reclutamiento
   */
  static monteCarloSimulation(
    baseScenario: {
      budget: number;
      expectedCPA: number;
      conversionRate: number;
      retentionRate: number;
    },
    variability: {
      budgetVariance: number;
      cpaVariance: number;
      conversionVariance: number;
      retentionVariance: number;
    },
    iterations: number = 1000
  ): {
    meanCustodios: number;
    confidence95: { lower: number; upper: number };
    successProbability: number;
  } {
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Generar valores aleatorios basados en distribución normal
      const randomBudget = this.normalRandom(baseScenario.budget, variability.budgetVariance);
      const randomCPA = this.normalRandom(baseScenario.expectedCPA, variability.cpaVariance);
      const randomConversion = Math.max(0, Math.min(1, 
        this.normalRandom(baseScenario.conversionRate, variability.conversionVariance)
      ));
      const randomRetention = Math.max(0, Math.min(1,
        this.normalRandom(baseScenario.retentionRate, variability.retentionVariance)
      ));

      // Calcular custodios para esta iteración
      const potentialCustodios = randomBudget / randomCPA;
      const convertedCustodios = potentialCustodios * randomConversion;
      const retainedCustodios = convertedCustodios * randomRetention;

      results.push(retainedCustodios);
    }

    // Calcular estadísticas
    results.sort((a, b) => a - b);
    const meanCustodios = results.reduce((sum, val) => sum + val, 0) / results.length;
    const lowerBound = results[Math.floor(0.025 * results.length)];
    const upperBound = results[Math.floor(0.975 * results.length)];
    
    // Probabilidad de éxito (custodios > 0)
    const successCount = results.filter(r => r > 0).length;
    const successProbability = successCount / results.length;

    return {
      meanCustodios,
      confidence95: { lower: lowerBound, upper: upperBound },
      successProbability
    };
  }

  /**
   * Generador de números aleatorios con distribución normal (Box-Muller)
   */
  private static normalRandom(mean: number, variance: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const standardNormal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + Math.sqrt(variance) * standardNormal;
  }

  /**
   * Análisis de tendencias usando media móvil exponencial
   */
  static exponentialMovingAverage(
    data: number[],
    alpha: number = 0.3
  ): { trend: number[]; prediction: number } {
    if (data.length === 0) return { trend: [], prediction: 0 };

    const trend: number[] = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      const ema = alpha * data[i] + (1 - alpha) * trend[i - 1];
      trend.push(ema);
    }

    // Predicción para el siguiente período
    const prediction = trend[trend.length - 1];

    return { trend, prediction };
  }

  /**
   * Cálculo de métricas de calidad de canal
   */
  static calculateChannelQuality(
    channelData: {
      conversionRate: number;
      retentionRate: number;
      avgTimeToHire: number;
      custodianPerformance: number;
      cpa: number;
      volume: number;
    },
    benchmarks: {
      targetConversion: number;
      targetRetention: number;
      maxTimeToHire: number;
      targetPerformance: number;
      targetCPA: number;
    }
  ): { qualityScore: number; factors: Record<string, number> } {
    const factors = {
      conversion: Math.min(1, channelData.conversionRate / benchmarks.targetConversion),
      retention: Math.min(1, channelData.retentionRate / benchmarks.targetRetention),
      speed: Math.max(0, 1 - (channelData.avgTimeToHire / benchmarks.maxTimeToHire)),
      performance: Math.min(1, channelData.custodianPerformance / benchmarks.targetPerformance),
      costEfficiency: benchmarks.targetCPA / Math.max(channelData.cpa, 0.01),
      volume: Math.min(1, channelData.volume / 100) // Normalizado a 100 como máximo
    };

    // Pesos para cada factor
    const weights = {
      conversion: 0.25,
      retention: 0.25,
      speed: 0.15,
      performance: 0.15,
      costEfficiency: 0.15,
      volume: 0.05
    };

    const qualityScore = Object.entries(factors).reduce((score, [key, value]) => {
      return score + (value * weights[key as keyof typeof weights]);
    }, 0);

    return {
      qualityScore: Math.max(0, Math.min(1, qualityScore)),
      factors
    };
  }
}