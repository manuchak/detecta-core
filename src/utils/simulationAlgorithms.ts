// Algoritmos de simulación para análisis de escenarios de reclutamiento

interface BaseData {
  zones: any[];
  metrics: any[];
  services: any[];
}

interface SimulationScenario {
  id: string;
  name: string;
  parameters: {
    recruitment_budget: number;
    target_timeline_weeks: number;
    quality_threshold: number;
    zones_priority: string[];
    strategy_type: 'aggressive' | 'moderate' | 'conservative';
  };
}

interface MonteCarloResult {
  scenario_id: string;
  iterations: number;
  outcomes: {
    hires: number[];
    costs: number[];
    timelines: number[];
    success_rates: number[];
  };
  statistics: {
    mean_hires: number;
    p10_hires: number;
    p50_hires: number;
    p90_hires: number;
    mean_cost: number;
    cost_variance: number;
    success_probability: number;
  };
  confidence_intervals: {
    hires_ci_95: [number, number];
    cost_ci_95: [number, number];
    timeline_ci_95: [number, number];
  };
}

export const runMonteCarloSimulation = async (
  scenario: SimulationScenario,
  baseData: BaseData,
  iterations: number = 10000
): Promise<MonteCarloResult> => {
  const outcomes = {
    hires: [] as number[],
    costs: [] as number[],
    timelines: [] as number[],
    success_rates: [] as number[]
  };

  // Parámetros base del escenario
  const { recruitment_budget, target_timeline_weeks, quality_threshold, strategy_type } = scenario.parameters;
  
  // Factores de variabilidad según tipo de estrategia
  const variabilityFactors = {
    aggressive: { cost_variance: 0.3, timeline_variance: 0.4, success_variance: 0.25 },
    moderate: { cost_variance: 0.2, timeline_variance: 0.25, success_variance: 0.15 },
    conservative: { cost_variance: 0.1, timeline_variance: 0.15, success_variance: 0.1 }
  };

  const factors = variabilityFactors[strategy_type];

  for (let i = 0; i < iterations; i++) {
    // Simular variabilidad en costos (distribución normal)
    const costMultiplier = normalRandom(1, factors.cost_variance);
    const actualCost = recruitment_budget * Math.max(0.5, costMultiplier);

    // Simular variabilidad en timeline (distribución gamma)
    const timelineMultiplier = gammaRandom(2, factors.timeline_variance);
    const actualTimeline = target_timeline_weeks * Math.max(0.7, timelineMultiplier);

    // Simular éxito en reclutamiento basado en presupuesto y calidad
    const budgetFactor = Math.min(2, recruitment_budget / 200000); // normalizar contra 200k base
    const qualityPenalty = quality_threshold > 0.8 ? 0.8 : 1.0;
    const baseHireRate = 0.6 * budgetFactor * qualityPenalty;
    
    const successRate = Math.max(0.1, Math.min(0.95, 
      baseHireRate + normalRandom(0, factors.success_variance)
    ));

    // Calcular hires esperados
    const targetHires = Math.round(recruitment_budget / 15000); // ~15k por hire
    const actualHires = Math.round(targetHires * successRate);

    outcomes.hires.push(actualHires);
    outcomes.costs.push(actualCost);
    outcomes.timelines.push(actualTimeline);
    outcomes.success_rates.push(successRate);
  }

  // Calcular estadísticas
  const sortedHires = [...outcomes.hires].sort((a, b) => a - b);
  const sortedCosts = [...outcomes.costs].sort((a, b) => a - b);
  const sortedTimelines = [...outcomes.timelines].sort((a, b) => a - b);

  const statistics = {
    mean_hires: mean(outcomes.hires),
    p10_hires: percentile(sortedHires, 0.1),
    p50_hires: percentile(sortedHires, 0.5),
    p90_hires: percentile(sortedHires, 0.9),
    mean_cost: mean(outcomes.costs),
    cost_variance: variance(outcomes.costs),
    success_probability: outcomes.success_rates.filter(r => r > 0.7).length / iterations
  };

  const confidence_intervals = {
    hires_ci_95: [percentile(sortedHires, 0.025), percentile(sortedHires, 0.975)] as [number, number],
    cost_ci_95: [percentile(sortedCosts, 0.025), percentile(sortedCosts, 0.975)] as [number, number],
    timeline_ci_95: [percentile(sortedTimelines, 0.025), percentile(sortedTimelines, 0.975)] as [number, number]
  };

  return {
    scenario_id: scenario.id,
    iterations,
    outcomes,
    statistics,
    confidence_intervals
  };
};

export const analyzeSensitivity = async (baseData: BaseData) => {
  // Variables para análisis de sensibilidad
  const variables = [
    { name: 'recruitment_budget', base: 300000, variance: 0.3 },
    { name: 'quality_threshold', base: 0.8, variance: 0.2 },
    { name: 'timeline_weeks', base: 12, variance: 0.25 },
    { name: 'market_competition', base: 0.5, variance: 0.4 },
    { name: 'seasonal_factor', base: 1.0, variance: 0.3 }
  ];

  const sensitivityResults = [];

  for (const variable of variables) {
    // Simular variaciones de ±20% en cada variable
    const variations = [-0.2, -0.1, 0, 0.1, 0.2];
    const impacts = [];

    for (const variation of variations) {
      const adjustedValue = variable.base * (1 + variation);
      const impact = simulateVariableImpact(variable.name, adjustedValue, baseData);
      impacts.push(impact);
    }

    // Calcular correlación y score de impacto
    const correlation = calculateCorrelation(variations, impacts);
    const impactScore = Math.abs(correlation) * variance(impacts);
    const varianceExplained = Math.pow(correlation, 2);

    sensitivityResults.push({
      variable_name: variable.name,
      impact_score: impactScore,
      correlation: correlation,
      variance_explained: varianceExplained,
      recommendations: generateSensitivityRecommendations(variable.name, correlation, impactScore)
    });
  }

  return sensitivityResults.sort((a, b) => b.impact_score - a.impact_score);
};

export const optimizeMultiObjective = async (
  baseData: BaseData,
  scenarios: SimulationScenario[]
) => {
  // Generar puntos en el espacio de objetivos (costo, velocidad, calidad)
  const objectives = [];
  
  for (let cost = 0.5; cost <= 2.0; cost += 0.1) {
    for (let speed = 0.5; speed <= 2.0; speed += 0.1) {
      for (let quality = 0.5; quality <= 1.0; quality += 0.1) {
        const efficiency = calculateEfficiencyScore(cost, speed, quality, baseData);
        
        objectives.push({
          cost: cost,
          speed: speed,
          quality: quality,
          efficiency_score: efficiency
        });
      }
    }
  }

  // Encontrar frontera de Pareto
  const paretoFront = findParetoFront(objectives);
  
  // Encontrar solución recomendada (mejor balance)
  const recommendedSolution = paretoFront.reduce((best, current) => 
    current.efficiency_score > best.efficiency_score ? current : best
  );

  // Generar análisis de trade-offs
  const tradeOffs = [
    {
      scenario: 'Maximizar Velocidad',
      gains: ['Rápida cobertura de déficit', 'Respuesta ágil a demanda'],
      losses: ['Mayor costo por hire', 'Posible reducción en calidad']
    },
    {
      scenario: 'Minimizar Costos',
      gains: ['Mayor eficiencia financiera', 'ROI mejorado'],
      losses: ['Proceso más lento', 'Limitaciones en alcance']
    },
    {
      scenario: 'Maximizar Calidad',
      gains: ['Mejor retención', 'Mayor satisfacción'],
      losses: ['Proceso más costoso', 'Timeline extendido']
    }
  ];

  return {
    pareto_front: paretoFront,
    recommended_solution: {
      ...recommendedSolution,
      strategy_description: generateStrategyDescription(recommendedSolution)
    },
    trade_offs: tradeOffs
  };
};

