import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FacturacionMetrics, MetricasPorCliente } from '../hooks/useFacturacionMetrics';
import { FacturacionHeroBar } from './FacturacionHeroBar';
import { formatCurrency, formatNumber } from '@/utils/formatUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';

interface FacturacionDashboardProps {
  metrics: FacturacionMetrics;
  metricasPorCliente: MetricasPorCliente[];
  isLoading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function FacturacionDashboard({ 
  metrics, 
  metricasPorCliente, 
  isLoading 
}: FacturacionDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[72px] bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3 h-[400px] bg-muted/50 rounded-lg animate-pulse" />
          <div className="lg:col-span-2 h-[400px] bg-muted/50 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const top5Clientes = metricasPorCliente.slice(0, 5);
  const pieData = top5Clientes.map((c, i) => ({
    name: c.cliente.length > 18 ? c.cliente.substring(0, 18) + '...' : c.cliente,
    fullName: c.cliente,
    value: c.ingresos,
    percentage: c.porcentajeTotal,
    fill: COLORS[i % COLORS.length],
  }));

  // Insights calculados
  const kmPorServicio = metrics.serviciosCompletados > 0 
    ? Math.round(metrics.kmFacturables / metrics.serviciosCompletados) 
    : 0;
  const topClientePercent = top5Clientes.length > 0 
    ? top5Clientes[0].porcentajeTotal.toFixed(1) 
    : '0';
  const concentracionTop5 = top5Clientes.reduce((sum, c) => sum + c.porcentajeTotal, 0);

  return (
    <div className="space-y-3">
      {/* Hero KPIs Bar */}
      <FacturacionHeroBar metrics={metrics} isLoading={isLoading} />

      {/* Charts Row - Layout asimétrico con alturas iguales */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Bar Chart - 3/5 del ancho */}
        <Card className="lg:col-span-3 border-border/50 flex flex-col h-[calc(var(--vh-full)-260px)] min-h-[400px]">
          <CardHeader className="py-2.5 px-4 shrink-0">
            <CardTitle className="text-sm font-medium">Top 10 Clientes por Ingresos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 flex-1 min-h-0">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metricasPorCliente.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    horizontal={true}
                    vertical={false}
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    className="text-[10px]"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    dataKey="cliente" 
                    type="category" 
                    width={90}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.length > 14 ? v.substring(0, 14) + '...' : v}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{ 
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Bar 
                    dataKey="ingresos" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                    barSize={22}
                  >
                    <LabelList 
                      dataKey="ingresos" 
                      position="right" 
                      formatter={(value: number) => `$${(value/1000).toFixed(0)}k`}
                      className="fill-muted-foreground text-[9px]"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart + Insights - 2/5 del ancho */}
        <Card className="lg:col-span-2 border-border/50 flex flex-col h-[calc(var(--vh-full)-260px)] min-h-[400px]">
          <CardHeader className="py-2.5 px-4 shrink-0">
            <CardTitle className="text-sm font-medium">Concentración de Ingresos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="70%"
                    paddingAngle={1}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      fontSize: '11px',
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend compacta - altura fija */}
            <div className="space-y-1.5 my-3 shrink-0">
              {top5Clientes.map((c, i) => (
                <div key={c.cliente} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate flex-1" title={c.cliente}>{c.cliente}</span>
                  <span className="text-muted-foreground font-medium">
                    {c.porcentajeTotal.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Insights Panel - altura fija */}
            <div className="pt-2 border-t space-y-1.5 shrink-0">
              <h4 className="text-[10px] font-medium uppercase text-muted-foreground tracking-wide">
                Insights
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Top cliente:</span>
                  <span className="font-medium">{topClientePercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Top 5:</span>
                  <span className="font-medium">{concentracionTop5.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Km/servicio:</span>
                  <span className="font-medium">{formatNumber(kmPorServicio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clientes:</span>
                  <span className="font-medium">{metricasPorCliente.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
