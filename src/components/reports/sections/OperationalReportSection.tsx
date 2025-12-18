import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Car, Users, Calendar } from 'lucide-react';
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

  // Filtrar meses con datos para el breakdown
  const monthsWithData = data.monthlyBreakdown.filter(m => m.services > 0 || m.gmv > 0);

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
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" />GMV (Solo Servicios Completados)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">GMV Total</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(data.gmv.total)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">AOV (Ticket Promedio)</p>
              <p className="text-3xl font-bold">{formatCurrency(data.gmv.aov)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">GMV YTD vs Año Anterior</p>
              <p className="text-xl font-bold">{formatCurrency(data.comparatives.gmvYTD.current)}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">vs {formatCurrency(data.comparatives.gmvYTD.previous)}</span>
                {formatChange(data.comparatives.gmvYTD.changePercent)}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Facturación Promedio/Día</p>
              <p className="text-xl font-bold">{formatCurrency(data.comparatives.avgDailyGMV.current)}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">vs {formatCurrency(data.comparatives.avgDailyGMV.previous)}</span>
                {formatChange(data.comparatives.avgDailyGMV.changePercent)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparativos Temporales */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Comparativos Temporales (MoM / YoY)</CardTitle></CardHeader>
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
                <TableCell className="font-medium">GMV (YTD)</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.gmvYTD.current)}</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.gmvYTD.previous)}</TableCell>
                <TableCell className="text-right">{formatChange(data.comparatives.gmvYTD.changePercent)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">AOV (MTD)</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.aovThisMonth.current)}</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.aovThisMonth.previous)}</TableCell>
                <TableCell className="text-right">{formatChange(data.comparatives.aovThisMonth.changePercent)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Facturación Diaria Promedio (YoY)</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.avgDailyGMV.current)}</TableCell>
                <TableCell className="text-right">{formatCurrency(data.comparatives.avgDailyGMV.previous)}</TableCell>
                <TableCell className="text-right">{formatChange(data.comparatives.avgDailyGMV.changePercent)}</TableCell>
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

      {/* Desglose Mensual de GMV */}
      {monthsWithData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" />Desglose Mensual de GMV</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">Completados</TableHead>
                  <TableHead className="text-right">GMV</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                  <TableHead className="text-right">Tasa Completados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthsWithData.map((month) => (
                  <TableRow key={month.monthNumber}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right">{month.services.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{month.completedServices.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(month.gmv)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.aov)}</TableCell>
                    <TableCell className="text-right">
                      <span className={month.completionRate >= 90 ? 'text-green-600' : month.completionRate >= 80 ? 'text-yellow-600' : 'text-red-600'}>
                        {month.completionRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totales */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{monthsWithData.reduce((sum, m) => sum + m.services, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{monthsWithData.reduce((sum, m) => sum + m.completedServices, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatCurrency(monthsWithData.reduce((sum, m) => sum + m.gmv, 0))}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top Clientes */}
      {data.topClients.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" />Top 10 Clientes por GMV</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">GMV</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topClients.map((client) => (
                  <TableRow key={client.rank}>
                    <TableCell className="font-bold">{client.rank}</TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-right">{client.services.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(client.gmv)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(client.aov)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top Custodios */}
      {data.topCustodians.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Custodios por Cobro</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Ordenado por cobro total al custodio. Solo incluye custodios con datos de costo registrados.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Custodio</TableHead>
                    <TableHead className="text-right">Svcs</TableHead>
                    <TableHead className="text-right">Meses</TableHead>
                    <TableHead className="text-right">Cobro Total</TableHead>
                    <TableHead className="text-right">Prom/Mes</TableHead>
                    <TableHead className="text-right">GMV</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="text-right">Cobertura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topCustodians.map((custodian) => (
                    <TableRow key={custodian.rank}>
                      <TableCell className="font-bold">{custodian.rank}</TableCell>
                      <TableCell className="font-medium max-w-[180px] truncate" title={custodian.name}>
                        {custodian.name}
                      </TableCell>
                      <TableCell className="text-right">{custodian.services}</TableCell>
                      <TableCell className="text-right">{custodian.mesesActivos}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(custodian.costoCustodio)}</TableCell>
                      <TableCell className="text-right text-primary font-medium">{formatCurrency(custodian.promedioCostoMes)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(custodian.gmv)}</TableCell>
                      <TableCell className="text-right">
                        <span className={custodian.margen >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(custodian.margen)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={custodian.coberturaDatos < 80 ? 'text-yellow-600' : 'text-green-600'}>
                          {custodian.coberturaDatos}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
