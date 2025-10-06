import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMonthClosureAnalysis } from '@/hooks/useMonthClosureAnalysis';
import { Loader2, Calendar, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatNumber, formatGMV, formatPercent } from '@/utils/formatUtils';

export const MonthClosureCard = () => {
  const { data, isLoading: analysisLoading } = useMonthClosureAnalysis();

  if (analysisLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const statusConfig = {
    'En riesgo': { color: 'text-destructive', icon: AlertTriangle },
    'En meta': { color: 'text-success', icon: CheckCircle },
    'Superando': { color: 'text-primary', icon: TrendingUp }
  };

  const StatusIcon = statusConfig[data.status].icon;
  
  const getTrendIcon = (percent: number) => {
    if (percent > 0) return TrendingUp;
    if (percent < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (percent: number) => {
    if (percent > 0) return 'text-success';
    if (percent < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const progressPercent = (data.current.services / data.projection.services) * 100;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Progreso del Mes Actual
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {data.current.monthName} {data.current.year} • Día {data.current.days} de {data.current.days + data.daysRemaining}
            </p>
          </div>
          <div className={`flex items-center gap-1 ${statusConfig[data.status].color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{data.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            Meta dinámica: <span className="font-medium text-foreground">{formatNumber(data.projection.services)} srv</span> ({formatGMV(data.projection.gmv * 1_000_000)} / AOV ${formatNumber(data.current.aov)})
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Progreso hacia meta</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Current Stats with MoM comparison */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Servicios</div>
            <div className="text-xl font-bold">{data.current.services}</div>
            {(() => {
              const Icon = getTrendIcon(data.monthOverMonth.servicesPercent);
              return (
                <div className={`flex items-center gap-1 text-xs ${getTrendColor(data.monthOverMonth.servicesPercent)}`}>
                  <Icon className="h-3 w-3" />
                  <span>{data.monthOverMonth.servicesPercent > 0 ? '+' : ''}{data.monthOverMonth.servicesPercent}%</span>
                </div>
              );
            })()}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">GMV</div>
            <div className="text-xl font-bold">${data.current.gmv.toFixed(1)}M</div>
            {(() => {
              const Icon = getTrendIcon(data.monthOverMonth.gmvPercent);
              return (
                <div className={`flex items-center gap-1 text-xs ${getTrendColor(data.monthOverMonth.gmvPercent)}`}>
                  <Icon className="h-3 w-3" />
                  <span>{data.monthOverMonth.gmvPercent > 0 ? '+' : ''}{data.monthOverMonth.gmvPercent}%</span>
                </div>
              );
            })()}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">AOV</div>
            <div className="text-xl font-bold">${data.current.aov.toLocaleString()}</div>
            {(() => {
              const Icon = getTrendIcon(data.monthOverMonth.aovPercent);
              return (
                <div className={`flex items-center gap-1 text-xs ${getTrendColor(data.monthOverMonth.aovPercent)}`}>
                  <Icon className="h-3 w-3" />
                  <span>{data.monthOverMonth.aovPercent > 0 ? '+' : ''}{data.monthOverMonth.aovPercent}%</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Pace Analysis */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3">Análisis de Ritmo</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Actual:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{data.currentPace} srv/día</span>
                {data.paceStatus.status === 'exceeding' || data.paceStatus.status === 'on_track' ? (
                  <CheckCircle className="h-3 w-3 text-success" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Requerido:</span>
              <span className="font-medium">{data.requiredPace} srv/día</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gap:</span>
              <span className={`font-medium ${data.currentPace >= data.requiredPace ? 'text-success' : 'text-destructive'}`}>
                {data.currentPace >= data.requiredPace ? '+' : ''}{(data.currentPace - data.requiredPace).toFixed(1)} srv/día
              </span>
            </div>
          </div>
        </div>

        {/* MoM Comparison */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            📊 Comparativa MoM
            <span className="text-xs text-muted-foreground font-normal">vs {data.previousMonth.monthName}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`p-3 rounded-lg border ${
              data.monthOverMonth.servicesPercent >= 0 
                ? 'bg-success/10 border-success/20' 
                : 'bg-destructive/10 border-destructive/20'
            }`}>
              <div className="text-xs text-muted-foreground mb-1">Servicios</div>
              <div className={`text-lg font-bold ${
                data.monthOverMonth.servicesPercent >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {data.monthOverMonth.servicesChange >= 0 ? '+' : ''}{formatNumber(data.monthOverMonth.servicesChange)}
              </div>
              <div className={`text-xs font-medium ${
                data.monthOverMonth.servicesPercent >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {formatPercent(data.monthOverMonth.servicesPercent)}
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${
              data.monthOverMonth.gmvPercent >= 0 
                ? 'bg-success/10 border-success/20' 
                : 'bg-destructive/10 border-destructive/20'
            }`}>
              <div className="text-xs text-muted-foreground mb-1">GMV</div>
              <div className={`text-lg font-bold ${
                data.monthOverMonth.gmvPercent >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {data.monthOverMonth.gmvChange >= 0 ? '+' : ''}{formatGMV(data.monthOverMonth.gmvChange * 1_000_000)}
              </div>
              <div className={`text-xs font-medium ${
                data.monthOverMonth.gmvPercent >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {formatPercent(data.monthOverMonth.gmvPercent)}
              </div>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{data.previousMonth.monthName} (cierre):</span>
              <span className="font-medium">{formatNumber(data.previousMonth.services)} srv | {formatGMV(data.previousMonth.gmv * 1_000_000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{data.current.monthName} (proyección):</span>
              <span className="font-medium">{formatNumber(data.projection.services)} srv | {formatGMV(data.projection.gmv * 1_000_000)}</span>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {data.status === 'En riesgo' && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Acción Requerida</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Necesitas acelerar el ritmo a {data.insights.paceNeeded} servicios/día para cumplir la meta.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
