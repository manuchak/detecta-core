import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, Calendar, Users, Activity, Minus } from "lucide-react";
import { DynamicRetentionMetrics as DynamicMetrics } from "@/utils/dynamicRetentionCalculator";
import { QuarterlyData } from "@/hooks/useRetentionDetails";

interface DynamicRetentionMetricsProps {
  metrics: DynamicMetrics;
  quarterlyData?: QuarterlyData[];
}

export function DynamicRetentionMetrics({ metrics, quarterlyData = [] }: DynamicRetentionMetricsProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "Alta";
    if (confidence >= 0.6) return "Media";
    return "Baja";
  };

  const getTrendIcon = (trend: number | string) => {
    if (typeof trend === 'string') {
      if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-600" />;
      if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-600" />;
      return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
    if (trend > 1.05) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0.95) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4 rounded-full bg-gray-400" />;
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Hace menos de 1 hora";
    if (diffHours === 1) return "Hace 1 hora";
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    return `Hace ${Math.floor(diffHours / 24)} días`;
  };

  return (
    <TooltipProvider>
      <Card className="border-dashed border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Permanencia Dinámica
              </CardTitle>
              <CardDescription>
                Cálculo automático basado en datos históricos reales
              </CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Este valor se actualiza automáticamente cada 24 horas considerando:
                  tendencias recientes, factores estacionales y permanencia histórica real.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Métrica principal - MEDIANA como valor típico */}
          <div className="text-center p-4 bg-secondary/30 rounded-lg">
            <div className="text-3xl font-bold text-primary">
              {metrics.tiempoMedianoPermanencia.toFixed(1)}
              <span className="text-base font-normal text-muted-foreground ml-1">meses</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Permanencia típica (mediana P50)
            </p>
            <div className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Info className="h-3 w-3" />
              <span>Promedio: {metrics.tiempoPromedioPermanencia.toFixed(1)}m</span>
            </div>
          </div>

          {/* Distribución de permanencia con percentiles */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Distribución de Permanencia</h4>
            
            {/* Rangos intercuartiles */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">50% de custodios permanecen:</span>
              <span className="font-semibold">
                {metrics.p25?.toFixed(1)}m - {metrics.p75?.toFixed(1)}m
              </span>
            </div>

            {/* Visualización de distribución */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12">P10</span>
                <div className="flex-1 h-2 bg-gradient-to-r from-red-200/50 via-yellow-200/50 via-green-200/50 to-blue-200/50 rounded-full relative">
                  <div 
                    className="absolute h-3 w-1 bg-primary -top-0.5 rounded-full"
                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">P90</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-12">
                <span>{metrics.p10?.toFixed(1)}m</span>
                <span className="font-semibold text-primary">{metrics.tiempoMedianoPermanencia.toFixed(1)}m</span>
                <span>{metrics.p90?.toFixed(1)}m</span>
              </div>
            </div>
          </div>

          {/* Detalles de cálculo */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1">
                  Tendencia
                  {getTrendIcon(metrics.tendenciaMensual)}
                </span>
                <span className="text-sm">
                  {((metrics.tendenciaMensual - 1) * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Factor estacional</span>
                <span className="text-sm">
                  {((metrics.factorEstacional - 1) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Custodios
                </span>
                <span className="text-sm">{metrics.custodiosAnalizados}</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confianza</span>
                  <Badge variant="outline" className="text-xs">
                    {getConfidenceLabel(metrics.confianza)}
                  </Badge>
                </div>
                <Progress 
                  value={metrics.confianza * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </div>

          {/* Quarterly Analysis */}
          {quarterlyData.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Análisis por Trimestre
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quarterlyData.map((q) => (
                  <div key={q.quarter} className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="text-xs text-muted-foreground mb-1">{q.quarter}</div>
                    <div className="text-lg font-bold text-primary">{q.avgPermanence.toFixed(1)}m</div>
                    <div className="text-xs flex items-center gap-1 mt-1">
                      {getTrendIcon(q.trend)}
                      <span>{q.avgRetention.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {q.custodians} custodios
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información de actualización */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>Última actualización: {formatLastUpdate(metrics.lastCalculated)}</span>
            <span className="font-mono">{metrics.metodologia}</span>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}