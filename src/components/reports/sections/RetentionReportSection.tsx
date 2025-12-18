import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { RetentionReportData } from '@/types/reports';

interface RetentionReportSectionProps {
  data: RetentionReportData;
}

export function RetentionReportSection({ data }: RetentionReportSectionProps) {
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

  const getCohortColor = (value: number) => {
    if (value >= 80) return 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200';
    if (value >= 60) return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-200';
    return 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200';
  };

  return (
    <div className="space-y-6 print:break-before-page" id="retention-section">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Retención de Custodios</h2>
          <p className="text-sm text-muted-foreground">{data.formula}</p>
        </div>
      </div>

      {/* Resumen Anual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Retención Promedio</p>
              <p className="text-2xl font-bold text-primary">{data.yearlyData.retentionPromedio.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Retenidos</p>
              <p className="text-2xl font-bold">{data.yearlyData.totalCustodiosRetenidos.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Anteriores</p>
              <p className="text-2xl font-bold">{data.yearlyData.totalCustodiosAnteriores.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Meses con Datos</p>
              <p className="text-2xl font-bold">{data.yearlyData.mesesConDatos}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Permanencia Promedio</p>
              <p className="text-2xl font-bold">{data.yearlyData.tiempoPromedioPermanenciaGeneral.toFixed(1)} meses</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Custodios {data.yearlyData.labelUltimoQCompletado}</p>
              <p className="text-2xl font-bold">{data.yearlyData.custodiosUltimoQCompletado.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del Mes Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del Mes Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Custodios Mes Anterior</p>
              <p className="text-xl font-bold">{data.currentMonthData.custodiosAnterior}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Custodios Actuales</p>
              <p className="text-xl font-bold">{data.currentMonthData.custodiosActual}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Retenidos</p>
              <p className="text-xl font-bold text-green-600">{data.currentMonthData.custodiosRetenidos}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nuevos</p>
              <p className="text-xl font-bold text-blue-600">+{data.currentMonthData.custodiosNuevos}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Perdidos</p>
              <p className="text-xl font-bold text-red-600">-{data.currentMonthData.custodiosPerdidos}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tasa Retención</p>
              <p className="text-xl font-bold text-primary">{data.currentMonthData.tasaRetencion.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Permanencia</p>
              <p className="text-xl font-bold">{data.currentMonthData.tiempoPromedioPermanencia.toFixed(1)} meses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis de Cohortes */}
      {data.cohortAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análisis de Cohortes (Retención por Mes de Incorporación)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohorte</TableHead>
                    <TableHead className="text-center">Mes 0</TableHead>
                    <TableHead className="text-center">Mes 1</TableHead>
                    <TableHead className="text-center">Mes 2</TableHead>
                    <TableHead className="text-center">Mes 3</TableHead>
                    <TableHead className="text-center">Mes 4</TableHead>
                    <TableHead className="text-center">Mes 5</TableHead>
                    <TableHead className="text-center">Mes 6</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cohortAnalysis.map((cohort, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-nowrap">{cohort.cohortMonth}</TableCell>
                      <TableCell className={`text-center ${getCohortColor(cohort.month0)}`}>
                        {cohort.month0}%
                      </TableCell>
                      <TableCell className={`text-center ${cohort.month1 > 0 ? getCohortColor(cohort.month1) : ''}`}>
                        {cohort.month1 > 0 ? `${cohort.month1}%` : '-'}
                      </TableCell>
                      <TableCell className={`text-center ${cohort.month2 > 0 ? getCohortColor(cohort.month2) : ''}`}>
                        {cohort.month2 > 0 ? `${cohort.month2}%` : '-'}
                      </TableCell>
                      <TableCell className={`text-center ${cohort.month3 > 0 ? getCohortColor(cohort.month3) : ''}`}>
                        {cohort.month3 > 0 ? `${cohort.month3}%` : '-'}
                      </TableCell>
                      <TableCell className={`text-center ${cohort.month4 > 0 ? getCohortColor(cohort.month4) : ''}`}>
                        {cohort.month4 > 0 ? `${cohort.month4}%` : '-'}
                      </TableCell>
                      <TableCell className={`text-center ${cohort.month5 > 0 ? getCohortColor(cohort.month5) : ''}`}>
                        {cohort.month5 > 0 ? `${cohort.month5}%` : '-'}
                      </TableCell>
                      <TableCell className={`text-center ${cohort.month6 > 0 ? getCohortColor(cohort.month6) : ''}`}>
                        {cohort.month6 > 0 ? `${cohort.month6}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-950/50 rounded" />
                <span>≥80% (Excelente)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-950/50 rounded" />
                <span>60-79% (Normal)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 dark:bg-red-950/50 rounded" />
                <span>&lt;60% (Riesgo)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Datos Trimestrales */}
      {data.quarterlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análisis Trimestral</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trimestre</TableHead>
                  <TableHead className="text-right">Retención Promedio</TableHead>
                  <TableHead className="text-right">Permanencia Promedio</TableHead>
                  <TableHead className="text-right">Custodios</TableHead>
                  <TableHead className="text-center">Tendencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.quarterlyData.map((quarter, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{quarter.quarter}</TableCell>
                    <TableCell className="text-right">{quarter.avgRetention.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{quarter.avgPermanence.toFixed(1)} meses</TableCell>
                    <TableCell className="text-right">{quarter.custodians.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      {getTrendIcon(quarter.trend)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Evolución Mensual */}
      {data.monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución Mensual de Retención</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Anteriores</TableHead>
                  <TableHead className="text-right">Retenidos</TableHead>
                  <TableHead className="text-right">Nuevos</TableHead>
                  <TableHead className="text-right">Perdidos</TableHead>
                  <TableHead className="text-right">Tasa Retención</TableHead>
                  <TableHead className="text-right">Permanencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyBreakdown.map((month, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{month.monthName}</TableCell>
                    <TableCell className="text-right">{month.custodiosAnterior}</TableCell>
                    <TableCell className="text-right text-green-600">{month.custodiosRetenidos}</TableCell>
                    <TableCell className="text-right text-blue-600">+{month.custodiosNuevos}</TableCell>
                    <TableCell className="text-right text-red-600">-{month.custodiosPerdidos}</TableCell>
                    <TableCell className="text-right font-medium">{month.tasaRetencion.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{month.tiempoPromedioPermanencia.toFixed(1)}</TableCell>
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
