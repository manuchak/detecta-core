import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Zap, RefreshCw, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ScenarioConfig {
  name: string;
  budget: number;
  timeline: number; // weeks
  quality: number; // percentage
  strategy: 'aggressive' | 'moderate' | 'conservative';
  description: string;
}

interface SimulationResult {
  recruitedCustodians: number;
  successRate: number;
  timeToComplete: number;
  costPerCustodian: number;
  qualityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const predefinedScenarios: ScenarioConfig[] = [
  {
    name: 'Expansión Agresiva',
    budget: 100000,
    timeline: 8,
    quality: 70,
    strategy: 'aggressive',
    description: 'Reclutamiento acelerado para cubrir déficit rápidamente'
  },
  {
    name: 'Crecimiento Moderado',
    budget: 50000,
    timeline: 12,
    quality: 80,
    strategy: 'moderate',
    description: 'Balance entre velocidad y calidad de reclutamiento'
  },
  {
    name: 'Enfoque Conservador',
    budget: 30000,
    timeline: 16,
    quality: 90,
    strategy: 'conservative',
    description: 'Priorizando alta calidad y procesos seguros'
  }
];

export const ScenarioSimulator: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('scenarios');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig>(predefinedScenarios[0]);
  const [customConfig, setCustomConfig] = useState<ScenarioConfig>({
    name: 'Escenario Personalizado',
    budget: 50000,
    timeline: 12,
    quality: 80,
    strategy: 'moderate',
    description: 'Configuración personalizada'
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Datos base reales del sistema
  const CURRENT_ACTIVE_CUSTODIANS = 69;
  const MONTHLY_CHURN = 7;
  const CHURN_RATE = (MONTHLY_CHURN / CURRENT_ACTIVE_CUSTODIANS) * 100; // ~10.14%

  const simulateScenario = (config: ScenarioConfig): SimulationResult => {
    // Ratio de conversión de lead a custodio: 2.5%
    const LEAD_TO_CUSTODIAN_CONVERSION = 0.025;
    
    // Calcular leads necesarios basado en presupuesto
    // Asumiendo costo promedio por lead de $500
    const costPerLead = 500;
    const totalLeads = Math.floor(config.budget / costPerLead);
    
    // Ajustar cantidad de leads según estrategia
    const strategyMultiplier = {
      aggressive: 1.2, // Más leads por inversión en canales múltiples
      moderate: 1.0,
      conservative: 0.8 // Menos leads pero más calificados
    };
    
    const adjustedLeads = Math.floor(totalLeads * strategyMultiplier[config.strategy]);
    
    // Aplicar conversión base del 2.5%
    const baseCustodians = Math.floor(adjustedLeads * LEAD_TO_CUSTODIAN_CONVERSION);
    
    // Ajustar por calidad y tiempo
    const qualityMultiplier = config.quality > 85 ? 1.1 : 1.0; // Mayor calidad = mejor conversión
    const timeMultiplier = config.timeline > 12 ? 1.0 : 0.9; // Menos tiempo = menor conversión
    
    const recruitedCustodians = Math.floor(baseCustodians * qualityMultiplier * timeMultiplier);
    
    // Calcular tasa de éxito efectiva
    const effectiveConversionRate = recruitedCustodians / adjustedLeads;
    const successRate = (effectiveConversionRate / LEAD_TO_CUSTODIAN_CONVERSION) * 100;
    
    // Tiempo real para completar (estimado basado en el timeline configurado)
    const timeToComplete = config.timeline;
    
    // Costo por custodio
    const costPerCustodian = recruitedCustodians > 0 ? 
      Math.floor(config.budget / recruitedCustodians) : config.budget;
    
    // Score de calidad (basado en parámetros del escenario)
    const qualityScore = Math.min(100, config.quality);
    
    // Nivel de riesgo
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (config.strategy === 'aggressive' && config.timeline < 10) {
      riskLevel = 'high';
    } else if (config.strategy === 'conservative' && config.quality > 85) {
      riskLevel = 'low';
    }

    return {
      recruitedCustodians,
      successRate: Math.round(successRate * 100) / 100,
      timeToComplete,
      costPerCustodian,
      qualityScore: Math.round(qualityScore * 100) / 100,
      riskLevel
    };
  };

  const runSimulation = (config: ScenarioConfig) => {
    const result = simulateScenario(config);
    setSimulationResult(result);
    
    toast({
      title: "Simulación completada",
      description: `Escenario: ${config.name} - ${result.recruitedCustodians} custodios proyectados`,
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'aggressive': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-blue-100 text-blue-800';
      case 'conservative': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">

      {/* Simulador */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-light text-gray-900 flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5" />
            Simulador de Escenarios Avanzado
          </h3>
          <p className="text-sm text-gray-600">
            Simulación Monte Carlo y análisis "Qué pasaría si" para optimización de estrategias
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="scenarios">Escenarios</TabsTrigger>
            <TabsTrigger value="montecarlo">Monte Carlo</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensibilidad</TabsTrigger>
            <TabsTrigger value="optimization">Optimización</TabsTrigger>
            <TabsTrigger value="risk">Análisis de Riesgo</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Configuración */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">🔧 Configurar Escenario</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Escenario Predefinido
                      </label>
                      <Select
                        value={selectedScenario.name}
                        onValueChange={(value) => {
                          const scenario = predefinedScenarios.find(s => s.name === value);
                          if (scenario) setSelectedScenario(scenario);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un escenario" />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedScenarios.map((scenario) => (
                            <SelectItem key={scenario.name} value={scenario.name}>
                              {scenario.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Presupuesto: ${selectedScenario.budget.toLocaleString()}
                      </label>
                      <Slider
                        value={[selectedScenario.budget]}
                        onValueChange={([value]) => 
                          setSelectedScenario(prev => ({ ...prev, budget: value }))
                        }
                        min={10000}
                        max={200000}
                        step={5000}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeline: {selectedScenario.timeline} semanas
                      </label>
                      <Slider
                        value={[selectedScenario.timeline]}
                        onValueChange={([value]) => 
                          setSelectedScenario(prev => ({ ...prev, timeline: value }))
                        }
                        min={4}
                        max={24}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calidad mínima: {selectedScenario.quality}%
                      </label>
                      <Slider
                        value={[selectedScenario.quality]}
                        onValueChange={([value]) => 
                          setSelectedScenario(prev => ({ ...prev, quality: value }))
                        }
                        min={50}
                        max={95}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estrategia
                      </label>
                      <Select
                        value={selectedScenario.strategy}
                        onValueChange={(value: 'aggressive' | 'moderate' | 'conservative') =>
                          setSelectedScenario(prev => ({ ...prev, strategy: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aggressive">Agresiva</SelectItem>
                          <SelectItem value="moderate">Moderada</SelectItem>
                          <SelectItem value="conservative">Conservadora</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={() => runSimulation(selectedScenario)} 
                      className="w-full"
                      size="lg"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Simular
                    </Button>
                  </div>
                </div>
              </div>

              {/* Escenarios Predefinidos y Resultados */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Escenarios Predefinidos</h4>
                  <div className="space-y-3">
                    {predefinedScenarios.map((scenario) => (
                      <Card key={scenario.name} className="p-4 hover:bg-gray-50 cursor-pointer border"
                            onClick={() => setSelectedScenario(scenario)}>
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{scenario.name}</h5>
                          <Badge className={getStrategyColor(scenario.strategy)}>
                            {scenario.strategy}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                          <div>💰 ${scenario.budget.toLocaleString()}</div>
                          <div>⏱️ {scenario.timeline} semanas</div>
                          <div>🎯 {scenario.quality}% calidad</div>
                        </div>
                        <p className="text-xs text-gray-500">{scenario.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Resultados de Simulación */}
                {simulationResult && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">📊 Resultados de Simulación</h4>
                    <Card className="p-4 bg-green-50 border-green-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-light text-green-900">
                            {simulationResult.recruitedCustodians}
                          </div>
                          <div className="text-sm text-green-600">Custodios Reclutados</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-light text-green-900">
                            {simulationResult.successRate}%
                          </div>
                          <div className="text-sm text-green-600">Tasa de Éxito</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-light text-green-900">
                            {simulationResult.timeToComplete}
                          </div>
                          <div className="text-sm text-green-600">Semanas Reales</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-light text-green-900">
                            ${simulationResult.costPerCustodian.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-600">Costo por Custodio</div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm">
                          <span className="font-medium">Calidad Final:</span> {simulationResult.qualityScore}%
                        </div>
                        <Badge className={getRiskColor(simulationResult.riskLevel)}>
                          Riesgo {simulationResult.riskLevel}
                        </Badge>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="montecarlo" className="text-center py-12">
            <div className="text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Simulación Monte Carlo en desarrollo</p>
              <p className="text-sm">Análisis probabilístico con 1000+ iteraciones</p>
            </div>
          </TabsContent>

          <TabsContent value="sensitivity" className="text-center py-12">
            <div className="text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Análisis de Sensibilidad en desarrollo</p>
              <p className="text-sm">Impact de variables clave en resultados</p>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="text-center py-12">
            <div className="text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Optimización Automática en desarrollo</p>
              <p className="text-sm">Algoritmos genéticos para escenarios óptimos</p>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="text-center py-12">
            <div className="text-gray-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Análisis de Riesgo en desarrollo</p>
              <p className="text-sm">Evaluación de probabilidades de éxito</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Comparación */}
      <Card className="p-6">
        <Button className="w-full" variant="outline" size="lg">
          <BarChart3 className="w-4 h-4 mr-2" />
          Comparar Todas las Estrategias
        </Button>
      </Card>
    </div>
  );
};