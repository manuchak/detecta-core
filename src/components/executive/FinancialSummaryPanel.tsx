import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const FinancialSummaryPanel = () => {
  const { metrics, loading } = useFinancialMetrics();

  const formatCurrency = (n: number | undefined) => {
    if (n === undefined || n === null) return '$0';
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
    costos: d.costos,
    costoCustodios: d.costoCustodios,
    costoCasetas: d.costoCasetas,
    costoArmados: d.costoArmados
  }));

  const avgMargin = metrics.dailyMargins.length > 0
    ? metrics.dailyMargins.reduce((sum, d) => sum + d.margenPorcentaje, 0) / metrics.dailyMargins.length
    : 0;

  // Find max cost for Y axis scale
  const maxCost = Math.max(...chartData.map(d => d.costoCustodios + d.costoCasetas + d.costoArmados));

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

        {/* Daily Margin Chart with Cost Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">
            Margen Bruto y Composición de Costos (últimos 14 días)
          </h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  domain={[0, maxCost * 1.2]}
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={55}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={45}
                />
                <ReferenceLine 
                  yAxisId="right"
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
                
                {/* Stacked areas with 50% opacity - subtle background */}
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="costoCustodios" 
                  stackId="costos"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.5}
                  stroke="none"
                  name="Custodios"
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="costoCasetas" 
                  stackId="costos"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.5}
                  stroke="none"
                  name="Casetas"
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="costoArmados" 
                  stackId="costos"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.5}
                  stroke="none"
                  name="Armados"
                />

                {/* Main margin line - protagonist */}
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="margen" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                  name="Margen %"
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
                          <p className="font-medium text-foreground mb-2">{data.fullDate}</p>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">
                              GMV: <span className="text-foreground font-medium">{formatCurrency(data.gmv)}</span>
                            </p>
                            <div className="border-t border-border pt-1 mt-1">
                              <p className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                                <span className="text-muted-foreground">Custodios:</span>
                                <span className="text-foreground">{formatCurrency(data.costoCustodios)}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                                <span className="text-muted-foreground">Casetas:</span>
                                <span className="text-foreground">{formatCurrency(data.costoCasetas)}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
                                <span className="text-muted-foreground">Armados:</span>
                                <span className="text-foreground">{formatCurrency(data.costoArmados)}</span>
                              </p>
                            </div>
                            <div className="border-t border-border pt-1 mt-1">
                              <p className="text-primary font-medium">
                                Margen: {data.margen.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-3 justify-center">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-1) / 0.5)' }} />
              Custodios
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-2) / 0.5)' }} />
              Casetas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-3) / 0.5)' }} />
              Armados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} />
              Margen %
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
