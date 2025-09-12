import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthClosureAnalysis } from '@/hooks/useMonthClosureAnalysis';
import { useRealisticProjections } from '@/hooks/useRealisticProjections';
import { Loader2, TrendingUp, TrendingDown, Target, CheckCircle, XCircle } from 'lucide-react';
import { getStatusTextColor } from '@/utils/paceStatus';

export const MonthClosureCard = () => {
  const { data, isLoading } = useMonthClosureAnalysis();
  const { data: projectionData, isLoading: projectionLoading } = useRealisticProjections();

  if (isLoading || projectionLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !projectionData) return null;

  const statusColor = {
    'En riesgo': 'text-destructive',
    'En meta': 'text-warning', 
    'Superando': 'text-success'
  };

  const statusIcon = {
    'En riesgo': TrendingDown,
    'En meta': Target,
    'Superando': TrendingUp
  };

  const StatusIcon = statusIcon[data.status];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Estado Actual - Septiembre
          </CardTitle>
          <div className={`flex items-center gap-1 ${statusColor[data.status]}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{data.status}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Header */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Día {data.current.days} de 30</span>
          <span>Quedan {data.daysRemaining} días</span>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold">{data.current.services}</div>
            <div className="text-sm text-muted-foreground">Servicios</div>
          </div>
          <div>
            <div className="text-2xl font-bold">${data.current.gmv.toFixed(1)}M</div>
            <div className="text-sm text-muted-foreground">GMV actual</div>
          </div>
          <div>
            <div className="text-2xl font-bold">${data.current.aov.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">AOV</div>
            <div className={`text-xs ${data.mtdComparison.growth.aov >= 0 ? 'text-success' : 'text-destructive'}`}>
              {data.mtdComparison.growth.aov >= 0 ? '↑' : '↓'}{Math.abs(data.mtdComparison.growth.aov).toFixed(1)}% vs {data.mtdComparison.periodLabel.previous}
            </div>
          </div>
        </div>

        {/* Pace Analysis */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3">ANÁLISIS DE RITMO</div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ritmo actual:</span>
              <span className="font-medium">{data.currentPace}/día</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Meta agosto ({data.target.services} servicios):</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{data.requiredPace}/día</span>
                {data.paceStatus.status === 'exceeding' || data.paceStatus.status === 'on_track' ? (
                  <CheckCircle className={`h-4 w-4 ${getStatusTextColor(data.paceStatus.status)}`} />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Meta crecimiento:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{data.insights.paceNeeded}/día</span>
                {data.currentPace >= data.insights.paceNeeded ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-1">Resumen del mes:</div>
            <div className="text-muted-foreground">
              {data.status === 'Superando' ? 
                `Vas por buen camino para superar agosto. Mantén el ritmo de ${data.currentPace} servicios/día.` :
                data.status === 'En meta' ?
                `Estás en meta para igualar agosto. Necesitas ${data.requiredPace}/día para el resto del mes.` :
                `Necesitas acelerar a ${data.requiredPace}/día para alcanzar la meta de agosto.`
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};