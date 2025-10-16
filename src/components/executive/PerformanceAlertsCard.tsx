import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthClosureAnalysis } from '@/hooks/useMonthClosureAnalysis';
import { useYearOverYearComparison } from '@/hooks/useYearOverYearComparison';
import { Loader2, AlertTriangle, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { getContextualPaceStatus } from '@/utils/paceStatus';

interface Alert {
  level: 'critical' | 'warning' | 'success';
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PerformanceAlertsCard = () => {
  const { data: monthData, isLoading: monthLoading } = useMonthClosureAnalysis();
  const { data: yearData, isLoading: yearLoading } = useYearOverYearComparison();

  if (monthLoading || yearLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!monthData || !yearData) return null;

  const alerts: Alert[] = [];

  // AOV Alert using MTD comparison
  const aovGrowth = monthData.mtdComparison.growth.aov;
  const aovMessage = `AOV ${monthData.mtdComparison.periodLabel.current}: ${aovGrowth >= 0 ? '+' : ''}${aovGrowth.toFixed(1)}% vs ${monthData.mtdComparison.periodLabel.previous}`;
  
  if (aovGrowth < -5) {
    alerts.push({
      level: 'critical',
      message: aovMessage,
      icon: AlertTriangle
    });
  } else if (aovGrowth < 0) {
    alerts.push({
      level: 'warning',
      message: aovMessage,
      icon: AlertCircle
    });
  } else {
    alerts.push({
      level: 'success',
      message: aovMessage,
      icon: CheckCircle
    });
  }

  // YoY Growth Alert
  if (yearData.growth.servicesPercent < -15) {
    alerts.push({
      level: 'critical',
      message: `Empresa ${yearData.growth.servicesPercent}% vs 2024 YTD`,
      icon: AlertTriangle
    });
  }

  // Month closure alert
  if (monthData.status === 'Por debajo') {
    alerts.push({
      level: 'critical',
      message: `${monthData.current.monthName} por debajo de ${monthData.previousMonth.monthName}`,
      icon: AlertTriangle
    });
  } else if (monthData.status === 'Igual') {
    alerts.push({
      level: 'warning',
      message: `${monthData.current.monthName} igual que ${monthData.previousMonth.monthName}`,
      icon: AlertCircle
    });
  } else {
    alerts.push({
      level: 'success',
      message: `${monthData.current.monthName} supera ${monthData.previousMonth.monthName}`,
      icon: CheckCircle
    });
  }

  // Contextual Pace Alert - Using MTD comparison for accurate growth
  const contextualPace = getContextualPaceStatus(
    monthData.currentPace,
    monthData.requiredPace,
    monthData.requiredPaceForPrevMonth,
    monthData.mtdComparison.growth.services, // ✅ MTD comparison instead of partial vs full month
    monthData.status
  );

  const paceIconMap = {
    check: CheckCircle,
    alert: AlertCircle,
    x: AlertTriangle
  };

  const paceLevelMap = {
    excellent: 'success' as const,
    good: 'success' as const,
    warning: 'warning' as const,
    critical: 'critical' as const
  };

  alerts.push({
    level: paceLevelMap[contextualPace.level],
    message: contextualPace.message,
    icon: paceIconMap[contextualPace.icon]
  });

  const alertStyles = {
    critical: 'text-destructive bg-destructive/10 border-destructive/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    success: 'text-success bg-success/10 border-success/20'
  };

  const criticalAlerts = alerts.filter(a => a.level === 'critical');

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Alertas Críticas
          </CardTitle>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse"></div>
            <span className="text-sm text-muted-foreground">{criticalAlerts.length} críticas</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Alerts List */}
        <div className="space-y-2">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded-lg border ${alertStyles[alert.level]}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            );
          })}
        </div>

        {/* Priority Actions */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3">PRIORIDADES</div>
          <div className="space-y-2">
            {aovGrowth < 0 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive"></div>
                <span className="text-sm">PRIORIDAD #1: Recuperar AOV</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive"></div>
              <span className="text-sm">PRIORIDAD #2: Acelerar captación</span>
            </div>
            {monthData.status === 'Supera' && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="text-sm">PRIORIDAD #3: Mantener momentum</span>
              </div>
            )}
          </div>
        </div>

        {/* Pace Details */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-primary" />
            Análisis de Ritmo Diario
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground mb-1">Ritmo Actual</div>
              <div className="text-base font-bold text-foreground">
                {contextualPace.details.currentPace.toFixed(2)} srv/día
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">vs {monthData.mtdComparison.periodLabel.previous}</div>
              <div className={`text-base font-bold ${contextualPace.details.momGrowthPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                {contextualPace.details.momGrowthPercent >= 0 ? '+' : ''}{contextualPace.details.momGrowthPercent.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Para Superar {monthData.previousMonth.monthName}</div>
              <div className={`text-base font-bold ${monthData.currentPace >= contextualPace.details.requiredPaceForPrevMonth ? 'text-success' : 'text-warning'}`}>
                {contextualPace.details.requiredPaceForPrevMonth.toFixed(2)} srv/día {monthData.currentPace >= contextualPace.details.requiredPaceForPrevMonth ? '✅' : '⚠️'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Para Meta Optimista</div>
              <div className={`text-base font-bold ${monthData.currentPace >= contextualPace.details.requiredPaceForTarget ? 'text-success' : 'text-muted-foreground'}`}>
                {contextualPace.details.requiredPaceForTarget.toFixed(2)} srv/día {monthData.currentPace >= contextualPace.details.requiredPaceForTarget ? '✅' : '🎯'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Gap vs 2024 YTD</div>
              <div className={`text-lg font-bold ${yearData.growth.servicesGap >= 0 ? 'text-success' : 'text-destructive'}`}>
                {yearData.growth.servicesGap >= 0 ? '+' : ''}{yearData.growth.servicesGap.toLocaleString()} srv
              </div>
              <div className="text-xs text-muted-foreground">
                ({yearData.growth.servicesPercent >= 0 ? '+' : ''}{yearData.growth.servicesPercent}%)
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Días restantes</div>
              <div className="text-lg font-bold">{monthData.daysRemaining}</div>
              <div className="text-xs text-muted-foreground">del mes actual</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};