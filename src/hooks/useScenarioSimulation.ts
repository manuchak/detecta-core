import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  runMonteCarloSimulation,
  analyzeSensitivity,
  optimizeMultiObjective,
  generateScenarios,
  calculateRiskMetrics,
  compareStrategies
} from "@/utils/simulationAlgorithms";

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
  results?: {
    predicted_hires: number;
    total_cost: number;
    time_to_completion: number;
    success_probability: number;
    risk_score: number;
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

interface SensitivityAnalysis {
  variable_name: string;
  impact_score: number;
  correlation: number;
  variance_explained: number;
  recommendations: string[];
}

interface OptimizationResult {
  pareto_front: Array<{
    cost: number;
    speed: number;
    quality: number;
    efficiency_score: number;
  }>;
  recommended_solution: {
    cost: number;
    speed: number;
    quality: number;
    strategy_description: string;
  };
  trade_offs: Array<{
    scenario: string;
    gains: string[];
    losses: string[];
  }>;
}

export const useScenarioSimulation = () => {
  // Obtener datos base para simulación
  const { data: baseData, isLoading: loadingBase } = useQuery({
    queryKey: ['simulation-base-data'],
    queryFn: async () => {
      const [zonesResult, metricsResult, servicesResult] = await Promise.all([
        supabase.from('zonas_operacion_nacional').select('*'),
        supabase.from('metricas_operacionales_zona').select('*'),
        supabase.from('servicios_custodia')
          .select('*')
          .gte('fecha_hora_cita', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      if (zonesResult.error) throw zonesResult.error;
      if (metricsResult.error) throw metricsResult.error;
      if (servicesResult.error) throw servicesResult.error;

      return {
        zones: zonesResult.data,
        metrics: metricsResult.data,
        services: servicesResult.data
      };
    },
  });

  // Escenarios predefinidos
  const predefinedScenarios: SimulationScenario[] = [
    {
      id: 'aggressive',
      name: 'Expansión Agresiva',
      parameters: {
        recruitment_budget: 500000,
        target_timeline_weeks: 8,
        quality_threshold: 0.7,
        zones_priority: ['high_demand'],
        strategy_type: 'aggressive'
      }
    },
    {
      id: 'moderate',
      name: 'Crecimiento Moderado', 
      parameters: {
        recruitment_budget: 300000,
        target_timeline_weeks: 12,
        quality_threshold: 0.8,
        zones_priority: ['medium_demand'],
        strategy_type: 'moderate'
      }
    },
    {
      id: 'conservative',
      name: 'Enfoque Conservador',
      parameters: {
        recruitment_budget: 150000,
        target_timeline_weeks: 16,
        quality_threshold: 0.9,
        zones_priority: ['stable_zones'],
        strategy_type: 'conservative'
      }
    }
  ];

  // Simulación Monte Carlo
  const monteCarloSimulation = useMutation({
    mutationFn: async (scenario: SimulationScenario): Promise<MonteCarloResult> => {
      if (!baseData) throw new Error('Base data not available');
      
      return runMonteCarloSimulation(scenario, baseData, 10000);
    },
  });

  // Análisis de sensibilidad
  const sensitivityAnalysis = useQuery({
    queryKey: ['sensitivity-analysis', baseData],
    queryFn: async (): Promise<SensitivityAnalysis[]> => {
      if (!baseData) return [];
      
      return analyzeSensitivity(baseData);
    },
    enabled: !!baseData,
  });

  // Optimización multiobjetivo
  const multiObjectiveOptimization = useQuery({
    queryKey: ['multi-objective-optimization', baseData],
    queryFn: async (): Promise<OptimizationResult> => {
      if (!baseData) throw new Error('Base data not available');
      
      return optimizeMultiObjective(baseData, predefinedScenarios);
    },
    enabled: !!baseData,
  });

  // Comparación de estrategias
  const strategyComparison = useMutation({
    mutationFn: async (scenarios: SimulationScenario[]) => {
      if (!baseData) throw new Error('Base data not available');
      
      return compareStrategies(scenarios, baseData);
    },
  });

  // Generar escenarios automáticamente
  const generateAutoScenarios = useMutation({
    mutationFn: async (parameters: {
      num_scenarios: number;
      budget_range: [number, number];
      timeline_range: [number, number];
    }) => {
      if (!baseData) throw new Error('Base data not available');
      
      return generateScenarios(parameters, baseData);
    },
  });

  // Calcular métricas de riesgo
  const riskMetrics = useQuery({
    queryKey: ['risk-metrics', baseData],
    queryFn: async () => {
      if (!baseData) return null;
      
      return calculateRiskMetrics(baseData, predefinedScenarios);
    },
    enabled: !!baseData,
  });

  return {
    baseData,
    predefinedScenarios,
    
    // Simulaciones
    runMonteCarloSimulation: monteCarloSimulation.mutate,
    monteCarloResults: monteCarloSimulation.data,
    isRunningMonteCarlo: monteCarloSimulation.isPending,
    
    // Análisis
    sensitivityData: sensitivityAnalysis.data,
    optimizationResults: multiObjectiveOptimization.data,
    riskMetrics: riskMetrics.data,
    
    // Operaciones
    compareStrategies: strategyComparison.mutate,
    strategyComparisonResults: strategyComparison.data,
    generateScenarios: generateAutoScenarios.mutate,
    generatedScenarios: generateAutoScenarios.data,
    
    // Estados de carga
    isLoading: loadingBase || sensitivityAnalysis.isLoading || multiObjectiveOptimization.isLoading,
    isLoadingComparison: strategyComparison.isPending,
    isGeneratingScenarios: generateAutoScenarios.isPending,
    
    // Errores
    error: monteCarloSimulation.error || strategyComparison.error || generateAutoScenarios.error,
  };
};