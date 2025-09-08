import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area, AreaChart 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, UserPlus, UserMinus, 
  Activity, Award, AlertTriangle, Calendar, Target
} from 'lucide-react';
import { useSupplyGrowthDetails } from '@/hooks/useSupplyGrowthDetails';

export function SupplyGrowthDetailView() {
  const { monthlyData, summary, qualityMetrics, loading } = useSupplyGrowthDetails();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="h-80 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const currentMonth = monthlyData[0];

  return (
    <div className="space-y-6">
      {/* Header KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Crecimiento Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${getTrendColor(currentMonth?.crecimientoPorcentual || 0)}`}>
              {getTrendIcon(currentMonth?.crecimientoPorcentual || 0)}
              {formatPercentage(currentMonth?.crecimientoPorcentual || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Custodios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.custodiosActivosActuales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevos (Año)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{summary.custodiosNuevosAnual}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 12 meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Promedio Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTrendColor(summary.crecimientoPromedioMensual)}`}>
              {formatPercentage(summary.crecimientoPromedioMensual)}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 12 meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Tendencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análisis de Tendencia - Supply Growth
              </CardTitle>
              <CardDescription>
                Evolución mensual del crecimiento de custodios activos
              </CardDescription>
            </div>
            <Badge variant={summary.tendencia === 'creciendo' ? 'default' : 
                           summary.tendencia === 'decreciendo' ? 'destructive' : 'secondary'}>
              {summary.tendencia === 'creciendo' ? 'Creciendo' :
               summary.tendencia === 'decreciendo' ? 'Decreciendo' : 'Estable'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={monthlyData.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="monthName" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'crecimientoPorcentual') return [formatPercentage(value), 'Crecimiento %'];
                  return [value, name === 'custodiosActivos' ? 'Custodios Activos' : name];
                }}
              />
              <Bar 
                yAxisId="right"
                dataKey="custodiosActivos" 
                fill="hsl(var(--primary))"
                opacity={0.3}
                radius={[4, 4, 0, 0]}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="crecimientoPorcentual" 
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Desglose de Flujo de Custodios y Métricas de Calidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flujo de Custodios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Flujo de Custodios (Últimos 6 Meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="monthName" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="custodiosNuevos" stackId="a" fill="#22c55e" name="Nuevos" />
                <Bar dataKey="custodiosReactivados" stackId="a" fill="#3b82f6" name="Reactivados" />
                <Bar dataKey="custodiosPerdidos" stackId="b" fill="#ef4444" name="Perdidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Métricas de Calidad del Supply */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Calidad del Supply
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {qualityMetrics.custodiosConMas5Servicios}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Con 5+ servicios
                  </div>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {qualityMetrics.custodiosConMenos1Servicio}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Con ≤1 servicio
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Servicios promedio/custodio</span>
                  <span className="text-lg font-bold">{qualityMetrics.promedioServiciosPorCustodio.toFixed(1)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ingreso promedio/custodio</span>
                  <span className="text-lg font-bold">
                    ${qualityMetrics.ingresoPromedioPorCustodio.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Con ingresos cero</span>
                  <span className="text-lg font-bold text-amber-600">
                    {qualityMetrics.custodiosConIngresosCero}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Ejecutivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumen Ejecutivo - Últimos 12 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Crecimiento Neto</div>
              <div className={`text-2xl font-bold ${getTrendColor(summary.crecimientoNetoAnual)}`}>
                {summary.crecimientoNetoAnual > 0 ? '+' : ''}{summary.crecimientoNetoAnual}
              </div>
              <div className="text-xs text-muted-foreground">custodios</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Mejor Mes</div>
              <div className="text-lg font-bold text-green-600">
                {summary.mejorMes.mes}
              </div>
              <div className="text-sm text-green-600">
                {formatPercentage(summary.mejorMes.crecimiento)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Mes Más Débil</div>
              <div className="text-lg font-bold text-red-600">
                {summary.peorMes.mes}
              </div>
              <div className="text-sm text-red-600">
                {formatPercentage(summary.peorMes.crecimiento)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Velocidad de Cambio</div>
              <div className={`text-lg font-bold flex items-center gap-1 ${getTrendColor(summary.velocidadCrecimiento)}`}>
                {getTrendIcon(summary.velocidadCrecimiento)}
                {formatPercentage(summary.velocidadCrecimiento)}
              </div>
              <div className="text-xs text-muted-foreground">vs trimestre anterior</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Datos Mensuales Detallados */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle Mensual de Supply Growth</CardTitle>
          <CardDescription>
            Desglose completo de la evolución del supply por mes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Mes</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Activos</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Nuevos</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Perdidos</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Crecimiento</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Retención</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.slice(-12).map((month, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20">
                    <td className="py-3 px-3 font-medium">{month.monthName}</td>
                    <td className="py-3 px-3 text-center font-medium">{month.custodiosActivos}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-green-600">+{month.custodiosNuevos}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-red-600">-{month.custodiosPerdidos}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={getTrendColor(month.crecimientoPorcentual)}>
                        {formatPercentage(month.crecimientoPorcentual)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-blue-600">
                        {month.tasaRetencionMensual.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}