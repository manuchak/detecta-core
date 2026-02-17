import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

const COLORS = [
  'hsl(var(--primary))', 'hsl(var(--primary) / 0.85)', 'hsl(var(--primary) / 0.7)',
  'hsl(var(--primary) / 0.6)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.35)', 'hsl(var(--primary) / 0.3)', 'hsl(var(--primary) / 0.25)',
  'hsl(var(--primary) / 0.2)',
];

export const AovByClientChart = () => {
  const { clientsMTD, loading } = useExecutiveMultiYearData();

  const fmt = (n: number) => `$${new Intl.NumberFormat('es-MX').format(Math.round(n))}`;

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4" />AOV por Cliente</CardTitle></CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  const chartData = [...clientsMTD]
    .sort((a, b) => b.aov - a.aov)
    .slice(0, 10)
    .map(c => ({
      name: c.client.length > 15 ? c.client.slice(0, 15) + '...' : c.client,
      fullName: c.client,
      aov: Math.round(c.aov),
    }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />AOV por Cliente MTD
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <Tooltip content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground">{d.fullName}</p>
                      <p className="text-sm text-muted-foreground">AOV: {fmt(d.aov)}</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Bar dataKey="aov" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
