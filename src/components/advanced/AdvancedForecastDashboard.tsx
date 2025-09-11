/**
 * Dashboard avanzado para mostrar resultados del forecast matemático
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Target,
  BarChart3,
  Brain,
  Zap
} from 'lucide-react';
import { useAdvancedForecastEngine } from '@/hooks/useAdvancedForecastEngine';
import type { AdvancedForecastResult } from '@/hooks/useAdvancedForecastEngine';

export function AdvancedForecastDashboard() {
  const { forecast, isLoading, error } = useAdvancedForecastEngine();

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar el forecast avanzado: {error?.message || 'Datos no disponibles'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ForecastMetricCard
          title="Servicios Septiembre"
          value={forecast.monthlyServices}
          subtitle={`${forecast.intelligence.remainingDays} días restantes`}
          confidence={forecast.confidence.level}
          icon={<Target className="h-4 w-4" />}
        />
        
        <ForecastMetricCard
          title="GMV Septiembre"
          value={`$${(forecast.monthlyGMV / 1000000).toFixed(1)}M`}
          subtitle={`Rango: $${(forecast.confidence.intervals.gmv.p80_lower / 1000000).toFixed(1)}M - $${(forecast.confidence.intervals.gmv.p80_upper / 1000000).toFixed(1)}M`}
          confidence={forecast.confidence.level}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        
        <ForecastMetricCard
          title="Proyección Anual"
          value={`${forecast.annualServices.toLocaleString()} servicios`}
          subtitle={`$${(forecast.annualGMV / 1000000).toFixed(0)}M GMV`}
          confidence={forecast.confidence.level}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        
        <ForecastMetricCard
          title="Confianza del Modelo"
          value={`${(forecast.confidence.score * 100).toFixed(0)}%`}
          subtitle={`Consenso: ${(forecast.ensemble.consensus * 100).toFixed(0)}%`}
          confidence={forecast.confidence.level}
          icon={<Brain className="h-4 w-4" />}
        />
      </div>

      {/* Alertas */}
      {forecast.alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Alertas del Sistema</h3>
          <div className="grid gap-2">
            {forecast.alerts.map((alert, index) => (
              <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{alert.message}</strong>
                  <br />
                  <span className="text-sm text-muted-foreground">{alert.recommendation}</span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Tabs principales */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="scenarios">Escenarios</TabsTrigger>
          <TabsTrigger value="intelligence">Inteligencia</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab forecast={forecast} />
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <ModelsTab forecast={forecast} />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <ScenariosTab forecast={forecast} />
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <IntelligenceTab forecast={forecast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ForecastMetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  confidence: 'Alta' | 'Media' | 'Baja';
  icon: React.ReactNode;
}

function ForecastMetricCard({ title, value, subtitle, confidence, icon }: ForecastMetricCardProps) {
  const confidenceColor = confidence === 'Alta' ? 'text-green-600' : 
                          confidence === 'Media' ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <Badge variant="outline" className={`mt-2 ${confidenceColor}`}>
          {confidence} Confianza
        </Badge>
      </CardContent>
    </Card>
  );
}

function OverviewTab({ forecast }: { forecast: AdvancedForecastResult }) {
  return (
    <div className="grid gap-6">
      {/* Progreso del mes */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso del Mes Actual</CardTitle>
          <CardDescription>Septiembre 2025 - Análisis de Ritmo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso del mes</span>
              <span>{(forecast.intelligence.currentMonthProgress * 100).toFixed(1)}%</span>
            </div>
            <Progress value={forecast.intelligence.currentMonthProgress * 100} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{forecast.intelligence.remainingDays}</div>
              <div className="text-sm text-muted-foreground">Días restantes</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{forecast.intelligence.dailyPaceRequired}</div>
              <div className="text-sm text-muted-foreground">Servicios/día requeridos</div>
            </div>
            <div>
              <div className="text-2xl font-bold capitalize">{forecast.intelligence.momentum}</div>
              <div className="text-sm text-muted-foreground">Momentum</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de validación */}
      <Card>
        <CardHeader>
          <CardTitle>Validación del Modelo</CardTitle>
          <CardDescription>Métricas avanzadas de precisión</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{forecast.metrics.smape.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">sMAPE</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{forecast.metrics.mase.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">MASE</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{forecast.validation.crossValidation.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Cross-Validation</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{(forecast.intelligence.qualityScore * 100).toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Calidad</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ModelsTab({ forecast }: { forecast: AdvancedForecastResult }) {
  const models = forecast.ensemble.individual;
  const weights = forecast.ensemble.weights;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(models).map(([name, model]) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {name.charAt(0).toUpperCase() + name.slice(1)}
                <Badge variant="outline">
                  {(weights[name as keyof typeof weights] * 100).toFixed(0)}% peso
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Servicios:</span>
                  <span className="font-semibold">{model.services}</span>
                </div>
                <div className="flex justify-between">
                  <span>GMV:</span>
                  <span className="font-semibold">${(model.gmv / 1000000).toFixed(1)}M</span>
                </div>
                {'confidence' in model && (
                  <div className="flex justify-between">
                    <span>Confianza:</span>
                    <span className="font-semibold">{(model.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
                {'r2' in model && (
                  <div className="flex justify-between">
                    <span>R²:</span>
                    <span className="font-semibold">{model.r2.toFixed(3)}</span>
                  </div>
                )}
                {'successProbability' in model && (
                  <div className="flex justify-between">
                    <span>Prob. Éxito:</span>
                    <span className="font-semibold">{(model.successProbability * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consenso del Ensemble</CardTitle>
          <CardDescription>
            Nivel de acuerdo entre los modelos: {(forecast.ensemble.consensus * 100).toFixed(0)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={forecast.ensemble.consensus * 100} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {forecast.ensemble.consensus > 0.8 ? 'Alto consenso - Predicción confiable' :
             forecast.ensemble.consensus > 0.6 ? 'Consenso moderado - Revisar divergencias' :
             'Bajo consenso - Alta incertidumbre'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ScenariosTab({ forecast }: { forecast: AdvancedForecastResult }) {
  const scenarios = forecast.scenarios;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(scenarios).map(([name, scenario]) => (
          <Card key={name} className={name === 'realistic' ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <CardTitle className="capitalize flex items-center gap-2">
                {name}
                {name === 'realistic' && <Badge>Recomendado</Badge>}
              </CardTitle>
              <CardDescription>
                Probabilidad: {(scenario.probability * 100).toFixed(0)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Servicios:</span>
                  <span className="font-semibold">{scenario.services.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>GMV:</span>
                  <span className="font-semibold">${(scenario.gmv / 1000000).toFixed(1)}M</span>
                </div>
              </div>
              <Progress value={scenario.probability * 100} className="mt-4 h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intervalos de Confianza</CardTitle>
          <CardDescription>Rangos estadísticos para las predicciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Servicios</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>95% Inferior:</span>
                  <span>{forecast.confidence.intervals.services.lower.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>80% Inferior:</span>
                  <span>{forecast.confidence.intervals.services.p80_lower.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>80% Superior:</span>
                  <span>{forecast.confidence.intervals.services.p80_upper.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>95% Superior:</span>
                  <span>{forecast.confidence.intervals.services.upper.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">GMV</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>95% Inferior:</span>
                  <span>${(forecast.confidence.intervals.gmv.lower / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span>80% Inferior:</span>
                  <span>${(forecast.confidence.intervals.gmv.p80_lower / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span>80% Superior:</span>
                  <span>${(forecast.confidence.intervals.gmv.p80_upper / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span>95% Superior:</span>
                  <span>${(forecast.confidence.intervals.gmv.upper / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IntelligenceTab({ forecast }: { forecast: AdvancedForecastResult }) {
  const intelligence = forecast.intelligence;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Análisis de Momentum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Estado actual:</span>
                <Badge variant={
                  intelligence.momentum === 'accelerating' ? 'default' :
                  intelligence.momentum === 'stable' ? 'secondary' : 'destructive'
                }>
                  {intelligence.momentum === 'accelerating' ? 'Acelerando' :
                   intelligence.momentum === 'stable' ? 'Estable' : 'Desacelerando'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Ajuste estacional:</span>
                  <span>{(intelligence.seasonalAdjustment * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Score de calidad:</span>
                  <span>{(intelligence.qualityScore * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos de Validación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Outliers detectados:</span>
                <span>{forecast.validation.outlierAnalysis.outliers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Walk-forward MAPE:</span>
                <span>{forecast.validation.walkForward.mase.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Consistencia:</span>
                <span>{(forecast.validation.crossValidation.consistency * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Calidad de datos:</span>
                <Badge variant="outline">
                  {forecast.metadata.dataQuality === 'high' ? 'Alta' :
                   forecast.metadata.dataQuality === 'medium' ? 'Media' : 'Baja'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadatos del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Última actualización:</span>
                <span>{new Date(forecast.metadata.lastUpdated).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Performance del modelo:</span>
                <span>{forecast.metadata.modelPerformance}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Próxima recalibración:</span>
                <span>{new Date(forecast.metadata.nextRecalibration).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Versión del algoritmo:</span>
                <span>Advanced v2.0</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}