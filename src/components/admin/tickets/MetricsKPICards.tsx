import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketMetrics, formatDuration } from '@/hooks/useTicketMetrics';
import { Clock, CheckCircle, AlertTriangle, Star, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsKPICardsProps {
  metrics: TicketMetrics;
}

export const MetricsKPICards: React.FC<MetricsKPICardsProps> = ({ metrics }) => {
  const kpis = [
    {
      title: 'Primera Respuesta',
      value: formatDuration(metrics.avgFirstResponseTime),
      trend: metrics.trendFirstResponse,
      icon: Clock,
      description: 'Tiempo promedio de primera respuesta',
      color: 'blue'
    },
    {
      title: 'Tiempo Resolución',
      value: formatDuration(metrics.avgResolutionTime),
      trend: metrics.trendResolution,
      icon: CheckCircle,
      description: 'Tiempo promedio de resolución',
      color: 'green'
    },
    {
      title: 'Cumplimiento SLA',
      value: `${Math.round(metrics.slaComplianceRate)}%`,
      trend: metrics.trendSlaCompliance,
      icon: AlertTriangle,
      description: 'Tickets resueltos dentro del SLA',
      color: metrics.slaComplianceRate >= 90 ? 'green' : metrics.slaComplianceRate >= 70 ? 'amber' : 'red',
      badge: metrics.overdueTickets > 0 ? `${metrics.overdueTickets} vencidos` : undefined
    },
    {
      title: 'CSAT Promedio',
      value: metrics.avgCsat > 0 ? metrics.avgCsat.toFixed(1) : 'N/A',
      trend: metrics.trendCsat,
      icon: Star,
      description: 'Satisfacción del cliente (1-5)',
      color: metrics.avgCsat >= 4 ? 'green' : metrics.avgCsat >= 3 ? 'amber' : 'red'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400';
      case 'red':
        return 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400';
      default:
        return 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        
        return (
          <Card key={kpi.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${getColorClasses(kpi.color)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {kpi.trend !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${
                    kpi.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.trend > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(kpi.trend)}%
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{kpi.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{kpi.title}</div>
                {kpi.badge && (
                  <Badge variant="destructive" className="mt-2">
                    {kpi.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Volume summary */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{metrics.totalTickets}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{metrics.openTickets}</div>
              <div className="text-sm text-muted-foreground">Abiertos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{metrics.resolvedTickets}</div>
              <div className="text-sm text-muted-foreground">Resueltos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{metrics.overdueTickets}</div>
              <div className="text-sm text-muted-foreground">Vencidos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
