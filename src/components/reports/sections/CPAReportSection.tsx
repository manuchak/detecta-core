import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, TrendingDown, TrendingUp } from 'lucide-react';
import { CPAReportData } from '@/types/reports';

interface CPAReportSectionProps {
  data: CPAReportData;
}

export function CPAReportSection({ data }: CPAReportSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 print:break-before-page" id="cpa-section">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Calculator className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Costo por Adquisición (CPA)</h2>
          <p className="text-sm text-muted-foreground">{data.formula}</p>
        </div>
      </div>

      {/* Acumulado Anual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acumulado Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Costos Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(data.yearlyData.totalCosts)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Custodios Nuevos</p>
              <p className="text-2xl font-bold">{data.yearlyData.newCustodians}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">CPA Promedio</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(data.yearlyData.cpaPromedio)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Costo por Custodio</p>
              <p className="text-2xl font-bold">
                {data.yearlyData.newCustodians > 0 
                  ? formatCurrency(data.yearlyData.totalCosts / data.yearlyData.newCustodians)
                  : '$0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desglose de Costos por Categoría */}
      {data.yearlyData.costBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Desglose de Costos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">% del Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.yearlyData.costBreakdown.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.yearlyData.totalCosts)}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Datos del Mes Actual */}
      {data.currentMonthData.month && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mes Actual: {data.currentMonthData.month}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Costos</p>
                <p className="text-xl font-bold">{formatCurrency(data.currentMonthData.costs)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Custodios Nuevos</p>
                <p className="text-xl font-bold">{data.currentMonthData.newCustodians}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">CPA del Mes</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(data.currentMonthData.cpa)}</p>
              </div>
            </div>

            {data.currentMonthData.costBreakdown.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Desglose del Mes</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {data.currentMonthData.costBreakdown.map((item, index) => (
                    <div key={index} className="bg-muted/30 p-2 rounded">
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                      <p className="text-sm font-medium">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evolución Mensual */}
      {data.monthlyEvolution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución Mensual del CPA</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Costos</TableHead>
                  <TableHead className="text-right">Nuevos Custodios</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">Tendencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyEvolution.map((month, index) => {
                  const prevMonth = index > 0 ? data.monthlyEvolution[index - 1] : null;
                  const trend = prevMonth 
                    ? ((month.cpa - prevMonth.cpa) / prevMonth.cpa) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.costs)}</TableCell>
                      <TableCell className="text-right">{month.newCustodians}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(month.cpa)}</TableCell>
                      <TableCell className="text-right">
                        {prevMonth && (
                          <span className={`flex items-center justify-end gap-1 ${trend < 0 ? 'text-green-600' : trend > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {trend < 0 ? <TrendingDown className="h-4 w-4" /> : trend > 0 ? <TrendingUp className="h-4 w-4" /> : null}
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
    </div>
  );
}
