import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyPerformance, PeriodoReporte } from '../hooks/useMyPerformance';
import { TrendingUp, TrendingDown, FileCheck, Clock, AlertCircle, BarChart3, Users, Shield, Minus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyPerformanceDashboard() {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('mes');
  const { data: metrics, isLoading, error } = useMyPerformance(periodo);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p>Error al cargar tus métricas</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No se pudieron cargar las métricas. Intenta recargar la página.
      </div>
    );
  }

  const COLORS = ['#22c55e', '#eab308', '#ef4444', '#f97316'];
  const pieData = [
    { name: 'Completados', value: metrics.desglosePorEstado.completados, color: '#22c55e' },
    { name: 'Pendientes', value: metrics.desglosePorEstado.pendientes, color: '#eab308' },
    { name: 'Cancelados', value: metrics.desglosePorEstado.cancelados, color: '#ef4444' },
    { name: 'Rechazados', value: metrics.desglosePorEstado.rechazados, color: '#f97316' },
  ].filter(item => item.value > 0);

  const periodoLabel = periodo === 'semana' ? 'esta semana' : periodo === 'mes' ? 'este mes' : 'este trimestre';

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-corporate-blue/10">
            <BarChart3 className="h-6 w-6 text-corporate-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mi Performance</h2>
            <p className="text-sm text-muted-foreground">
              Tu actividad y métricas personales
            </p>
          </div>
        </div>
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoReporte)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semana">Esta Semana</SelectItem>
            <SelectItem value="mes">Este Mes</SelectItem>
            <SelectItem value="trimestre">Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-corporate-blue">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Servicios Creados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{metrics.serviciosCreados}</span>
              <TendenciaIndicator valor={metrics.tendenciaServicios} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs {metrics.serviciosPeriodoAnterior} período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Aceptación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{metrics.tasaAceptacion.toFixed(1)}%</span>
              <TendenciaIndicator valor={metrics.tendenciaAceptacion} suffix="pp" />
            </div>
            <Progress value={metrics.tasaAceptacion} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">{metrics.desglosePorEstado.completados}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              de {metrics.serviciosCreados} creados {periodoLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incidencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-3xl font-bold">{metrics.incidencias}</span>
              </div>
              {metrics.incidencias < metrics.incidenciasAnterior && (
                <span className="text-xs text-green-500 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Mejorando
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rechazos + Cancelaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Custodios Distintos Asignados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{metrics.custodiosDistintos}</span>
            <p className="text-xs text-muted-foreground">Diversidad de recursos utilizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Armados Distintos Asignados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{metrics.armadosDistintos}</span>
            <p className="text-xs text-muted-foreground">Elementos armados coordinados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity per day */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Últimos 7 Días</CardTitle>
            <CardDescription>Servicios creados por día</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.actividadPorDia.some(d => d.cantidad > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.actividadPorDia}>
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Servicios']}
                    labelFormatter={(label) => `Día: ${label}`}
                  />
                  <Bar dataKey="cantidad" fill="hsl(var(--corporate-blue))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Sin actividad en los últimos 7 días
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription>Servicios {periodoLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Servicios']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Sin servicios en este período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period comparison */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Comparación vs Período Anterior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComparisonItem
              label="Servicios"
              actual={metrics.serviciosCreados}
              anterior={metrics.serviciosPeriodoAnterior}
              tendencia={metrics.tendenciaServicios}
            />
            <ComparisonItem
              label="Aceptación"
              actual={metrics.tasaAceptacion}
              anterior={metrics.tasaAceptacionAnterior}
              tendencia={metrics.tendenciaAceptacion}
              suffix="%"
              isPercentageChange
            />
            <ComparisonItem
              label="Incidencias"
              actual={metrics.incidencias}
              anterior={metrics.incidenciasAnterior}
              tendencia={metrics.incidenciasAnterior > 0 
                ? ((metrics.incidencias - metrics.incidenciasAnterior) / metrics.incidenciasAnterior) * 100 
                : 0}
              invertColors
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TendenciaIndicator({ valor, suffix = '%' }: { valor: number; suffix?: string }) {
  if (valor > 0) {
    return (
      <div className="flex items-center text-green-500 text-sm font-medium">
        <TrendingUp className="h-4 w-4 mr-1" />
        +{valor.toFixed(1)}{suffix}
      </div>
    );
  }
  if (valor < 0) {
    return (
      <div className="flex items-center text-red-500 text-sm font-medium">
        <TrendingDown className="h-4 w-4 mr-1" />
        {valor.toFixed(1)}{suffix}
      </div>
    );
  }
  return (
    <div className="flex items-center text-muted-foreground text-sm">
      <Minus className="h-4 w-4 mr-1" />
      Sin cambio
    </div>
  );
}

function ComparisonItem({ 
  label, 
  actual, 
  anterior, 
  tendencia, 
  suffix = '',
  invertColors = false,
  isPercentageChange = false
}: { 
  label: string; 
  actual: number; 
  anterior: number; 
  tendencia: number;
  suffix?: string;
  invertColors?: boolean;
  isPercentageChange?: boolean;
}) {
  const isPositive = invertColors ? tendencia < 0 : tendencia > 0;
  const isNegative = invertColors ? tendencia > 0 : tendencia < 0;
  
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div>
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">
            {typeof actual === 'number' && !isPercentageChange ? actual : actual.toFixed(1)}{suffix}
          </span>
          <span className="text-xs text-muted-foreground">
            vs {typeof anterior === 'number' && !isPercentageChange ? anterior : anterior.toFixed(1)}{suffix}
          </span>
        </div>
      </div>
      <div className={`flex items-center text-sm font-medium ${
        isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'
      }`}>
        {isPositive && <TrendingUp className="h-4 w-4 mr-1" />}
        {isNegative && <TrendingDown className="h-4 w-4 mr-1" />}
        {tendencia === 0 && '—'}
        {tendencia !== 0 && `${tendencia > 0 ? '+' : ''}${tendencia.toFixed(1)}${isPercentageChange ? 'pp' : '%'}`}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
