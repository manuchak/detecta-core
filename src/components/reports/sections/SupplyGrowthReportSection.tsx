import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Users, UserPlus, UserMinus, Star } from 'lucide-react';
import { SupplyGrowthReportData } from '@/types/reports';

interface SupplyGrowthReportSectionProps {
  data: SupplyGrowthReportData;
}

export function SupplyGrowthReportSection({ data }: SupplyGrowthReportSectionProps) {
  const getTrendIcon = (trend: 'creciendo' | 'decreciendo' | 'estable') => {
    switch (trend) {
      case 'creciendo':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'decreciendo':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Users className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 print:break-before-page" id="supply-growth-section">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <TrendingUp className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Crecimiento de Supply</h2>
          <p className="text-sm text-muted-foreground">Análisis de crecimiento y calidad de la base de custodios</p>
        </div>
      </div>

      {/* Resumen Anual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Crecimiento Promedio Mensual</p>
              <p className={`text-2xl font-bold ${data.summary.crecimientoPromedioMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.summary.crecimientoPromedioMensual >= 0 ? '+' : ''}{data.summary.crecimientoPromedioMensual.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Crecimiento Neto Anual</p>
              <p className={`text-2xl font-bold ${data.summary.crecimientoNetoAnual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.summary.crecimientoNetoAnual >= 0 ? '+' : ''}{data.summary.crecimientoNetoAnual}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Custodios Activos Actuales</p>
              <p className="text-2xl font-bold">{data.summary.custodiosActivosActuales.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tendencia</p>
              <div className="flex items-center gap-2">
                {getTrendIcon(data.summary.tendencia)}
                <span className="text-xl font-bold capitalize">{data.summary.tendencia}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nuevos vs Perdidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Balance de Custodios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                Nuevos (Anual)
              </p>
              <p className="text-2xl font-bold text-green-600">+{data.summary.custodiosNuevosAnual}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <UserMinus className="h-4 w-4" />
                Perdidos (Anual)
              </p>
              <p className="text-2xl font-bold text-red-600">-{data.summary.custodiosPerdidosAnual}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mejor Mes</p>
              <div>
                <p className="text-lg font-bold text-green-600">{data.summary.mejorMes.mes}</p>
                <p className="text-sm text-muted-foreground">+{data.summary.mejorMes.crecimiento.toFixed(1)}%</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mes Más Débil</p>
              <div>
                <p className="text-lg font-bold text-red-600">{data.summary.peorMes.mes}</p>
                <p className="text-sm text-muted-foreground">{data.summary.peorMes.crecimiento.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Calidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métricas de Calidad del Supply</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Con +5 Servicios</p>
              <p className="text-2xl font-bold text-green-600">{data.qualityMetrics.custodiosConMas5Servicios}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Con ≤1 Servicio</p>
              <p className="text-2xl font-bold text-red-600">{data.qualityMetrics.custodiosConMenos1Servicio}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Promedio Servicios/Custodio</p>
              <p className="text-2xl font-bold">{data.qualityMetrics.promedioServiciosPorCustodio.toFixed(1)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Top 10% Custodios</p>
              <p className="text-2xl font-bold">{data.qualityMetrics.custodiosTop10Percent}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ingreso Promedio/Custodio</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(data.qualityMetrics.ingresoPromedioPorCustodio)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Con Ingresos $0</p>
              <p className="text-2xl font-bold text-red-600">{data.qualityMetrics.custodiosConIngresosCero}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Velocidad de Crecimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Velocidad de Crecimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Aceleración (Últimos 3 meses vs anteriores 3)</p>
              <p className={`text-3xl font-bold ${data.summary.velocidadCrecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.summary.velocidadCrecimiento >= 0 ? '+' : ''}{data.summary.velocidadCrecimiento.toFixed(2)}pp
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.summary.velocidadCrecimiento > 1 && 'El crecimiento se está acelerando'}
              {data.summary.velocidadCrecimiento < -1 && 'El crecimiento se está desacelerando'}
              {Math.abs(data.summary.velocidadCrecimiento) <= 1 && 'El crecimiento se mantiene estable'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolución Mensual */}
      {data.monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Custodios Activos</TableHead>
                  <TableHead className="text-right">Nuevos</TableHead>
                  <TableHead className="text-right">Perdidos</TableHead>
                  <TableHead className="text-right">Crecimiento Neto</TableHead>
                  <TableHead className="text-right">Crecimiento %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyData.slice(-12).map((month, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{month.monthName}</TableCell>
                    <TableCell className="text-right">{month.custodiosActivos.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">+{month.custodiosNuevos}</TableCell>
                    <TableCell className="text-right text-red-600">-{month.custodiosPerdidos}</TableCell>
                    <TableCell className={`text-right font-medium ${month.crecimientoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {month.crecimientoNeto >= 0 ? '+' : ''}{month.crecimientoNeto}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`flex items-center justify-end gap-1 ${month.crecimientoPorcentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {month.crecimientoPorcentual >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {month.crecimientoPorcentual >= 0 ? '+' : ''}{month.crecimientoPorcentual.toFixed(1)}%
                      </span>
                    </TableCell>
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
