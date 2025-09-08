import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthClosureAnalysis } from '@/hooks/useMonthClosureAnalysis';
import { Loader2, TrendingUp, TrendingDown, Target } from 'lucide-react';

export const MonthClosureCard = () => {
  const { data, isLoading } = useMonthClosureAnalysis();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

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
            Cierre Septiembre 2025
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
            <div className="text-xs text-destructive">↓8% vs agosto</div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-2">META: Superar agosto ({data.target.services} servicios)</div>
          
          {/* Pace Analysis */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ritmo actual:</span>
              <span>{data.currentPace}/día</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ritmo necesario:</span>
              <span>{data.requiredPace}/día</span>
            </div>
          </div>

          {/* Projection */}
          <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-center mb-3">
              <div className="text-sm font-medium text-muted-foreground mb-1">RESPUESTA: ¿Cómo cerramos septiembre?</div>
              <div className="text-3xl font-bold text-primary">${data.projection.gmv.toFixed(1)}M GMV</div>
              <div className="text-lg font-medium">{data.projection.services} servicios</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">vs Agosto 2025</div>
                <div className={`text-lg font-bold ${data.projection.services > data.target.services ? 'text-success' : 'text-destructive'}`}>
                  {data.projection.services > data.target.services ? '+' : ''}
                  {((data.projection.services - data.target.services) / data.target.services * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Probabilidad</div>
                <div className="text-lg font-bold text-primary">{data.projection.probability}%</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};