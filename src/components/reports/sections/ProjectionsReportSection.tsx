import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target } from 'lucide-react';
import { ProjectionsReportData } from '@/types/reports';

interface ProjectionsReportSectionProps {
  data: ProjectionsReportData;
}

export function ProjectionsReportSection({ data }: ProjectionsReportSectionProps) {
  return (
    <div className="space-y-6 print:break-before-page" id="projections-section">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Target className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Proyecciones</h2>
          <p className="text-sm text-muted-foreground">Forecast vs Real y precisión del modelo</p>
        </div>
      </div>

      {/* Forecast vs Real */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Forecast vs Real</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Forecast</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead className="text-right">MAPE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.forecastVsReal.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.month}</TableCell>
                  <TableCell className="text-right">{item.forecast.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.real.toLocaleString()}</TableCell>
                  <TableCell className={`text-right ${item.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.difference >= 0 ? '+' : ''}{item.difference.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{item.mape.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Proyección Anual */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Proyección Anual (Escenarios)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Optimista</p>
              <p className="text-2xl font-bold text-green-600">{data.annualProjection.optimistic.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Esperado</p>
              <p className="text-2xl font-bold text-blue-600">{data.annualProjection.expected.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Conservador</p>
              <p className="text-2xl font-bold text-orange-600">{data.annualProjection.conservative.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Precisión del Modelo */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Precisión del Modelo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">MAPE Promedio</p>
              <p className="text-2xl font-bold">{data.modelPrecision.mapePromedio.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Desviación Estándar</p>
              <p className="text-2xl font-bold">{data.modelPrecision.desviacionEstandar.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
