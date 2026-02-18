import { useState } from 'react';
import { usePerformanceHistorico } from '@/hooks/usePerformanceHistorico';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import SingleMetricChart from './SingleMetricChart';

const horizons = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'daily', label: 'Diario (15d)' },
] as const;

type Horizon = (typeof horizons)[number]['value'];

const metrics = [
  { key: 'fillRate' as const, title: 'Fill Rate', color: 'hsl(var(--primary))', target: 90 },
  { key: 'onTimeRate' as const, title: 'On Time', color: 'hsl(142 71% 45%)', target: 90 },
  { key: 'otifRate' as const, title: 'OTIF', color: 'hsl(38 92% 50%)', target: 90 },
  { key: 'checklistsRate' as const, title: 'Checklists', color: 'hsl(262 83% 58%)', target: 90 },
];

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
            <Skeleton className="h-[460px] w-full rounded-lg" />
          ) : (
            horizons.map(h => (
              <TabsContent key={h.value} value={h.value}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metrics.map(m => (
                    <Card key={m.key} className="border border-border/50">
                      <CardHeader className="py-3 px-4 pb-0">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                          <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="px-2 pb-2 pt-0">
                        <SingleMetricChart
                          data={data?.[h.value] || []}
                          dataKey={m.key}
                          color={m.color}
                          target={m.target}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
