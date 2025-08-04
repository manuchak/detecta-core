import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Target, 
  RefreshCw,
  BarChart3,
  Settings
} from 'lucide-react';
import { useEnhancedForecastEngine } from '@/hooks/useEnhancedForecastEngine';

interface ForecastComponentProps {
  component: number;
  weight: number;
  name: string;
  icon: React.ReactNode;
}

const ForecastComponent: React.FC<ForecastComponentProps> = ({ 
  component, 
  weight, 
  name, 
  icon 
}) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm font-medium">{name}</span>
    </div>
    <div className="text-right">
      <div className="text-sm font-bold">{component.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{(weight * 100).toFixed(1)}%</div>
    </div>
  </div>
);

export const EnhancedForecastDashboard: React.FC = () => {
  const {
    forecast,
    isLoading,
    alerts,
    performanceMetrics,
    resolveAlert,
    clearAllAlerts,
    triggerRecalibration,
    getRecommendations
  } = useEnhancedForecastEngine();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Generando forecast mejorado...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No se pudo generar el forecast. Verifique los datos de entrada.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const confidenceColor = 
    forecast.confidenceLevel === 'Alta' ? 'text-green-600' :
    forecast.confidenceLevel === 'Media' ? 'text-yellow-600' : 'text-red-600';

  const confidenceProgress = forecast.confidence * 100;

  return (
    <div className="space-y-6">
      {/* Header con resultados principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Forecast del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecast.forecast.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">servicios</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confianza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${confidenceColor}`}>
              {forecast.confidenceLevel}
            </div>
            <Progress value={confidenceProgress} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {confidenceProgress.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MAPE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecast.diagnostics.mape.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Target: &lt; 15%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Alertas del Sistema ({alerts.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearAllAlerts}
              >
                Resolver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <Alert key={alert.id}>
                <AlertDescription className="flex items-center justify-between">
                  <span>{alert.message}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnósticos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Descomposición del Forecast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ForecastComponent
                component={forecast.components.holtWinters}
                weight={forecast.weights.holtWinters}
                name="Holt-Winters"
                icon={<BarChart3 className="h-4 w-4" />}
              />
              <ForecastComponent
                component={forecast.components.linearTrend}
                weight={forecast.weights.linearTrend}
                name="Tendencia Lineal"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <ForecastComponent
                component={forecast.components.intraMonth}
                weight={forecast.weights.intraMonth}
                name="Proyección Intra-mes"
                icon={<Activity className="h-4 w-4" />}
              />
              <ForecastComponent
                component={forecast.components.acceleration}
                weight={forecast.weights.acceleration}
                name="Aceleración"
                icon={<Target className="h-4 w-4" />}
              />
              {forecast.components.externalAdjustment !== 0 && (
                <ForecastComponent
                  component={forecast.components.externalAdjustment}
                  weight={forecast.weights.external}
                  name="Factores Externos"
                  icon={<Settings className="h-4 w-4" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Calidad de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={
                    forecast.diagnostics.dataQuality === 'high' ? 'default' :
                    forecast.diagnostics.dataQuality === 'medium' ? 'secondary' : 'destructive'
                  }
                >
                  {forecast.diagnostics.dataQuality.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anomalías</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={forecast.diagnostics.anomaliesDetected ? 'destructive' : 'default'}
                >
                  {forecast.diagnostics.anomaliesDetected ? 'Detectadas' : 'No Detectadas'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {forecast.diagnostics.backtestResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Backtesting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {forecast.diagnostics.backtestResults.map((result, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">Período {result.period}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {result.actual} → {Math.round(result.forecast)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Error: {result.percentageError.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>MAPE Actual vs Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>MAPE Actual:</span>
                    <span className="font-bold">{performanceMetrics.currentMAPE.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MAPE Target:</span>
                    <span className="font-bold">{performanceMetrics.targetMAPE}%</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (performanceMetrics.targetMAPE / performanceMetrics.currentMAPE) * 100)}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Precisión</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={
                    performanceMetrics.accuracyTrend === 'improving' ? 'default' :
                    performanceMetrics.accuracyTrend === 'stable' ? 'secondary' : 'destructive'
                  }
                >
                  {performanceMetrics.accuracyTrend === 'improving' ? 'Mejorando' :
                   performanceMetrics.accuracyTrend === 'stable' ? 'Estable' : 'Degradando'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Control del Modelo</CardTitle>
                <Button 
                  onClick={triggerRecalibration}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalibrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Última recalibración: {performanceMetrics.lastRecalibration.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              {getRecommendations().length > 0 ? (
                <ul className="space-y-2">
                  {getRecommendations().map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No hay recomendaciones específicas en este momento.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Pasos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>• Monitoreo continuo de la precisión del forecast</div>
                <div>• Evaluación mensual de parámetros del modelo</div>
                <div>• Integración de factores externos adicionales</div>
                <div>• Validación de datos en tiempo real</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};