export const generateScenarios = async (
  parameters: {
    num_scenarios: number;
    budget_range: [number, number];
    timeline_range: [number, number];
  },
  baseData: BaseData
) => {
  const scenarios = [];
  
  for (let i = 0; i < parameters.num_scenarios; i++) {
    const budget = randomBetween(parameters.budget_range[0], parameters.budget_range[1]);
    const timeline = randomBetween(parameters.timeline_range[0], parameters.timeline_range[1]);
    const quality = randomBetween(0.6, 0.95);
    
    const strategy_type = budget > 400000 ? 'aggressive' : 
                         budget > 250000 ? 'moderate' : 'conservative';
    
    scenarios.push({
      id: `generated_${i}`,
      name: `Escenario ${i + 1}`,
      parameters: {
        recruitment_budget: budget,
        target_timeline_weeks: timeline,
        quality_threshold: quality,
        zones_priority: selectRandomZones(baseData.zones),
        strategy_type: strategy_type as 'aggressive' | 'moderate' | 'conservative'
      }
    });
  }
  
  return scenarios;
};

export const compareStrategies = async (
  scenarios: SimulationScenario[],
  baseData: BaseData
) => {
  const comparisons = [];
  
  for (const scenario of scenarios) {
    const simulation = await runMonteCarloSimulation(scenario, baseData, 1000);
    
    comparisons.push({
      scenario_name: scenario.name,
      expected_hires: simulation.statistics.mean_hires,
      expected_cost: simulation.statistics.mean_cost,
      success_probability: simulation.statistics.success_probability,
      cost_per_hire: simulation.statistics.mean_cost / simulation.statistics.mean_hires,
      risk_score: calculateRiskScore(simulation),
      confidence_level: calculateConfidenceLevel(simulation)
    });
  }
  
  return comparisons.sort((a, b) => b.success_probability - a.success_probability);
};

export const calculateRiskMetrics = async (
  baseData: BaseData,
  scenarios: SimulationScenario[]
) => {
  const riskMetrics = {
    market_risk: calculateMarketRisk(baseData),
    execution_risk: calculateExecutionRisk(scenarios),
    financial_risk: calculateFinancialRisk(scenarios),
    overall_risk_score: 0
  };
  
  riskMetrics.overall_risk_score = 
    (riskMetrics.market_risk + riskMetrics.execution_risk + riskMetrics.financial_risk) / 3;
  
  return riskMetrics;
};

// Funciones auxiliares
const normalRandom = (mean: number = 0, stdDev: number = 1): number => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
};

const gammaRandom = (shape: number, scale: number): number => {
  // Aproximación simple para distribución gamma
  let sum = 0;
  for (let i = 0; i < shape; i++) {
    sum += -Math.log(Math.random());
  }
  return sum * scale;
};

const mean = (arr: number[]): number => 
  arr.reduce((sum, val) => sum + val, 0) / arr.length;

const variance = (arr: number[]): number => {
  const m = mean(arr);
  return arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
};

const percentile = (sortedArr: number[], p: number): number => {
  const index = Math.ceil(sortedArr.length * p) - 1;
  return sortedArr[Math.max(0, index)];
};

const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
};

const simulateVariableImpact = (variableName: string, value: number, baseData: BaseData): number => {
  // Simular impacto de cambio en variable sobre resultado
  switch (variableName) {
    case 'recruitment_budget':
      return Math.log(value / 100000) * 10; // Log scaling
    case 'quality_threshold':
      return (1 - value) * 20; // Inverse relationship
    case 'timeline_weeks':
      return Math.max(0, (20 - value) * 2); // Diminishing returns
    default:
      return value * normalRandom(1, 0.1);
  }
};

const generateSensitivityRecommendations = (
  variableName: string,
  correlation: number,
  impactScore: number
): string[] => {
  const recommendations = [];
  
  if (impactScore > 0.5) {
    recommendations.push(`${variableName} es una variable crítica - monitorear de cerca`);
  }
  
  if (Math.abs(correlation) > 0.7) {
    recommendations.push(`Cambios en ${variableName} tienen impacto predecible - ajustar con precisión`);
  }
  
  if (correlation > 0.5) {
    recommendations.push(`Incrementar ${variableName} mejorará resultados`);
  } else if (correlation < -0.5) {
    recommendations.push(`Reducir ${variableName} mejorará resultados`);
  }
  
  return recommendations;
};

const calculateEfficiencyScore = (cost: number, speed: number, quality: number, baseData: BaseData): number => {
  // Función de utilidad multiobjetivo
  const costWeight = 0.3;
  const speedWeight = 0.4;
  const qualityWeight = 0.3;
  
  // Normalizar y combinar (menor costo = mejor, mayor velocidad = mejor, mayor calidad = mejor)
  const normalizedCost = Math.max(0, 2 - cost); // Invertir costo
  const normalizedSpeed = speed;
  const normalizedQuality = quality;
  
  return costWeight * normalizedCost + speedWeight * normalizedSpeed + qualityWeight * normalizedQuality;
};

const findParetoFront = (objectives: any[]): any[] => {
  const paretoFront = [];
  
  for (const candidate of objectives) {
    let isDominated = false;
    
    for (const other of objectives) {
      if (other !== candidate) {
        // Verificar si 'other' domina a 'candidate'
        if ((other.cost <= candidate.cost || other.speed >= candidate.speed || other.quality >= candidate.quality) &&
            (other.cost < candidate.cost || other.speed > candidate.speed || other.quality > candidate.quality)) {
          isDominated = true;
          break;
        }
      }
    }
    
    if (!isDominated) {
      paretoFront.push(candidate);
    }
  }
  
  return paretoFront;
};

const generateStrategyDescription = (solution: any): string => {
  if (solution.cost > 1.5 && solution.speed > 1.5) {
    return "Estrategia de inversión intensiva para rápida expansión";
  } else if (solution.quality > 0.9) {
    return "Estrategia premium enfocada en máxima calidad";
  } else if (solution.cost < 1.0) {
    return "Estrategia eficiente orientada a minimizar costos";
  } else {
    return "Estrategia balanceada con enfoque multiobjetivo";
  }
};

const randomBetween = (min: number, max: number): number => 
  Math.random() * (max - min) + min;

const selectRandomZones = (zones: any[]): string[] => {
  const numZones = Math.min(3, Math.floor(Math.random() * zones.length) + 1);
  const shuffled = [...zones].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numZones).map(z => z.id);
};

const calculateRiskScore = (simulation: MonteCarloResult): number => {
  const variance = simulation.statistics.cost_variance;
  const successProbability = simulation.statistics.success_probability;
  
  // Riesgo alto = alta varianza, baja probabilidad de éxito
  return (variance / simulation.statistics.mean_cost) * (1 - successProbability);
};

const calculateConfidenceLevel = (simulation: MonteCarloResult): number => {
  const ciWidth = simulation.confidence_intervals.hires_ci_95[1] - 
                  simulation.confidence_intervals.hires_ci_95[0];
  const mean = simulation.statistics.mean_hires;
  
  // Confianza alta = CI estrecho relativo a la media
  return Math.max(0, 1 - (ciWidth / mean));
};

const calculateMarketRisk = (baseData: BaseData): number => {
  // Calcular riesgo de mercado basado en volatilidad histórica
  const monthlyServices = groupServicesByMonth(baseData.services);
  const counts = Object.values(monthlyServices).map(services => services.length);
  
  if (counts.length < 2) return 0.5; // Riesgo medio por default
  
  const volatility = Math.sqrt(variance(counts)) / mean(counts);
  return Math.min(1, volatility * 2); // Escalar a 0-1
};

const calculateExecutionRisk = (scenarios: SimulationScenario[]): number => {
  // Riesgo basado en agresividad de escenarios
  const aggressiveCount = scenarios.filter(s => s.parameters.strategy_type === 'aggressive').length;
  const totalCount = scenarios.length;
  
  return aggressiveCount / totalCount; // Más escenarios agresivos = mayor riesgo
};

const calculateFinancialRisk = (scenarios: SimulationScenario[]): number => {
  // Riesgo basado en variabilidad de presupuestos
  const budgets = scenarios.map(s => s.parameters.recruitment_budget);
  const budgetVariability = Math.sqrt(variance(budgets)) / mean(budgets);
  
  return Math.min(1, budgetVariability);
};

const groupServicesByMonth = (services: any[]): Record<string, any[]> => {
  return services.reduce((groups, service) => {
    if (!service.fecha_hora_cita) return groups;
    
    const date = new Date(service.fecha_hora_cita);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(service);
    
    return groups;
  }, {} as Record<string, any[]>);
};