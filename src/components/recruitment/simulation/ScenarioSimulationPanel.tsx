import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useScenarioSimulation } from "@/hooks/useScenarioSimulation";
import { useState } from "react";
import { 
  Zap, TrendingUp, Target, DollarSign, Clock, Shield, 
  BarChart3, Shuffle, Play, Settings2, AlertTriangle,
  TrendingDown, CheckCircle, XCircle
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, ScatterChart, Scatter, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart
} from "recharts";

export const ScenarioSimulationPanel = () => {
  const {
    predefinedScenarios,
    runMonteCarloSimulation,
    monteCarloResults,
    isRunningMonteCarlo,
    sensitivityData,
    optimizationResults,
    riskMetrics,
    compareStrategies,
    strategyComparisonResults,
    generateScenarios,
    generatedScenarios,
    isLoading,
    isLoadingComparison,
    isGeneratingScenarios
  } = useScenarioSimulation();

  const [selectedScenario, setSelectedScenario] = useState(predefinedScenarios[0]);
  const [customParameters, setCustomParameters] = useState({
    budget: 300000,
    timeline: 12,
    quality: 0.8,
    strategy: 'moderate' as 'aggressive' | 'moderate' | 'conservative'
  });

  const handleRunSimulation = () => {
    if (selectedScenario) {
      runMonteCarloSimulation(selectedScenario);
    }
  };

  const handleCompareAll = () => {
    compareStrategies(predefinedScenarios);
  };

  const handleGenerateScenarios = () => {
    generateScenarios({
      num_scenarios: 5,
      budget_range: [150000, 500000],
      timeline_range: [8, 20]
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Simulación de Escenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando simulador...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Simulador de Escenarios Avanzado
          </CardTitle>
          <CardDescription>
            Simulación Monte Carlo y análisis "Qué pasaría si" para optimización de estrategias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scenarios" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="scenarios">Escenarios</TabsTrigger>
              <TabsTrigger value="montecarlo">Monte Carlo</TabsTrigger>
              <TabsTrigger value="sensitivity">Sensibilidad</TabsTrigger>
              <TabsTrigger value="optimization">Optimización</TabsTrigger>
              <TabsTrigger value="risk">Análisis de Riesgo</TabsTrigger>
            </TabsList>

            <TabsContent value="scenarios" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Panel de configuración */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Configurar Escenario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Escenario Predefinido</Label>
                      <Select 
                        value={selectedScenario?.id} 
                        onValueChange={(value) => {
                          const scenario = predefinedScenarios.find(s => s.id === value);
                          if (scenario) setSelectedScenario(scenario);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedScenarios.map((scenario) => (
                            <SelectItem key={scenario.id} value={scenario.id}>
                              {scenario.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Presupuesto: ${customParameters.budget.toLocaleString()}</Label>
                        <Slider
                          value={[customParameters.budget]}
                          onValueChange={([value]) => setCustomParameters(prev => ({ ...prev, budget: value }))}
                          min={100000}
                          max={750000}
                          step={25000}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Timeline: {customParameters.timeline} semanas</Label>
                        <Slider
                          value={[customParameters.timeline]}
                          onValueChange={([value]) => setCustomParameters(prev => ({ ...prev, timeline: value }))}
                          min={6}
                          max={24}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Calidad mínima: {Math.round(customParameters.quality * 100)}%</Label>
                        <Slider
                          value={[customParameters.quality]}
                          onValueChange={([value]) => setCustomParameters(prev => ({ ...prev, quality: value }))}
                          min={0.5}
                          max={0.95}
                          step={0.05}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Estrategia</Label>
                        <Select 
                          value={customParameters.strategy} 
                          onValueChange={(value: 'aggressive' | 'moderate' | 'conservative') => 
                            setCustomParameters(prev => ({ ...prev, strategy: value }))
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
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleRunSimulation}
                        disabled={isRunningMonteCarlo}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {isRunningMonteCarlo ? 'Simulando...' : 'Simular'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleGenerateScenarios}
                        disabled={isGeneratingScenarios}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Generar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Escenarios predefinidos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Escenarios Predefinidos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {predefinedScenarios.map((scenario) => (
                      <Card 
                        key={scenario.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedScenario?.id === scenario.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedScenario(scenario)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{scenario.name}</h3>
                            <Badge variant={
                              scenario.parameters.strategy_type === 'aggressive' ? 'destructive' :
                              scenario.parameters.strategy_type === 'moderate' ? 'default' : 'secondary'
                            }>
                              {scenario.parameters.strategy_type}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>💰 ${scenario.parameters.recruitment_budget.toLocaleString()}</div>
                            <div>⏱️ {scenario.parameters.target_timeline_weeks} semanas</div>
                            <div>🎯 {Math.round(scenario.parameters.quality_threshold * 100)}% calidad</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Comparación de estrategias */}
              {strategyComparisonResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparación de Estrategias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Estrategia</th>
                            <th className="text-right p-2">Hires Esperados</th>
                            <th className="text-right p-2">Costo Total</th>
                            <th className="text-right p-2">Éxito</th>
                            <th className="text-right p-2">Costo/Hire</th>
                            <th className="text-right p-2">Riesgo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {strategyComparisonResults.map((result, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2 font-medium">{result.scenario_name}</td>
                              <td className="p-2 text-right">{Math.round(result.expected_hires)}</td>
                              <td className="p-2 text-right">${Math.round(result.expected_cost).toLocaleString()}</td>
                              <td className="p-2 text-right">
                                <Badge variant={result.success_probability > 0.7 ? 'default' : 'secondary'}>
                                  {Math.round(result.success_probability * 100)}%
                                </Badge>
                              </td>
                              <td className="p-2 text-right">${Math.round(result.cost_per_hire).toLocaleString()}</td>
                              <td className="p-2 text-right">
                                <Badge variant={result.risk_score < 0.3 ? 'default' : result.risk_score < 0.6 ? 'secondary' : 'destructive'}>
                                  {Math.round(result.risk_score * 100)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button onClick={handleCompareAll} disabled={isLoadingComparison}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Comparar Todas las Estrategias
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="montecarlo" className="space-y-6">
              {monteCarloResults ? (
                <div className="space-y-6">
                  {/* Estadísticas principales */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-sm text-muted-foreground">Hires Esperados</div>
                            <div className="text-2xl font-bold">{Math.round(monteCarloResults.statistics.mean_hires)}</div>
                            <div className="text-xs text-muted-foreground">
                              P10: {Math.round(monteCarloResults.statistics.p10_hires)} | 
                              P90: {Math.round(monteCarloResults.statistics.p90_hires)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-success" />
                          <div>
                            <div className="text-sm text-muted-foreground">Costo Promedio</div>
                            <div className="text-2xl font-bold">${Math.round(monteCarloResults.statistics.mean_cost / 1000)}k</div>
                            <div className="text-xs text-muted-foreground">
                              Varianza: ${Math.round(Math.sqrt(monteCarloResults.statistics.cost_variance) / 1000)}k
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <div>
                            <div className="text-sm text-muted-foreground">Prob. Éxito</div>
                            <div className="text-2xl font-bold">{Math.round(monteCarloResults.statistics.success_probability * 100)}%</div>
                            <div className="text-xs text-muted-foreground">
                              {monteCarloResults.iterations.toLocaleString()} simulaciones
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-warning" />
                          <div>
                            <div className="text-sm text-muted-foreground">Intervalos 95%</div>
                            <div className="text-lg font-bold">
                              {Math.round(monteCarloResults.confidence_intervals.hires_ci_95[0])}-
                              {Math.round(monteCarloResults.confidence_intervals.hires_ci_95[1])} hires
                            </div>
                            <div className="text-xs text-muted-foreground">Rango de confianza</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Distribuciones */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Distribución de Hires</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={generateHistogramData(monteCarloResults.outcomes.hires, 20)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bin" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => [value, 'Frecuencia']} />
                            <Area type="monotone" dataKey="frequency" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Distribución de Costos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={generateHistogramData(monteCarloResults.outcomes.costs, 20)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bin" tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: number) => [value, 'Frecuencia']}
                              labelFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                            />
                            <Area type="monotone" dataKey="frequency" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Scatter plot costo vs hires */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Relación Costo-Resultados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={monteCarloResults.outcomes.costs.slice(0, 1000).map((cost, i) => ({
                          cost,
                          hires: monteCarloResults.outcomes.hires[i]
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="cost" 
                            name="Costo"
                            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                          />
                          <YAxis type="number" dataKey="hires" name="Hires" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'cost' ? `$${Math.round(Number(value) / 1000)}k` : value,
                              name === 'cost' ? 'Costo' : 'Hires'
                            ]}
                          />
                          <Scatter dataKey="hires" fill="hsl(var(--primary))" fillOpacity={0.6} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                      Ejecuta una simulación Monte Carlo para ver los resultados
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sensitivity" className="space-y-6">
              {sensitivityData && sensitivityData.length > 0 ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Análisis de Sensibilidad</CardTitle>
                      <CardDescription>
                        Impacto de cada variable en los resultados de reclutamiento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sensitivityData.map((variable, index) => (
                          <Card key={variable.variable_name}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium capitalize">
                                  {variable.variable_name.replace('_', ' ')}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant={variable.impact_score > 0.5 ? 'destructive' : 
                                               variable.impact_score > 0.2 ? 'default' : 'secondary'}>
                                    Impacto: {Math.round(variable.impact_score * 100)}%
                                  </Badge>
                                  <Badge variant="outline">
                                    R²: {variable.variance_explained.toFixed(2)}
                                  </Badge>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <div className="text-sm text-muted-foreground mb-2">Correlación</div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-muted rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          variable.correlation > 0 ? 'bg-success' : 'bg-destructive'
                                        }`}
                                        style={{ width: `${Math.abs(variable.correlation) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-sm">
                                      {variable.correlation > 0 ? '+' : ''}{variable.correlation.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-sm text-muted-foreground mb-2">Recomendaciones</div>
                                  <div className="space-y-1">
                                    {variable.recommendations.slice(0, 2).map((rec, i) => (
                                      <div key={i} className="text-xs text-muted-foreground">
                                        • {rec}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Radar de Sensibilidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={sensitivityData.map(variable => ({
                          variable: variable.variable_name.replace('_', ' '),
                          impact: variable.impact_score * 100,
                          correlation: Math.abs(variable.correlation) * 100,
                          variance: variable.variance_explained * 100
                        }))}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="variable" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar 
                            name="Impacto" 
                            dataKey="impact" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary))" 
                            fillOpacity={0.2}
                          />
                          <Radar 
                            name="Correlación" 
                            dataKey="correlation" 
                            stroke="hsl(var(--success))" 
                            fill="hsl(var(--success))" 
                            fillOpacity={0.2}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                      El análisis de sensibilidad se está calculando...
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6">
              {optimizationResults ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Solución Óptima Recomendada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{optimizationResults.recommended_solution.cost.toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">Factor de Costo</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-success">{optimizationResults.recommended_solution.speed.toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">Factor de Velocidad</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-warning">{optimizationResults.recommended_solution.quality.toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">Factor de Calidad</div>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">Descripción de Estrategia:</div>
                        <div className="text-muted-foreground">{optimizationResults.recommended_solution.strategy_description}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Frontera de Pareto</CardTitle>
                      <CardDescription>Soluciones óptimas en el espacio multiobjetivo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart data={optimizationResults.pareto_front}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" dataKey="cost" name="Costo" />
                          <YAxis type="number" dataKey="speed" name="Velocidad" />
                          <Tooltip 
                            formatter={(value, name) => [Number(value).toFixed(2), name]}
                            labelFormatter={() => 'Solución Óptima'}
                          />
                          <Scatter 
                            dataKey="quality" 
                            fill="hsl(var(--primary))" 
                            name="Calidad"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Análisis de Trade-offs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        {optimizationResults.trade_offs.map((tradeoff, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">{tradeoff.scenario}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <div className="text-sm text-success font-medium mb-1">Ganancias:</div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {tradeoff.gains.map((gain, i) => (
                                    <li key={i} className="flex items-start gap-1">
                                      <CheckCircle className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                                      {gain}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <div className="text-sm text-destructive font-medium mb-1">Pérdidas:</div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {tradeoff.losses.map((loss, i) => (
                                    <li key={i} className="flex items-start gap-1">
                                      <XCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                                      {loss}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                      Calculando optimización multiobjetivo...
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              {riskMetrics ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-destructive" />
                          <div>
                            <div className="text-sm text-muted-foreground">Riesgo de Mercado</div>
                            <div className="text-2xl font-bold">{Math.round(riskMetrics.market_risk * 100)}%</div>
                            <div className="text-xs text-muted-foreground">Volatilidad histórica</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <div>
                            <div className="text-sm text-muted-foreground">Riesgo de Ejecución</div>
                            <div className="text-2xl font-bold">{Math.round(riskMetrics.execution_risk * 100)}%</div>
                            <div className="text-xs text-muted-foreground">Complejidad operativa</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-destructive" />
                          <div>
                            <div className="text-sm text-muted-foreground">Riesgo Financiero</div>
                            <div className="text-2xl font-bold">{Math.round(riskMetrics.financial_risk * 100)}%</div>
                            <div className="text-xs text-muted-foreground">Variabilidad presupuesto</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Shield className={`h-4 w-4 ${
                            riskMetrics.overall_risk_score < 0.3 ? 'text-success' :
                            riskMetrics.overall_risk_score < 0.6 ? 'text-warning' : 'text-destructive'
                          }`} />
                          <div>
                            <div className="text-sm text-muted-foreground">Riesgo General</div>
                            <div className="text-2xl font-bold">{Math.round(riskMetrics.overall_risk_score * 100)}%</div>
                            <div className="text-xs text-muted-foreground">Score combinado</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Perfil de Riesgo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={[{
                          category: 'Mercado',
                          risk: riskMetrics.market_risk * 100
                        }, {
                          category: 'Ejecución',
                          risk: riskMetrics.execution_risk * 100
                        }, {
                          category: 'Financiero',
                          risk: riskMetrics.financial_risk * 100
                        }, {
                          category: 'General',
                          risk: riskMetrics.overall_risk_score * 100
                        }]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="category" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar 
                            name="Riesgo %" 
                            dataKey="risk" 
                            stroke="hsl(var(--destructive))" 
                            fill="hsl(var(--destructive))" 
                            fillOpacity={0.3}
                          />
                          <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Riesgo']} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recomendaciones de Mitigación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {riskMetrics.market_risk > 0.5 && (
                          <div className="p-4 border border-destructive/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span className="font-medium text-destructive">Alto Riesgo de Mercado</span>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Diversificar estrategias por zona geográfica</li>
                              <li>• Implementar sistema de monitoreo de tendencias</li>
                              <li>• Establecer presupuesto de contingencia</li>
                            </ul>
                          </div>
                        )}

                        {riskMetrics.execution_risk > 0.5 && (
                          <div className="p-4 border border-warning/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-warning" />
                              <span className="font-medium text-warning">Riesgo de Ejecución Elevado</span>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Simplificar procesos de reclutamiento</li>
                              <li>• Incrementar recursos de coordinación</li>
                              <li>• Establecer checkpoints de seguimiento</li>
                            </ul>
                          </div>
                        )}

                        {riskMetrics.financial_risk > 0.5 && (
                          <div className="p-4 border border-destructive/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="h-4 w-4 text-destructive" />
                              <span className="font-medium text-destructive">Alto Riesgo Financiero</span>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Establecer límites de gasto por etapa</li>
                              <li>• Implementar aprobaciones escalonadas</li>
                              <li>• Revisar ROI por canal de reclutamiento</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground">
                      Calculando métricas de riesgo...
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Función auxiliar para generar histograma
const generateHistogramData = (data: number[], bins: number) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binSize = (max - min) / bins;
  
  const histogram = Array.from({ length: bins }, (_, i) => ({
    bin: min + i * binSize,
    frequency: 0
  }));
  
  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
    histogram[binIndex].frequency++;
  });
  
  return histogram;
};