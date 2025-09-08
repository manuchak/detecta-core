import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Calculator, Eye } from "lucide-react";
import type { EnsembleForecastData } from "@/hooks/useEnsembleForecast";

interface ForecastValidationDashboardProps {
  forecast: EnsembleForecastData;
}

export function ForecastValidationDashboard({ forecast }: ForecastValidationDashboardProps) {
  if (!forecast?.advancedMetrics?.coherenceReport) {
    return null;
  }

  const coherence = forecast.advancedMetrics.coherenceReport;
  const enhanced = forecast.advancedMetrics.enhancedForecast;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'Alta': return 'text-green-600';
      case 'Media': return 'text-yellow-600';
      case 'Baja': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'Alta': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Media': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'Baja': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Validación del Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Coherence Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado de Coherencia</span>
                <Badge variant={coherence.isCoherent ? "default" : "destructive"}>
                  {coherence.isCoherent ? "Coherente" : "Requiere Ajuste"}
                </Badge>
              </div>
              <Progress 
                value={coherence.isCoherent ? 100 : 50} 
                className="h-2"
              />
            </div>

            {/* Confidence Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nivel de Confianza</span>
                <div className="flex items-center gap-1">
                  {getConfidenceIcon(coherence.confidence)}
                  <span className={`text-sm font-medium ${getConfidenceColor(coherence.confidence)}`}>
                    {coherence.confidence}
                  </span>
                </div>
              </div>
              <Progress 
                value={coherence.confidence === 'Alta' ? 90 : coherence.confidence === 'Media' ? 60 : 30} 
                className="h-2"
              />
            </div>

            {/* AOV Validation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AOV Desviación</span>
                <Badge variant={Math.abs(coherence.aovDeviation) < 10 ? "default" : "secondary"}>
                  {coherence.aovDeviation.toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                value={Math.max(0, 100 - Math.abs(coherence.aovDeviation))} 
                className="h-2"
              />
            </div>
          </div>

          {/* Validation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Comparación AOV</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AOV Implícito:</span>
                  <span>${coherence.aovImplied?.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AOV Esperado:</span>
                  <span>${coherence.aovExpected?.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desviación:</span>
                  <span className={Math.abs(coherence.aovDeviation) > 15 ? 'text-red-600' : 'text-green-600'}>
                    {coherence.aovDeviation.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Proyecciones GMV</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Directo:</span>
                  <span>${(coherence.gmvProjectionDirect / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicios × AOV:</span>
                  <span>${(coherence.gmvProjectionFromServices / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicios:</span>
                  <span>{coherence.servicesProjection?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Forecast Components */}
          {enhanced?.components && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Componentes del Forecast Mejorado
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-medium">${(enhanced.components.weeklyPattern / 1000000).toFixed(1)}M</div>
                  <div className="text-xs text-muted-foreground">Patrones Semanales</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-medium">${(enhanced.components.intraMonth / 1000000).toFixed(1)}M</div>
                  <div className="text-xs text-muted-foreground">Intra-Mes</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-medium">${(enhanced.components.servicesAOV / 1000000).toFixed(1)}M</div>
                  <div className="text-xs text-muted-foreground">Servicios×AOV</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-medium">${(enhanced.components.momentum / 1000000).toFixed(1)}M</div>
                  <div className="text-xs text-muted-foreground">Momentum</div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {coherence.alerts?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-yellow-600">Alertas de Validación</h4>
              {coherence.alerts.map((alert, index) => (
                <Alert key={index} className="text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{alert}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {coherence.recommendations?.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium text-blue-600">Recomendaciones</h4>
              <div className="space-y-1">
                {coherence.recommendations.map((rec, index) => (
                  <div key={index} className="text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-2 border-blue-400">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Methodology */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Metodología:</strong> {coherence.methodology}
            </p>
            {enhanced?.methodology && (
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Componentes:</strong> {enhanced.methodology.slice(0, 3).join(', ')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}