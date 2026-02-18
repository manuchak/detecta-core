import { useState } from 'react';
import { usePerformanceHistorico } from '@/hooks/usePerformanceHistorico';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import PerformanceLineChart from './PerformanceLineChart';

const horizons = [
  { value: 'weekly', label: 'Semanal (WoW)' },
  { value: 'monthly', label: 'Mensual (MoM)' },
  { value: 'quarterly', label: 'Trimestral (QoQ)' },
  { value: 'daily', label: 'Diario (30d)' },
] as const;

type Horizon = (typeof horizons)[number]['value'];

export default function PerformanceHistoryCharts() {
  const { data, isLoading } = usePerformanceHistorico();
  const [horizon, setHorizon] = useState<Horizon>('monthly');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">Histórico de Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={horizon} onValueChange={v => setHorizon(v as Horizon)}>
          <TabsList className="mb-4">
            {horizons.map(h => (
              <TabsTrigger key={h.value} value={h.value}>
                {h.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {isLoading ? (
            <Skeleton className="h-[360px] w-full rounded-lg" />
          ) : (
            horizons.map(h => (
              <TabsContent key={h.value} value={h.value}>
                <PerformanceLineChart data={data?.[h.value] || []} />
              </TabsContent>
            ))
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
