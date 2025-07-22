import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { RecruitmentMathEngine } from '@/lib/RecruitmentMathEngine';
import { useUnifiedRecruitmentMetrics } from '@/hooks/useUnifiedRecruitmentMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface SimulationParameters {
  budget: number;
  timeline: number;
  zones: string[];
  channels: Array<{ id: string; cpa: number; capacity: number; roi: number }>;
  seasonality: number[];
}

interface SimulationResults {
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
}

export const IntelligentSimulator = () => {
  const { metrics, loading } = useUnifiedRecruitmentMetrics();
  const [parameters, setParameters] = useState<SimulationParameters>({
    budget: 500000,
    timeline: 90,
    zones: ['Norte', 'Sur', 'Centro', 'Oeste'],
    channels: [
      { id: 'facebook', cpa: 3200, capacity: 50, roi: 320 },
      { id: 'google', cpa: 3800, capacity: 40, roi: 280 },
      { id: 'linkedin', cpa: 4500, capacity: 25, roi: 380 },
      { id: 'referidos', cpa: 2800, capacity: 30, roi: 450 },
      { id: 'eventos', cpa: 5200, capacity: 20, roi: 250 }
    ],
    seasonality: [1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.1, 1.0]
  });
  
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Inicializar parámetros con datos reales cuando esté disponible
  useEffect(() => {
    if (!loading && metrics) {
      setParameters(prev => ({
        ...prev,
        budget: metrics.financialMetrics.totalInvestment * 2, // Proyección para próximo período
        channels: prev.channels.map(channel => ({
          ...channel,
          cpa: metrics.financialMetrics.realCPA || channel.cpa
        }))
      }));
    }
  }, [metrics, loading]);

  const runSimulation = async () => {
    setIsSimulating(true);
    
    try {
      // Usar datos reales para constraints
      const constraints = {
        maxBudgetPerChannel: parameters.budget * 0.4, // Máximo 40% por canal
        minROI: 200,
        maxTimeframe: parameters.timeline
      };

      const simulationResults = RecruitmentMathEngine.intelligentScenarioSimulator(
        parameters,
        constraints,
        5000 // 5000 iteraciones para mayor precisión
      );

      setResults(simulationResults);
    } catch (error) {
      console.error('Error in simulation:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const updateChannelCPA = (channelId: string, newCPA: number) => {
    setParameters(prev => ({
      ...prev,
      channels: prev.channels.map(channel =>
        channel.id === channelId ? { ...channel, cpa: newCPA } : channel
      )
    }));
  };

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
    }
  };

  // Preparar datos para gráficos
  const allocationChartData = results ? 
    Object.entries(results.optimalScenario.budgetAllocation).map(([channel, amount]) => ({
      channel: channel.charAt(0).toUpperCase() + channel.slice(1),
      amount: Math.round(amount),
      percentage: ((amount / parameters.budget) * 100).toFixed(1)
    })) : [];

  const sensitivityChartData = results ?
    Object.entries(results.sensitivityAnalysis).map(([channel, sensitivity]) => ({
      channel: channel.charAt(0).toUpperCase() + channel.slice(1),
      sensitivity: (sensitivity * 100).toFixed(1)
    })) : [];

  return (
    <div className="space-y-6">
      {/* Parámetros de Simulación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parámetros de Simulación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Presupuesto Total</Label>
              <Input
                type="number"
                value={parameters.budget}
                onChange={(e) => setParameters(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Actual: ${metrics?.financialMetrics.totalInvestment.toLocaleString() || '0'}
              </p>
            </div>

            <div>
              <Label>Timeline (días)</Label>
              <div className="mt-2">
                <Slider
                  value={[parameters.timeline]}
                  onValueChange={([value]) => setParameters(prev => ({ ...prev, timeline: value }))}
                  max={365}
                  min={30}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>30 días</span>
                  <span className="font-medium">{parameters.timeline} días</span>
                  <span>365 días</span>
                </div>
              </div>
            </div>

            <Button onClick={runSimulation} disabled={isSimulating} className="w-full">
              {isSimulating ? 'Simulando...' : 'Ejecutar Simulación Inteligente'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Canales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parameters.channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm capitalize">{channel.id}</div>
                  <div className="text-xs text-muted-foreground">
                    Capacidad: {channel.capacity} | ROI: {channel.roi}%
                  </div>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={channel.cpa}
                    onChange={(e) => updateChannelCPA(channel.id, parseFloat(e.target.value) || 0)}
                    className="text-xs h-8"
                  />
                  <div className="text-xs text-muted-foreground">CPA</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Resultados de Simulación */}
      {results && (
        <div className="space-y-6">
          {/* Escenario Óptimo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Escenario Óptimo</CardTitle>
                <Badge className={getRiskColor(results.optimalScenario.riskLevel)}>
                  Riesgo: {results.optimalScenario.riskLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(results.optimalScenario.expectedCustodios)}
                  </div>
                  <div className="text-sm text-muted-foreground">Custodios Esperados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(results.optimalScenario.timelineOptimal)}
                  </div>
                  <div className="text-sm text-muted-foreground">Días Óptimos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${Math.round(parameters.budget / results.optimalScenario.expectedCustodios)}
                  </div>
                  <div className="text-sm text-muted-foreground">CPA Proyectado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {((results.optimalScenario.expectedCustodios * 15000 / parameters.budget - 1) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">ROI Esperado</div>
                </div>
              </div>

              {/* Gráfico de Asignación */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allocationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`$${value.toLocaleString()}`, 'Asignación']}
                      labelFormatter={(label) => `Canal: ${label}`}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Escenarios Alternativos y Análisis de Sensibilidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Escenarios Alternativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.alternativeScenarios.map((scenario, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{scenario.name}</h4>
                        <Badge variant="outline">
                          {(scenario.probability * 100).toFixed(0)}% prob.
                        </Badge>
                      </div>
                      <div className="text-lg font-bold">
                        {Math.round(scenario.expectedResults)} custodios
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Diferencia: {((scenario.expectedResults - results.optimalScenario.expectedCustodios) / results.optimalScenario.expectedCustodios * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis de Sensibilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sensitivityChartData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[-100, 100]} />
                      <YAxis dataKey="channel" type="category" width={60} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Sensibilidad']}
                      />
                      <Bar dataKey="sensitivity" fill="hsl(var(--secondary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Correlación entre asignación de presupuesto y resultados por canal
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};