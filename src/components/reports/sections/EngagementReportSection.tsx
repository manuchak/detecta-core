import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { EngagementReportData } from '@/types/reports';

interface EngagementReportSectionProps {
  data: EngagementReportData;
}

export function EngagementReportSection({ data }: EngagementReportSectionProps) {
  const formatEngagement = (value: number) => {
    return `${value.toFixed(1)} servicios/mes`;
  };

  return (
    <div className="space-y-6 print:break-before-page" id="engagement-section">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Activity className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Engagement de Custodios</h2>
          <p className="text-sm text-muted-foreground">{data.formula}</p>
        </div>
      </div>

      {/* Datos del Período Anual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del Período Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Servicios</p>
              <p className="text-2xl font-bold">{data.yearlyData.totalServices.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Custodios Activos</p>
              <p className="text-2xl font-bold">{data.yearlyData.totalCustodians.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Engagement Promedio</p>
              <p className="text-2xl font-bold text-primary">{formatEngagement(data.yearlyData.averageEngagement)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del Mes Actual */}
      {data.currentMonthData.month && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mes Actual: {data.currentMonthData.month}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Servicios</p>
                <p className="text-xl font-bold">{data.currentMonthData.services.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Custodios</p>
                <p className="text-xl font-bold">{data.currentMonthData.custodians.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-xl font-bold text-primary">{formatEngagement(data.currentMonthData.engagement)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolución Mensual */}
      {data.monthlyEvolution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución Mensual del Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">Custodios</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead className="text-right">Tendencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyEvolution.map((month, index) => {
                  const prevMonth = index > 0 ? data.monthlyEvolution[index - 1] : null;
                  const trend = prevMonth 
                    ? ((month.engagement - prevMonth.engagement) / prevMonth.engagement) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right">{month.services.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{month.custodians.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{formatEngagement(month.engagement)}</TableCell>
                      <TableCell className="text-right">
                        {prevMonth && (
                          <span className={`flex items-center justify-end gap-1 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : trend < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                            {trend !== 0 && `${Math.abs(trend).toFixed(1)}%`}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Interpretación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interpretación del Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">&lt;3 servicios/mes</p>
              <p className="text-xs text-red-600 dark:text-red-400">Engagement bajo - Riesgo de churn</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">3-5 servicios/mes</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Engagement normal - Monitorear</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">&gt;5 servicios/mes</p>
              <p className="text-xs text-green-600 dark:text-green-400">Engagement alto - Custodios activos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
