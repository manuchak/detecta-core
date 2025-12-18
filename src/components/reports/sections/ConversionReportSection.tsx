import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { ConversionReportData } from '@/types/reports';

interface ConversionReportSectionProps {
  data: ConversionReportData;
}

export function ConversionReportSection({ data }: ConversionReportSectionProps) {
  return (
    <div className="space-y-6 print:break-before-page" id="conversion-section">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Filter className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Tasa de Conversión</h2>
          <p className="text-sm text-muted-foreground">{data.formula}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Datos del Período Anual</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold">{data.yearlyData.totalLeads.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nuevos Custodios</p>
              <p className="text-2xl font-bold">{data.yearlyData.totalNewCustodians.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
              <p className="text-2xl font-bold text-primary">{data.yearlyData.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Evolución Mensual</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Nuevos Custodios</TableHead>
                  <TableHead className="text-right">Conversión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyBreakdown.map((month, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right">{month.leads}</TableCell>
                    <TableCell className="text-right">{month.newCustodians}</TableCell>
                    <TableCell className="text-right font-medium">{month.conversionRate.toFixed(1)}%</TableCell>
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
