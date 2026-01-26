import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useCrmForecast, useCrmMetrics } from '@/hooks/useCrmForecast';
import { TrendingUp, TrendingDown, DollarSign, Target, Percent, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
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

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function MetricCard({ title, value, subtitle, icon, trend, trendValue }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trendValue && (
              <div className={`flex items-center gap-1 text-xs ${
                trend === 'up' ? 'text-green-600' :
                trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

  const isLoading = forecastLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

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
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pipeline Total"
          value={formatCurrency(metrics?.totalPipelineValue || 0)}
          subtitle={`${metrics?.openDeals || 0} deals abiertos`}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Forecast Ponderado"
          value={formatCurrency(metrics?.weightedForecast || 0)}
          subtitle="Valor × probabilidad"
          icon={<Target className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Win Rate"
          value={`${(metrics?.winRate || 0).toFixed(1)}%`}
          subtitle={`${metrics?.wonDeals || 0} ganados / ${(metrics?.wonDeals || 0) + (metrics?.lostDeals || 0)} cerrados`}
          icon={<Percent className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Ticket Promedio"
          value={formatCurrency(metrics?.avgDealSize || 0)}
          subtitle="Deals ganados"
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Desglose por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
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
                  width={120}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
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

      {/* Stage Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(forecast || []).map((stage, index) => (
              <div key={stage.stage_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STAGE_COLORS[index % STAGE_COLORS.length] }}
                    />
                    <span className="font-medium">{stage.stage_name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({stage.deal_probability}% prob.)
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground">
                      {stage.deals_count} deals
                    </span>
                    <span className="font-medium">
                      {formatCurrency(stage.weighted_value)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(stage.weighted_value / maxWeighted) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
