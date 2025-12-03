import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, TrendingUp, TrendingDown, BarChart3, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { useAdoptionMetrics } from '../hooks/useAdoptionMetrics';

export default function AdoptionDashboard() {
  const { data: metrics, isLoading, error } = useAdoptionMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Error al cargar métricas de adopción</p>
        </CardContent>
      </Card>
    );
  }

  const getAdoptionBadge = (tasa: number) => {
    if (tasa >= 70) return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Excelente</Badge>;
    if (tasa >= 40) return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">En Progreso</Badge>;
    return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Bajo</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasa de Adopción Actual */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-corporate-blue/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tasa de Adopción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-corporate-blue">{metrics.mesActual.tasaAdopcion}%</span>
              {getAdoptionBadge(metrics.mesActual.tasaAdopcion)}
            </div>
            <Progress value={metrics.mesActual.tasaAdopcion} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: 100% de servicios planificados en Detecta</p>
          </CardContent>
        </Card>

        {/* Planificados vs Ejecutados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Servicios del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{metrics.mesActual.planificados}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-2xl text-muted-foreground">{metrics.mesActual.ejecutados}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-corporate-blue" />
                <span className="text-xs text-muted-foreground">Planificados</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                <span className="text-xs text-muted-foreground">Ejecutados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brecha de Digitalización */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Brecha de Digitalización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-amber-600">{metrics.mesActual.brechaServicios}</span>
              <span className="text-sm text-muted-foreground mb-1">servicios</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Servicios ejecutados sin planificar en Detecta
            </p>
          </CardContent>
        </Card>

        {/* Tendencia de Adopción */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {metrics.tendenciaMensual >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold ${metrics.tendenciaMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.tendenciaMensual >= 0 ? '+' : ''}{metrics.tendenciaMensual}
              </span>
              <span className="text-sm text-muted-foreground mb-1">puntos</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs. mes anterior ({metrics.mesAnterior.tasaAdopcion}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Líneas Comparativo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolución: Planificados vs Ejecutados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={metrics.historicoAdopcion}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="ejecutados"
                    fill="hsl(var(--muted))"
                    stroke="hsl(var(--muted-foreground))"
                    fillOpacity={0.3}
                    name="Ejecutados (Total)"
                  />
                  <Line
                    type="monotone"
                    dataKey="planificados"
                    stroke="hsl(220, 90%, 56%)"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(220, 90%, 56%)', strokeWidth: 2 }}
                    name="Planificados en Detecta"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras Apiladas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adopción por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.historicoAdopcion}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="planificados"
                    stackId="a"
                    fill="hsl(220, 90%, 56%)"
                    name="Planificados"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="sinPlanificar"
                    stackId="a"
                    fill="hsl(var(--muted))"
                    name="Sin Planificar"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Detalle y Proyección */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Detalle Mensual */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Detalle Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Mes</th>
                    <th className="text-right py-2 px-3 font-medium">Planificados</th>
                    <th className="text-right py-2 px-3 font-medium">Ejecutados</th>
                    <th className="text-right py-2 px-3 font-medium">Tasa</th>
                    <th className="text-center py-2 px-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.historicoAdopcion.map((h, idx) => (
                    <tr key={h.mes} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="py-2 px-3 capitalize">{h.mesLabel}</td>
                      <td className="text-right py-2 px-3 font-medium">{h.planificados}</td>
                      <td className="text-right py-2 px-3 text-muted-foreground">{h.ejecutados}</td>
                      <td className="text-right py-2 px-3 font-semibold">{h.tasaAdopcion}%</td>
                      <td className="text-center py-2 px-3">{getAdoptionBadge(h.tasaAdopcion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Proyección */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Proyección a 100%
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-corporate-blue/10 mb-3">
                <span className="text-2xl font-bold text-corporate-blue">{metrics.mesActual.tasaAdopcion}%</span>
              </div>
              <Progress value={metrics.mesActual.tasaAdopcion} className="h-3" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tendencia promedio:</span>
                <span className={`font-medium ${metrics.proyeccion.tendenciaPromedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.proyeccion.tendenciaPromedio >= 0 ? '+' : ''}{metrics.proyeccion.tendenciaPromedio}% / mes
                </span>
              </div>

              {metrics.proyeccion.fechaMeta100 ? (
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Meta proyectada</span>
                  </div>
                  <p className="text-lg font-semibold text-green-800 dark:text-green-300 capitalize mt-1">
                    {metrics.proyeccion.fechaMeta100}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Sin proyección</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Se requieren más datos históricos
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
