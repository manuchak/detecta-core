import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCrmForecast, useCrmMetrics } from '@/hooks/useCrmForecast';
import { useCrmTrends } from '@/hooks/useCrmTrends';
import { CRMHeroCard, CRMMetricCard, type HealthStatus } from './CRMHeroCard';
import { Percent, Zap, Clock, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Progress } from '@/components/ui/progress';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(value);
}

const STAGE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function RevenueForecast() {
  const { data: forecast, isLoading: forecastLoading } = useCrmForecast();
  const { data: metrics, isLoading: metricsLoading } = useCrmMetrics();
  const { data: trends, isLoading: trendsLoading } = useCrmTrends();
  const [showDetails, setShowDetails] = useState(false);

  const isLoading = forecastLoading || metricsLoading || trendsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  // Determine health status based on progress
  const progressPercent = trends?.progressVsTarget || 0;
  const health: HealthStatus = progressPercent >= 80 ? 'healthy' 
    : progressPercent >= 50 ? 'warning' 
    : progressPercent > 0 ? 'critical' 
    : 'neutral';

  // Calculate required daily pace
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  
  const currentValue = metrics?.weightedForecast || 0;
  const targetValue = trends?.monthlyTarget || 0;
  const remaining = Math.max(0, targetValue - currentValue);
  const requiredDailyPace = daysRemaining > 0 ? remaining / daysRemaining : 0;
  const currentDailyPace = dayOfMonth > 0 ? currentValue / dayOfMonth : 0;

  const chartData = (forecast || []).map(stage => ({
    name: stage.stage_name,
    total: stage.total_value,
    weighted: stage.weighted_value,
    deals: stage.deals_count,
    probability: stage.deal_probability,
  }));

  const maxWeighted = Math.max(...chartData.map(d => d.weighted), 1);

  return (
    <div className="space-y-6">
      {/* Hero Card - Main Question: ¿Vamos a cumplir la meta? */}
      <CRMHeroCard
        title="¿Vamos a cumplir la meta?"
        value={formatCurrency(metrics?.weightedForecast || 0)}
        subtitle="Forecast ponderado (valor × probabilidad)"
        health={health}
        progress={targetValue > 0 ? {
          value: progressPercent,
          label: `${progressPercent.toFixed(0)}% de meta mensual`,
          target: formatCurrency(targetValue),
        } : undefined}
        trend={trends?.pipelineValueChange ? {
          value: trends.pipelineValueChange,
          label: 'vs mes anterior',
        } : undefined}
        secondaryMetrics={[
          { 
            label: 'Ritmo actual', 
            value: `${formatCurrency(currentDailyPace)}/día` 
          },
          { 
            label: 'Ritmo necesario', 
            value: `${formatCurrency(requiredDailyPace)}/día`,
            highlight: requiredDailyPace > currentDailyPace * 1.2
          },
          { 
            label: 'Días restantes', 
            value: `${daysRemaining}` 
          },
        ]}
      />

      {/* Secondary Metric Cards - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CRMMetricCard
          title="Win Rate"
          value={`${(metrics?.winRate || 0).toFixed(1)}%`}
          subtitle={`${metrics?.wonDeals || 0} ganados / ${(metrics?.wonDeals || 0) + (metrics?.lostDeals || 0)} cerrados`}
          icon={<Percent className="h-5 w-5 text-primary" />}
        />
        <CRMMetricCard
          title="Ciclo Promedio"
          value={`${metrics?.avgCycleTime || 0} días`}
          subtitle="Lead → Won"
          icon={<Clock className="h-5 w-5 text-primary" />}
        />
        <CRMMetricCard
          title="Sales Velocity"
          value={formatCurrency(metrics?.salesVelocity || 0)}
          subtitle="Capacidad de cierre por día"
          icon={<Zap className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* Collapsible Details */}
      <Collapsible open={showDetails} onOpenChange={setShowDetails}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Desglose por Etapa
            </span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 mt-4">
          {/* Forecast Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Valor Ponderado por Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis 
                      type="number" 
                      tickFormatter={formatCurrency}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatFullCurrency(value),
                        name === 'weighted' ? 'Valor Ponderado' : 'Valor Total'
                      ]}
                      labelFormatter={(label) => `Etapa: ${label}`}
                    />
                    <Bar 
                      dataKey="weighted" 
                      name="Valor Ponderado" 
                      radius={[0, 4, 4, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STAGE_COLORS[index % STAGE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stage Details */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {(forecast || []).map((stage, index) => (
                  <div key={stage.stage_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: STAGE_COLORS[index % STAGE_COLORS.length] }}
                        />
                        <span className="font-medium">{stage.stage_name}</span>
                        <span className="text-muted-foreground">
                          ({stage.deal_probability}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground text-xs">
                          {stage.deals_count} deals
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(stage.weighted_value)}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={(stage.weighted_value / maxWeighted) * 100} 
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
