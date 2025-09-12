import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Brain, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';
import { performSystematicBacktesting, validateCurrentMonthPrediction } from '@/utils/forecastBacktesting';
import { useAdvancedForecastEngine } from '@/hooks/useAdvancedForecastEngine';

const CalibrationDashboard = () => {
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  
  // Advanced forecast data
  const { data: advancedForecast, isLoading: forecastLoading } = useAdvancedForecastEngine();
  
  // Backtesting data
  const { data: backtestData, isLoading: backtestLoading, refetch: refetchBacktest } = useQuery({
    queryKey: ['forecast-backtesting'],
    queryFn: () => performSystematicBacktesting(6),
    enabled: false, // Manual trigger
    staleTime: 30 * 60 * 1000 // 30 minutes
  });
  
  // Current validation
  const { data: currentValidation, isLoading: validationLoading } = useQuery({
    queryKey: ['current-validation'],
    queryFn: validateCurrentMonthPrediction,
    refetchInterval: 60 * 60 * 1000, // Every hour
  });

  const runBacktest = async () => {
    setIsRunningBacktest(true);
    try {
      await refetchBacktest();
    } finally {
      setIsRunningBacktest(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-success';
    if (accuracy >= 80) return 'text-warning';
    return 'text-destructive';
  };

  const getModelPerformanceColor = (mape: number) => {
    if (mape <= 8) return 'success';
    if (mape <= 15) return 'warning';
    return 'destructive';
  };

  if (forecastLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calibración del Sistema de Forecasting</h2>
          <p className="text-muted-foreground">
            Monitoreo y evaluación de precisión en tiempo real
          </p>
        </div>
        <Button 
          onClick={runBacktest}
          disabled={isRunningBacktest}
          variant="outline"
        >
          {isRunningBacktest ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Ejecutando...
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4 mr-2" />
              Ejecutar Backtesting
            </>
          )}
        </Button>
      </div>

      {/* Current Performance Alert */}
      {currentValidation && (
        <Alert className={currentValidation.currentAccuracy < 80 ? "border-destructive" : "border-success"}>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <strong>Precisión actual del mes:</strong> {currentValidation.currentAccuracy.toFixed(1)}% 
            ({currentValidation.daysElapsed} días transcurridos)
            {currentValidation.recommendation && (
              <span className="block mt-1 text-sm">
                💡 {currentValidation.recommendation}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="backtesting">Backtesting</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnósticos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Precisión General</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {advancedForecast?.accuracy.expected.toFixed(1)}%
                </div>
                <Progress 
                  value={advancedForecast?.accuracy.expected || 0} 
                  className="mt-2" 
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Incertidumbre: ±{advancedForecast?.accuracy.uncertainty.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confianza del Sistema</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {((advancedForecast?.confidence.overall || 0) * 100).toFixed(1)}%
                </div>
                <Progress 
                  value={(advancedForecast?.confidence.overall || 0) * 100} 
                  className="mt-2" 
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {advancedForecast?.confidence.reasoning}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calidad de Datos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge variant="default">
                    {advancedForecast?.diagnostics.dataQuality === 'excellent' ? 'Excelente' :
                     advancedForecast?.diagnostics.dataQuality === 'good' ? 'Buena' :
                     advancedForecast?.diagnostics.dataQuality === 'fair' ? 'Regular' : 'Pobre'}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Consenso modelos:</span>
                    <span>{((advancedForecast?.diagnostics.modelAgreement || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Estabilidad:</span>
                    <span>{((advancedForecast?.diagnostics.trendStability || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Régimen Detectado</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
              <Badge variant="default">
                    {advancedForecast?.regime.regime.regime === 'normal' ? 'Normal' :
                     advancedForecast?.regime.regime.regime === 'exponential' ? 'Exponencial' :
                     advancedForecast?.regime.regime.regime === 'declining' ? 'Declive' : 'Volátil'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Confianza: {((advancedForecast?.regime.regime.confidence || 0) * 100).toFixed(0)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Current Prediction */}
          <Card>
            <CardHeader>
              <CardTitle>Predicción Actual del Ensemble</CardTitle>
              <CardDescription>
                {advancedForecast?.ensemble.methodology}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Servicios Proyectados</p>
                  <p className="text-3xl font-bold text-primary">
                    {advancedForecast?.ensemble.finalPrediction.services.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rango: {advancedForecast?.ensemble.uncertainty.lower.toLocaleString()} - {advancedForecast?.ensemble.uncertainty.upper.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GMV Proyectado</p>
                  <p className="text-3xl font-bold text-success">
                    ${(advancedForecast?.ensemble.finalPrediction.gmv / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confianza Ensemble</p>
                  <p className="text-3xl font-bold">
                    {((advancedForecast?.ensemble.finalPrediction.confidence || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {advancedForecast?.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {rec.includes('🔴') ? (
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                    )}
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {advancedForecast?.ensemble.individualModels.map((model) => (
              <Card key={model.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {model.name}
                    <Badge variant={getModelPerformanceColor(model.mape)}>
                      MAPE: {model.mape.toFixed(1)}%
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Peso en ensemble: {((advancedForecast.ensemble.weights[model.name] || 0) * 100).toFixed(1)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Predicción</p>
                        <p className="text-lg font-semibold">{model.services.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confianza</p>
                        <p className="text-lg font-semibold">{(model.confidence * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tendencia</p>
                      <Badge variant={model.trend === 'increasing' ? 'success' : model.trend === 'decreasing' ? 'destructive' : 'secondary'}>
                        {model.trend === 'increasing' ? 'Creciente' : model.trend === 'decreasing' ? 'Decreciente' : 'Estable'}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Parámetros</p>
                      <div className="text-xs space-y-1">
                        {Object.entries(model.parameters).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span>{key}:</span>
                            <span>{typeof value === 'number' ? value.toFixed(3) : value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Backtesting Tab */}
        <TabsContent value="backtesting" className="space-y-4">
          {backtestLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : backtestData ? (
            <>
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>MAPE Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getAccuracyColor(100 - backtestData.summary.servicesMAPE)}`}>
                      {backtestData.summary.servicesMAPE.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Precisión: {(100 - backtestData.summary.servicesMAPE).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mejor Modelo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {backtestData.summary.bestModel}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total meses evaluados: {backtestData.summary.totalMonths}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance por Modelo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {backtestData.modelComparison.map((model) => (
                        <div key={model.name} className="flex justify-between items-center">
                          <span className="text-sm">{model.name}</span>
                          <Badge variant={getModelPerformanceColor(model.mape)}>
                            {model.mape.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Historical Results Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Resultados Históricos de Backtesting</CardTitle>
                  <CardDescription>
                    Comparación entre predicciones y valores reales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={backtestData.results.filter(r => r.model === backtestData.summary.bestModel)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="actualServices" 
                        stroke="hsl(var(--primary))" 
                        name="Servicios Reales"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predictedServices" 
                        stroke="hsl(var(--success))" 
                        name="Servicios Predichos"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Error Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Errores por Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={backtestData.results.filter(r => r.model === backtestData.summary.bestModel)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="servicesAPE" 
                        fill="hsl(var(--warning))" 
                        name="Error Absoluto (%)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay datos de backtesting</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Ejecuta el backtesting para evaluar la precisión histórica del sistema
                </p>
                <Button onClick={runBacktest} disabled={isRunningBacktest}>
                  {isRunningBacktest ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Ejecutando...
                    </>
                  ) : (
                    'Ejecutar Backtesting'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Diagnostics Tab */}
        <TabsContent value="diagnostics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Consenso entre Modelos</span>
                      <span className="text-sm font-medium">
                        {((advancedForecast?.diagnostics.modelAgreement || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(advancedForecast?.diagnostics.modelAgreement || 0) * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Fuerza de Estacionalidad</span>
                      <span className="text-sm font-medium">
                        {((advancedForecast?.diagnostics.seasonalityStrength || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(advancedForecast?.diagnostics.seasonalityStrength || 0) * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Estabilidad de Tendencia</span>
                      <span className="text-sm font-medium">
                        {((advancedForecast?.diagnostics.trendStability || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(advancedForecast?.diagnostics.trendStability || 0) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis de Régimen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Régimen Detectado</p>
                    <p className="text-lg font-semibold">
                      {advancedForecast?.regime.regime.regime === 'normal' ? 'Normal' :
                       advancedForecast?.regime.regime.regime === 'exponential' ? 'Exponencial' :
                       advancedForecast?.regime.regime.regime === 'declining' ? 'Declive' : 'Volátil'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Puntos de Cambio</p>
                    <p className="text-lg font-semibold">
                      {advancedForecast?.regime.regime.changepoints?.length || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Justificación Matemática</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {advancedForecast?.regime.mathematicalJustification}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Month Validation */}
          {currentValidation && (
            <Card>
              <CardHeader>
                <CardTitle>Validación del Mes Actual</CardTitle>
                <CardDescription>
                  Evaluación en tiempo real de la precisión del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Precisión Actual</p>
                    <p className={`text-2xl font-bold ${getAccuracyColor(currentValidation.currentAccuracy)}`}>
                      {currentValidation.currentAccuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ritmo Proyectado</p>
                    <p className="text-2xl font-bold">
                      {(currentValidation.projectedServices / 30).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">servicios/día</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ritmo Actual</p>
                    <p className="text-2xl font-bold text-primary">
                      {currentValidation.currentPace.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">servicios/día</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalibrationDashboard;