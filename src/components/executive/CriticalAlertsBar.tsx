/**
 * CriticalAlertsBar - Barra compacta de alertas críticas
 * Reemplaza PerformanceAlertsCard con versión simplificada
 */

import { useMonthClosureAnalysis } from '@/hooks/useMonthClosureAnalysis';
import { useYearOverYearComparison } from '@/hooks/useYearOverYearComparison';
import { AlertTriangle, CheckCircle, AlertCircle, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Alert {
  level: 'critical' | 'warning' | 'success';
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CriticalAlertsBar = () => {
  const { data: monthData, isLoading: monthLoading } = useMonthClosureAnalysis();
  const { data: yearData, isLoading: yearLoading } = useYearOverYearComparison();
  const [dismissed, setDismissed] = useState(false);

  if (monthLoading || yearLoading || !monthData || !yearData || dismissed) return null;

  const alerts: Alert[] = [];

  // AOV Alert
  const aovGrowth = monthData.mtdComparison.growth.aov;
  if (aovGrowth < -5) {
    alerts.push({
      level: 'critical',
      message: `AOV ${aovGrowth.toFixed(1)}%`,
      icon: TrendingDown
    });
  } else if (aovGrowth < 0) {
    alerts.push({
      level: 'warning',
      message: `AOV ${aovGrowth.toFixed(1)}%`,
      icon: TrendingDown
    });
  }

  // YoY Alert
  if (yearData.growth.servicesPercent < -10) {
    alerts.push({
      level: 'critical',
      message: `YTD ${yearData.growth.servicesPercent}% vs 2024`,
      icon: AlertTriangle
    });
  }

  // Month closure alert
  if (monthData.status === 'Por debajo') {
    alerts.push({
      level: 'critical',
      message: `${monthData.current.monthName} bajo ${monthData.previousMonth.monthName}`,
      icon: AlertTriangle
    });
  }

  // Pace alert
  if (monthData.currentPace < monthData.requiredPace) {
    const gap = ((monthData.currentPace / monthData.requiredPace) - 1) * 100;
    alerts.push({
      level: gap < -10 ? 'critical' : 'warning',
      message: `Ritmo ${gap.toFixed(0)}%`,
      icon: AlertCircle
    });
  }

  const criticalAlerts = alerts.filter(a => a.level === 'critical');
  const warningAlerts = alerts.filter(a => a.level === 'warning');

  // Si no hay alertas críticas ni warning, mostrar éxito compacto
  if (criticalAlerts.length === 0 && warningAlerts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg">
        <CheckCircle className="h-4 w-4 text-success" />
        <span className="text-sm text-success font-medium">Todo en orden</span>
        <Badge variant="outline" className="text-xs ml-auto">
          <TrendingUp className="h-3 w-3 mr-1" />
          {monthData.status}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-lg flex-wrap">
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-xs font-medium text-destructive">
          {criticalAlerts.length} crítica{criticalAlerts.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="flex items-center gap-1.5 flex-wrap">
        {alerts.slice(0, 4).map((alert, idx) => {
          const Icon = alert.icon;
          const bgClass = alert.level === 'critical' 
            ? 'bg-destructive/10 border-destructive/30 text-destructive' 
            : 'bg-warning/10 border-warning/30 text-warning';
          
          return (
            <Badge key={idx} variant="outline" className={`text-xs ${bgClass}`}>
              <Icon className="h-3 w-3 mr-1" />
              {alert.message}
            </Badge>
          );
        })}
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 w-6 p-0 ml-auto hover:bg-destructive/10"
        onClick={() => setDismissed(true)}
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  );
};
