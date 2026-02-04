import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  MapPin,
  Percent,
  AlertTriangle
} from 'lucide-react';
import { FacturacionMetrics, MetricasPorCliente } from '../hooks/useFacturacionMetrics';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatUtils';
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Ingresos Brutos',
      value: formatCurrency(metrics.ingresosBrutos),
      icon: DollarSign,
      description: 'Total facturado',
      trend: 'up',
    },
    {
      title: 'Costos Operativos',
      value: formatCurrency(metrics.costosOperativos),
      icon: TrendingDown,
      description: 'Pagos a custodios',
      trend: 'neutral',
    },
    {
      title: 'Margen Bruto',
      value: formatCurrency(metrics.margenBruto),
      icon: TrendingUp,
      description: 'Utilidad operativa',
      trend: metrics.margenBruto > 0 ? 'up' : 'down',
    },
    {
      title: '% Margen',
      value: formatPercent(metrics.porcentajeMargen, false),
      icon: Percent,
      description: 'Rentabilidad',
      trend: metrics.porcentajeMargen > 40 ? 'up' : 'down',
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(metrics.ticketPromedio),
      icon: DollarSign,
      description: 'Por servicio',
      trend: 'neutral',
    },
    {
      title: 'Servicios',
      value: formatNumber(metrics.serviciosCompletados),
      icon: Package,
      description: 'Finalizados',
      trend: 'up',
    },
    {
      title: 'Km Facturables',
      value: formatNumber(metrics.kmFacturables),
      icon: MapPin,
      description: 'Total recorridos',
      trend: 'neutral',
    },
    {
      title: 'Cancelaciones',
      value: `${metrics.serviciosCancelados} (${metrics.tasaCancelacion.toFixed(1)}%)`,
      icon: AlertTriangle,
      description: 'Tasa de cancelación',
      trend: metrics.tasaCancelacion > 5 ? 'down' : 'up',
    },
  ];

  const top5Clientes = metricasPorCliente.slice(0, 5);
  const pieData = top5Clientes.map((c, i) => ({
    name: c.cliente.length > 20 ? c.cliente.substring(0, 20) + '...' : c.cliente,
    value: c.ingresos,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${
                kpi.trend === 'up' ? 'text-green-500' :
                kpi.trend === 'down' ? 'text-red-500' :
                'text-muted-foreground'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Clientes Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Clientes por Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metricasPorCliente.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <YAxis 
                    dataKey="cliente" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Cliente: ${label}`}
                  />
                  <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Concentración de Ingresos Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Concentración de Ingresos (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {top5Clientes.map((c, i) => (
                <div key={c.cliente} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate">{c.cliente}</span>
                  <span className="text-muted-foreground ml-auto">
                    {c.porcentajeTotal.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
