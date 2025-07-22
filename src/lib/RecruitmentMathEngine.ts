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

  // FASE 2: Matemática Correlacionada - Correlaciones Avanzadas
  
  /**
   * Calcula correlación múltiple entre variables financieras y operacionales
   */
  static calculateMultipleCorrelation(
    variables: Array<{ 
      financial: number; 
      operational: number; 
      temporal: number; 
      external: number 
    }>
  ): { 
    primaryCorrelation: number; 
    secondaryCorrelations: Record<string, number>;
    reliabilityIndex: number;
  } {
    if (variables.length < 3) return { 
      primaryCorrelation: 0, 
      secondaryCorrelations: {}, 
      reliabilityIndex: 0 
    };

    const correlations = {
      financialOperational: this.pearsonCorrelation(
        variables.map(v => v.financial),
        variables.map(v => v.operational)
      ),
      financialTemporal: this.pearsonCorrelation(
        variables.map(v => v.financial),
        variables.map(v => v.temporal)
      ),
      operationalTemporal: this.pearsonCorrelation(
        variables.map(v => v.operational),
        variables.map(v => v.temporal)
      ),
      externalFinancial: this.pearsonCorrelation(
        variables.map(v => v.external),
        variables.map(v => v.financial)
      )
    };

    const reliabilityIndex = Object.values(correlations)
      .reduce((sum, corr) => sum + Math.abs(corr), 0) / Object.keys(correlations).length;

    return {
      primaryCorrelation: correlations.financialOperational,
      secondaryCorrelations: correlations,
      reliabilityIndex
    };
  }

  /**
   * Validación cruzada de métricas para detectar inconsistencias
   */
  static crossValidateMetrics(
    metrics: {
      cpa: number;
      retention: number;
      ltv: number;
      roi: number;
      volume: number;
    }
  ): { 
    isValid: boolean; 
    inconsistencies: string[]; 
    confidenceScore: number;
  } {
    const inconsistencies: string[] = [];
    
    // Validación CPA vs LTV
    if (metrics.cpa > metrics.ltv * 0.5) {
      inconsistencies.push('CPA demasiado alto en relación al LTV');
    }

    // Validación ROI vs retención
    const expectedROI = (metrics.ltv / metrics.cpa - 1) * 100;
    if (Math.abs(metrics.roi - expectedROI) > 20) {
      inconsistencies.push('ROI inconsistente con relación LTV/CPA');
    }

    // Validación volumen vs métricas
    if (metrics.volume > 100 && metrics.cpa < 1000) {
      inconsistencies.push('Volumen alto con CPA muy bajo - posible error');
    }

    const confidenceScore = Math.max(0, 1 - (inconsistencies.length * 0.25));

    return {
      isValid: inconsistencies.length === 0,
      inconsistencies,
      confidenceScore
    };
  }

  /**
   * Análisis de tendencias estacionales avanzado
   */
  static advancedSeasonalAnalysis(
    historicalData: Array<{ period: number; value: number; external?: number }>,
    cycles: number = 12
  ): {
    seasonalFactors: number[];
    trendDirection: 'up' | 'down' | 'stable';
    cyclicalStrength: number;
    predictions: Array<{ period: number; predicted: number; confidence: number }>;
  } {
    if (historicalData.length < cycles * 2) {
      return {
        seasonalFactors: new Array(cycles).fill(1),
        trendDirection: 'stable',
        cyclicalStrength: 0,
        predictions: []
      };
    }

    // Calcular factores estacionales
    const seasonalData = new Array(cycles).fill(0).map(() => [] as number[]);
    
    historicalData.forEach((item, index) => {
      const seasonIndex = index % cycles;
      seasonalData[seasonIndex].push(item.value);
    });

    const seasonalFactors = seasonalData.map(seasonValues => {
      if (seasonValues.length === 0) return 1;
      const average = seasonValues.reduce((sum, val) => sum + val, 0) / seasonValues.length;
      const overallAverage = historicalData.reduce((sum, item) => sum + item.value, 0) / historicalData.length;
      return overallAverage === 0 ? 1 : average / overallAverage;
    });

    // Calcular tendencia
    const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
    const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
    
    const trendDirection = secondAvg > firstAvg * 1.05 ? 'up' : 
                          secondAvg < firstAvg * 0.95 ? 'down' : 'stable';

    // Fuerza ciclica basada en variación estacional
    const seasonalVariance = seasonalFactors.reduce((sum, factor) => 
      sum + Math.pow(factor - 1, 2), 0) / seasonalFactors.length;
    const cyclicalStrength = Math.min(1, seasonalVariance * 2);

    // Predicciones para próximos períodos
    const { trend } = this.exponentialMovingAverage(
      historicalData.map(item => item.value)
    );
    
    const lastTrend = trend[trend.length - 1] || 0;
    const predictions = Array.from({ length: cycles }, (_, i) => {
      const seasonalAdjustment = seasonalFactors[i % cycles];
      const predicted = lastTrend * seasonalAdjustment;
      const confidence = Math.max(0.3, cyclicalStrength);
      
      return {
        period: historicalData.length + i,
        predicted,
        confidence
      };
    });

    return {
      seasonalFactors,
      trendDirection,
      cyclicalStrength,
      predictions
    };
  }

  /**
   * Helper: Correlación de Pearson entre dos arrays
   */
  private static pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + (val * y[i]), 0);
    const sumX2 = x.reduce((sum, val) => sum + (val ** 2), 0);
    const sumY2 = y.reduce((sum, val) => sum + (val ** 2), 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX ** 2)) * ((n * sumY2) - (sumY ** 2)));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // FASE 3: Simulador Inteligente Integrado

  /**
   * Simulador avanzado con múltiples escenarios y variables correlacionadas
   */
  static intelligentScenarioSimulator(
    baseParameters: {
      budget: number;
      timeline: number;
      zones: string[];
      channels: Array<{ id: string; cpa: number; capacity: number; roi: number }>;
      seasonality: number[];
    },
    constraints: {
      maxBudgetPerChannel: number;
      minROI: number;
      maxTimeframe: number;
    },
    iterations: number = 10000
  ): {
    optimalScenario: {
      budgetAllocation: Record<string, number>;
      expectedCustodios: number;
      timelineOptimal: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    alternativeScenarios: Array<{
      name: string;
      allocation: Record<string, number>;
      expectedResults: number;
      probability: number;
    }>;
    sensitivityAnalysis: Record<string, number>;
  } {
    const scenarios: Array<{
      allocation: Record<string, number>;
      results: number;
      cost: number;
      timeframe: number;
    }> = [];

    // Generar múltiples escenarios
    for (let i = 0; i < iterations; i++) {
      const allocation: Record<string, number> = {};
      let remainingBudget = baseParameters.budget;
      let totalResults = 0;
      let totalCost = 0;

      // Distribución aleatoria inteligente del presupuesto
      const channelPriorities = baseParameters.channels
        .map(channel => ({
          ...channel,
          efficiency: channel.roi / channel.cpa,
          randomFactor: Math.random()
        }))
        .sort((a, b) => (b.efficiency * b.randomFactor) - (a.efficiency * a.randomFactor));

      for (const channel of channelPriorities) {
        if (remainingBudget <= 0) break;

        const maxAllowable = Math.min(
          remainingBudget,
          constraints.maxBudgetPerChannel,
          channel.capacity * channel.cpa
        );

        const allocatedBudget = Math.random() * maxAllowable;
        const expectedCustodios = allocatedBudget / channel.cpa;
        
        allocation[channel.id] = allocatedBudget;
        totalResults += expectedCustodios;
        totalCost += allocatedBudget;
        remainingBudget -= allocatedBudget;
      }

      // Ajuste estacional
      const seasonalMultiplier = baseParameters.seasonality[
        Math.floor(Math.random() * baseParameters.seasonality.length)
      ];
      totalResults *= seasonalMultiplier;

      scenarios.push({
        allocation,
        results: totalResults,
        cost: totalCost,
        timeframe: baseParameters.timeline * (0.8 + Math.random() * 0.4)
      });
    }

    // Análisis de resultados
    scenarios.sort((a, b) => b.results - a.results);
    
    const optimalScenario = scenarios[0];
    const avgResults = scenarios.reduce((sum, s) => sum + s.results, 0) / scenarios.length;
    
    const riskLevel = optimalScenario.results > avgResults * 1.5 ? 'high' :
                     optimalScenario.results > avgResults * 1.2 ? 'medium' : 'low';

    // Escenarios alternativos (top 5%)
    const topScenarios = scenarios.slice(0, Math.max(1, Math.floor(scenarios.length * 0.05)));
    const alternativeScenarios = topScenarios.slice(1, 4).map((scenario, index) => ({
      name: `Escenario ${index + 2}`,
      allocation: scenario.allocation,
      expectedResults: scenario.results,
      probability: (topScenarios.length - index) / topScenarios.length
    }));

    // Análisis de sensibilidad
    const sensitivityAnalysis: Record<string, number> = {};
    baseParameters.channels.forEach(channel => {
      const channelScenarios = scenarios.filter(s => s.allocation[channel.id] > 0);
      if (channelScenarios.length > 0) {
        const correlation = this.pearsonCorrelation(
          channelScenarios.map(s => s.allocation[channel.id]),
          channelScenarios.map(s => s.results)
        );
        sensitivityAnalysis[channel.id] = correlation;
      }
    });

    return {
      optimalScenario: {
        budgetAllocation: optimalScenario.allocation,
        expectedCustodios: optimalScenario.results,
        timelineOptimal: optimalScenario.timeframe,
        riskLevel
      },
      alternativeScenarios,
      sensitivityAnalysis
    };
  }
}