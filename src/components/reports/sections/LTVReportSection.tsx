import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { LTVReportData } from '@/types/reports';

interface LTVReportSectionProps {
  data: LTVReportData;
}

export function LTVReportSection({ data }: LTVReportSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 print:break-before-page" id="ltv-section">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <DollarSign className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Lifetime Value (LTV)</h2>
          <p className="text-sm text-muted-foreground">{data.formula}</p>
        </div>
      </div>

      {/* Datos del Período Anual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del Período Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Custodios</p>
              <p className="text-2xl font-bold">{data.yearlyData.totalCustodios.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(data.yearlyData.ingresosTotales)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ingreso Promedio/Custodio</p>
              <p className="text-2xl font-bold">{formatCurrency(data.yearlyData.ingresoPromedioPorCustodio)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">LTV General</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(data.yearlyData.ltvGeneral)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo MoM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo Mes vs Mes Anterior (MoM)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">LTV Actual</p>
              <p className="text-xl font-bold">{formatCurrency(data.momComparison.ltvActual)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">LTV Mes Anterior</p>
              <p className="text-xl font-bold">{formatCurrency(data.momComparison.ltvMesAnterior)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cambio Absoluto</p>
              <p className={`text-xl font-bold ${data.momComparison.cambioAbsoluto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.momComparison.cambioAbsoluto >= 0 ? '+' : ''}{formatCurrency(data.momComparison.cambioAbsoluto)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cambio Relativo</p>
              <p className={`text-xl font-bold ${data.momComparison.cambioRelativo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.momComparison.cambioRelativo >= 0 ? '+' : ''}{data.momComparison.cambioRelativo.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tendencia</p>
              <div className="flex items-center gap-2">
                {getTrendIcon(data.momComparison.tendencia)}
                <span className="text-xl font-bold capitalize">{data.momComparison.tendencia}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis Trimestral (QoQ) */}
      {data.quarterlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análisis Trimestral (QoQ)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trimestre</TableHead>
                  <TableHead className="text-right">LTV Promedio</TableHead>
                  <TableHead className="text-right">Custodios Promedio</TableHead>
                  <TableHead className="text-right">Ingresos Totales</TableHead>
                  <TableHead className="text-right">Cambio vs Q Anterior</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.quarterlyData.map((quarter, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{quarter.quarter}</TableCell>
                    <TableCell className="text-right">{formatCurrency(quarter.ltvPromedio)}</TableCell>
                    <TableCell className="text-right">{quarter.custodiosPromedio.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(quarter.ingresosTotales)}</TableCell>
                    <TableCell className="text-right">
                      {quarter.cambioVsQuarterAnterior !== null ? (
                        <span className={quarter.cambioVsQuarterAnterior >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {quarter.cambioVsQuarterAnterior >= 0 ? '+' : ''}{quarter.cambioVsQuarterAnterior.toFixed(1)}%
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
      )}

      {/* Proyecciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Proyecciones de LTV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Escenario Optimista (+15%)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.projections.optimista)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Escenario Actual</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.projections.actual)}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Escenario Conservador (-15%)</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.projections.conservador)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Contexto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métricas de Contexto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tiempo de Vida Promedio</p>
              <p className="text-xl font-bold">{data.tiempoVidaPromedio.toFixed(1)} meses</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ingreso Mensual por Custodio</p>
              <p className="text-xl font-bold">{formatCurrency(data.yearlyData.ingresoPromedioPorCustodio)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">LTV General</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(data.yearlyData.ltvGeneral)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolución Mensual */}
      {data.monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución Mensual del LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Custodios Activos</TableHead>
                  <TableHead className="text-right">Ingresos Totales</TableHead>
                  <TableHead className="text-right">Ingreso/Custodio</TableHead>
                  <TableHead className="text-right">LTV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyBreakdown.map((month, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right">{month.custodiosActivos.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.ingresosTotales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.ingresoPromedioPorCustodio)}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{formatCurrency(month.ltvCalculado)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
