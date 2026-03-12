import { useFinanceOverview } from '../../hooks/useFinanceOverview';
import { useFacturacionMetrics, useMetricasPorCliente } from '../../hooks/useFacturacionMetrics';
import { PLBanner } from './PLBanner';
import { AttentionCards } from './AttentionCards';
import { CxPPipelineChart } from './CxPPipelineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { ServicioFacturacion } from '../../hooks/useServiciosFacturacion';

interface Props {
  servicios: ServicioFacturacion[];
  isLoading: boolean;
}

export function FinanceOverview({ servicios, isLoading: serviciosLoading }: Props) {
  const { data: overview, isLoading: overviewLoading } = useFinanceOverview();
  const metricasPorCliente = useMetricasPorCliente(servicios);

  const isLoading = overviewLoading || serviciosLoading;

  if (isLoading || !overview) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[90px] rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  const top10 = metricasPorCliente.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* P&L Hero Banner */}
      <PLBanner data={overview} />

      {/* Attention Cards */}
      <AttentionCards data={overview} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline CxP */}
        <CxPPipelineChart pipeline={overview.pipeline} />

        {/* Top Clientes */}
        <Card className="border-border/50">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-sm font-medium">Top Clientes por Facturación</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top10}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 5, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="cliente" type="category" width={80} tick={{ fontSize: 9 }}
                    tickFormatter={(v) => v.length > 12 ? v.substring(0, 12) + '…' : v} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    contentStyle={{
                      fontSize: '11px', borderRadius: '8px',
                      border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18}>
                    <LabelList dataKey="ingresos" position="right" formatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                      className="fill-muted-foreground text-[9px]" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
