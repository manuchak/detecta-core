import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const FinancialSummaryPanel = () => {
  const { metrics, loading } = useFinancialMetrics();

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  if (loading || !metrics) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Finanzas MTD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-16 mb-2" />
                <div className="h-7 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
          <div className="h-[200px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const kpiItems = [
    {
      label: 'GMV',
      value: formatCurrency(metrics.gmvMTD),
      variation: metrics.gmvVariacion,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      label: 'Costos',
      value: formatCurrency(metrics.costosMTD),
      variation: metrics.costosVariacion,
      icon: <AlertCircle className="h-4 w-4" />,
      invertColor: true // Lower costs = green
    },
    {
      label: 'Margen Bruto',
      value: `${metrics.margenPorcentaje.toFixed(1)}%`,
      variation: metrics.margenVariacion,
      icon: <Percent className="h-4 w-4" />,
      isPercentageVar: true
    },
    {
      label: 'Apoyos Ext.',
      value: formatCurrency(metrics.apoyosExtraordinarios),
      variation: metrics.apoyosVariacion,
      icon: <TrendingDown className="h-4 w-4" />,
      invertColor: true
    }
  ];

  const chartData = metrics.dailyMargins.map(d => ({
    fecha: format(parseISO(d.fecha), 'dd', { locale: es }),
    fullDate: format(parseISO(d.fecha), 'dd MMM', { locale: es }),
    margen: d.margenPorcentaje,
    gmv: d.gmv,
    costos: d.costos
  }));

  const avgMargin = metrics.dailyMargins.length > 0
    ? metrics.dailyMargins.reduce((sum, d) => sum + d.margenPorcentaje, 0) / metrics.dailyMargins.length
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Finanzas MTD
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Margen promedio: {avgMargin.toFixed(1)}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpiItems.map((kpi, idx) => {
            const isPositive = kpi.invertColor ? kpi.variation <= 0 : kpi.variation >= 0;
            return (
              <div key={idx} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  {kpi.icon}
                  <span className="uppercase tracking-wide">{kpi.label}</span>
                </div>
                <div className="text-xl font-semibold text-foreground">
                  {kpi.value}
                </div>
                <div className={`flex items-center text-xs mt-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  <span>
                    {kpi.variation >= 0 ? '+' : ''}
                    {kpi.isPercentageVar ? `${kpi.variation.toFixed(1)}pp` : `${kpi.variation.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Daily Margin Chart */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">
            Margen Bruto Diario (últimos 14 días)
          </h4>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={45}
                />
                <ReferenceLine 
                  y={avgMargin} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: `Prom: ${avgMargin.toFixed(0)}%`, 
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 10,
                    position: 'right'
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium text-foreground">{data.fullDate}</p>
                          <p className="text-sm text-emerald-500">
                            Margen: {data.margen.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            GMV: {formatCurrency(data.gmv)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Costos: {formatCurrency(data.costos)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="margen" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
