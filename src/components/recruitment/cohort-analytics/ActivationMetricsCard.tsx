import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Target } from "lucide-react";
import { useCohortAnalytics } from "@/hooks/useCohortAnalytics";

export const ActivationMetricsCard = () => {
  const { activationMetrics, isLoading } = useCohortAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Activación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activationMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Activación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">No hay datos disponibles</div>
        </CardContent>
      </Card>
    );
  }

  const isGoodActivation = activationMetrics.promedio_dias_activacion <= 7;
  const isFastActivation = activationMetrics.tasa_activacion_rapida >= 50;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Métricas de Activación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tiempo promedio de activación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tiempo Promedio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${isGoodActivation ? 'text-success' : 'text-warning'}`}>
              {activationMetrics.promedio_dias_activacion} días
            </span>
            {isGoodActivation ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-warning" />
            )}
          </div>
        </div>

        {/* Benchmark */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Benchmark: ≤ 7 días</span>
            <Badge variant={isGoodActivation ? "default" : "destructive"} className={isGoodActivation ? "bg-success text-success-foreground" : ""}>
              {isGoodActivation ? "✓ Alcanzado" : "⚠ Por debajo"}
            </Badge>
          </div>
        </div>

        {/* Estadísticas detalladas */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {activationMetrics.activaciones_rapidas_7d}
            </div>
            <div className="text-xs text-muted-foreground">Rápidas (≤7 días)</div>
            <div className="text-xs font-medium text-success">
              {activationMetrics.tasa_activacion_rapida}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {activationMetrics.activaciones_lentas_14d}
            </div>
            <div className="text-xs text-muted-foreground">Lentas (&gt;14 días)</div>
            <div className="text-xs font-medium text-destructive">
              {((activationMetrics.activaciones_lentas_14d / activationMetrics.total_activaciones) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Mediana */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mediana:</span>
            <span className="font-medium">{activationMetrics.mediana_dias_activacion} días</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total evaluados:</span>
            <span className="font-medium">{activationMetrics.total_activaciones}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};