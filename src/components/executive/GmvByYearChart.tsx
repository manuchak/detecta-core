import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

const COLORS = ['hsl(var(--muted-foreground) / 0.4)', 'hsl(var(--muted-foreground) / 0.7)', 'hsl(217, 91%, 60%)', 'hsl(var(--primary))'];

export const GmvByYearChart = () => {
  const { yearlyTotals, loading } = useExecutiveMultiYearData();

  const fmt = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" />GMV por Año</CardTitle></CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" />GMV por Año</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyTotals} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="year" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tickFormatter={fmt} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={50} />
              <Tooltip content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground">{d.year}</p>
                      <p className="text-sm text-muted-foreground">GMV: {fmt(d.gmv)}</p>
                      <p className="text-sm text-muted-foreground">{d.services} servicios</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Bar dataKey="gmv" radius={[4, 4, 0, 0]}>
                {yearlyTotals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                <LabelList dataKey="gmv" position="top" formatter={fmt} style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
