import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { DollarSign, TrendingUp, Users, Target, Info, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useLTVDetails } from '@/hooks/useLTVDetails';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function LTVDetailView() {
  const ltvData = useLTVDetails();
  const loading = ltvData.loading;

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const TrendBadge = ({ trend, value }: { trend: 'up' | 'down' | 'stable', value: number }) => {
    if (trend === 'stable') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Minus className="h-3 w-3" />
          Estable
        </Badge>
      );
    }
    
    const Icon = trend === 'up' ? ArrowUp : ArrowDown;
    const color = trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    
    return (
      <Badge variant="secondary" className={`gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        {value > 0 ? '+' : ''}{value.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              LTV Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(ltvData.yearlyData.ltvGeneral)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor de vida general
            </p>
            <div className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                LTV basado en mediana de permanencia ({ltvData.tiempoVidaPromedio.toFixed(1)}m)
              </span>
            </div>
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
              {ltvData.yearlyData.totalCustodios.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total del período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Ingreso por Custodio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(ltvData.yearlyData.ingresoPromedioPorCustodio)}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio mensual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mes Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(ltvData.currentMonthData.ltvCalculado)}
            </div>
            <p className="text-xs text-muted-foreground">
              {ltvData.currentMonthData.month}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MoM & QoQ Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MoM Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cambio Mensual (MoM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(ltvData.momComparison.cambioAbsoluto)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    vs mes anterior
                  </div>
                </div>
                <TrendBadge 
                  trend={ltvData.momComparison.tendencia} 
                  value={ltvData.momComparison.cambioRelativo}
                />
              </div>
              <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                <span>Mes actual: {formatCurrency(ltvData.momComparison.ltvActual)}</span>
                <span>Mes anterior: {formatCurrency(ltvData.momComparison.ltvMesAnterior)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QoQ Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Cambio Trimestral (QoQ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ltvData.quarterlyData.length >= 2 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {ltvData.quarterlyData[1].cambioVsQuarterAnterior !== null 
                        ? `${ltvData.quarterlyData[1].cambioVsQuarterAnterior > 0 ? '+' : ''}${ltvData.quarterlyData[1].cambioVsQuarterAnterior.toFixed(1)}%`
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Q3 vs Q2 2025
                    </div>
                  </div>
                  {ltvData.quarterlyData[1].cambioVsQuarterAnterior !== null && (
                    <TrendBadge 
                      trend={Math.abs(ltvData.quarterlyData[1].cambioVsQuarterAnterior) < 5 
                        ? 'stable' 
                        : ltvData.quarterlyData[1].cambioVsQuarterAnterior > 0 ? 'up' : 'down'
                      } 
                      value={ltvData.quarterlyData[1].cambioVsQuarterAnterior}
                    />
                  )}
                </div>
                <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                  <span>Q3: {formatCurrency(ltvData.quarterlyData[1].ltvPromedio)}</span>
                  <span>Q2: {formatCurrency(ltvData.quarterlyData[0].ltvPromedio)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-4">
                Datos insuficientes para comparación trimestral
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* LTV Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolución del LTV Mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={ltvData.yearlyData.monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [formatCurrency(value), 'LTV']}
              />
              <Line 
                type="monotone"
                dataKey="ltvCalculado" 
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={ltvData.yearlyData.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Ingresos Totales']}
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresosTotales" 
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Análisis Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ltvData.yearlyData.monthlyBreakdown.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-muted-foreground">
                      {month.custodiosActivos} custodios activos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(month.ltvCalculado)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(month.ingresoPromedioPorCustodio)}/custodio
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis Trimestral (QoQ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trimestre</TableHead>
                <TableHead className="text-right">LTV Promedio</TableHead>
                <TableHead className="text-right">Custodios</TableHead>
                <TableHead className="text-right">Ingresos Totales</TableHead>
                <TableHead className="text-right">Variación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ltvData.quarterlyData.map((quarter, index) => (
                <TableRow key={quarter.quarter}>
                  <TableCell className="font-medium">{quarter.quarter}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(quarter.ltvPromedio)}
                  </TableCell>
                  <TableCell className="text-right">
                    {quarter.custodiosPromedio.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(quarter.ingresosTotales)}
                  </TableCell>
                  <TableCell className="text-right">
                    {quarter.cambioVsQuarterAnterior !== null ? (
                      <span className={
                        quarter.cambioVsQuarterAnterior > 0 
                          ? 'text-green-600 font-medium' 
                          : quarter.cambioVsQuarterAnterior < 0 
                          ? 'text-red-600 font-medium' 
                          : 'text-muted-foreground'
                      }>
                        {quarter.cambioVsQuarterAnterior > 0 ? '+' : ''}
                        {quarter.cambioVsQuarterAnterior.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Business Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Proyección del LTV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Optimista (+15%)</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(ltvData.yearlyData.ltvGeneral * 1.15)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Escenario actual</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(ltvData.yearlyData.ltvGeneral)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Conservador (-15%)</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(ltvData.yearlyData.ltvGeneral * 0.85)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Context Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Métricas de Contexto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Tiempo Vida Promedio</div>
                  <div className="text-2xl font-bold">
                    {ltvData.tiempoVidaPromedio.toFixed(1)} meses
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Ingreso Mensual/Custodio</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(ltvData.yearlyData.ingresoPromedioPorCustodio)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                <Info className="h-3 w-3 inline mr-1" />
                LTV calculado con mediana de permanencia para mayor precisión
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}