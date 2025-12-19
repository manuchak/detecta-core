import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, AlertTriangle, DollarSign, BarChart3, Building2 } from 'lucide-react';
import type { ClientsReportData } from '@/types/reports';

interface ClientsReportSectionProps {
  data: ClientsReportData;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export function ClientsReportSection({ data }: ClientsReportSectionProps) {
  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.activeClients} activos en el período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              GMV Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalGMV)}</div>
            <p className="text-xs text-muted-foreground">
              AOV Promedio: {formatCurrency(data.summary.avgGmvPerClient / (data.summary.avgServicesPerClient || 1))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Servicios/Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgServicesPerClient.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              GMV promedio: {formatCurrency(data.summary.avgGmvPerClient)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Concentration Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Concentración de Ingresos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{data.clientConcentration.top5Percent.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Top 5 clientes</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{data.clientConcentration.top10Percent.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Top 10 clientes</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{data.clientConcentration.hhi.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Índice HHI</p>
              <Badge variant={data.clientConcentration.hhi > 2500 ? 'destructive' : data.clientConcentration.hhi > 1500 ? 'secondary' : 'default'} className="mt-1 text-xs">
                {data.clientConcentration.hhi > 2500 ? 'Alta concentración' : data.clientConcentration.hhi > 1500 ? 'Moderada' : 'Diversificado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Type Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribución por Tipo de Servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Foráneo</span>
                <Badge variant="outline">{data.serviceTypeAnalysis.foraneo.percentage.toFixed(1)}%</Badge>
              </div>
              <Progress value={data.serviceTypeAnalysis.foraneo.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{data.serviceTypeAnalysis.foraneo.count} servicios</span>
                <span>AOV: {formatCurrency(data.serviceTypeAnalysis.foraneo.avgValue)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Local</span>
                <Badge variant="outline">{data.serviceTypeAnalysis.local.percentage.toFixed(1)}%</Badge>
              </div>
              <Progress value={data.serviceTypeAnalysis.local.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{data.serviceTypeAnalysis.local.count} servicios</span>
                <span>AOV: {formatCurrency(data.serviceTypeAnalysis.local.avgValue)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top 15 Clientes por GMV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Cliente</th>
                  <th className="text-right py-2 px-2">Servicios</th>
                  <th className="text-right py-2 px-2">GMV</th>
                  <th className="text-right py-2 px-2">AOV</th>
                  <th className="text-right py-2 px-2">Completado</th>
                </tr>
              </thead>
              <tbody>
                {data.topClients.slice(0, 15).map((client) => (
                  <tr key={client.rank} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{client.rank}</td>
                    <td className="py-2 px-2 font-medium truncate max-w-[200px]">{client.name}</td>
                    <td className="py-2 px-2 text-right">{client.services}</td>
                    <td className="py-2 px-2 text-right font-medium">{formatCurrency(client.gmv)}</td>
                    <td className="py-2 px-2 text-right">{formatCurrency(client.aov)}</td>
                    <td className="py-2 px-2 text-right">
                      <Badge variant={client.completionRate >= 90 ? 'default' : client.completionRate >= 70 ? 'secondary' : 'destructive'}>
                        {client.completionRate.toFixed(0)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* At Risk Clients */}
      {data.atRiskClients.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Clientes en Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Clientes sin servicios en los últimos 30+ días con historial de GMV significativo
            </p>
            <div className="space-y-3">
              {data.atRiskClients.slice(0, 10).map((client, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Último servicio: {client.lastServiceDate} ({client.daysSinceLastService} días)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-amber-600">{formatCurrency(client.historicalGmv)}</div>
                    <div className="text-xs text-muted-foreground">GMV histórico</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Evolution */}
      {data.monthlyGMVEvolution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución Mensual GMV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Mes</th>
                    <th className="text-right py-2 px-2">GMV</th>
                    <th className="text-right py-2 px-2">Clientes Activos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyGMVEvolution.map((month, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-2 px-2">{month.month}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(month.gmv)}</td>
                      <td className="py-2 px-2 text-right">{month.clientCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
