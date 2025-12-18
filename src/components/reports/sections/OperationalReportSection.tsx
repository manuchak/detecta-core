import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Car } from 'lucide-react';
import { OperationalReportData } from '@/types/reports';

interface OperationalReportSectionProps {
  data: OperationalReportData;
}

export function OperationalReportSection({ data }: OperationalReportSectionProps) {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
  
  const formatChange = (value: number) => (
    <span className={`flex items-center gap-1 ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      {value >= 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );

  return (
    <div className="space-y-6 print:break-before-page" id="operational-section">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Informe Operacional</h2>
          <p className="text-sm text-muted-foreground">Servicios, GMV y métricas operativas</p>
        </div>
      </div>

      {/* Servicios */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Car className="h-5 w-5" />Servicios</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Servicios</p>
              <p className="text-2xl font-bold">{data.services.total.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completados</p>
              <p className="text-2xl font-bold text-green-600">{data.services.completed.toLocaleString()} ({data.services.completedPercent}%)</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cancelados</p>
              <p className="text-2xl font-bold text-red-600">{data.services.cancelled.toLocaleString()} ({data.services.cancelledPercent}%)</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{data.services.pending.toLocaleString()} ({data.services.pendingPercent}%)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GMV */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" />GMV (Gross Merchandise Value)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">GMV Total</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(data.gmv.total)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">AOV (Ticket Promedio)</p>
              <p className="text-3xl font-bold">{formatCurrency(data.gmv.aov)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparativos */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Comparativos Temporales</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Métrica</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Anterior</TableHead>
                <TableHead className="text-right">Cambio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Servicios (MTD)</TableCell>
                <TableCell className="text-right">{data.comparatives.servicesThisMonth.current.toLocaleString()}</TableCell>
                <TableCell className="text-right">{data.comparatives.servicesThisMonth.previous.toLocaleString()}</TableCell>
                <TableCell className="text-right">{formatChange(data.comparatives.servicesThisMonth.changePercent)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Servicios (YTD)</TableCell>
                <TableCell className="text-right">{data.comparatives.servicesYTD.current.toLocaleString()}</TableCell>
                <TableCell className="text-right">{data.comparatives.servicesYTD.previous.toLocaleString()}</TableCell>
                <TableCell className="text-right">{formatChange(data.comparatives.servicesYTD.changePercent)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">GMV (MTD)</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.gmvThisMonth.current)}</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.gmvThisMonth.previous)}</TableCell>
                <TableCell className="text-right">{formatChange(data.comparatives.gmvThisMonth.changePercent)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">AOV (MTD)</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.aovThisMonth.current)}</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.aovThisMonth.previous)}</TableCell>
                <TableCell className="text-right">{formatChange(data.comparatives.aovThisMonth.changePercent)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tasa Completados</TableCell>
                <TableCell className="text-right">{data.comparatives.completionRate.current}%</TableCell>
                <TableCell className="text-right">{data.comparatives.completionRate.previous}%</TableCell>
                <TableCell className="text-right">{formatChange(data.comparatives.completionRate.changePercent)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">KM Promedio</TableCell>
                <TableCell className="text-right">{data.comparatives.avgKmPerService.current} km</TableCell>
                <TableCell className="text-right">{data.comparatives.avgKmPerService.previous} km</TableCell>
                <TableCell className="text-right">{formatChange(data.comparatives.avgKmPerService.changePercent)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Custodios */}
      {data.topCustodians.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Top 10 Custodios</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">GMV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topCustodians.map((custodian) => (
                  <TableRow key={custodian.rank}>
                    <TableCell className="font-bold">{custodian.rank}</TableCell>
                    <TableCell className="font-medium">{custodian.name}</TableCell>
                    <TableCell className="text-right">{custodian.services}</TableCell>
                    <TableCell className="text-right">{formatCurrency(custodian.gmv)}</TableCell>
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
