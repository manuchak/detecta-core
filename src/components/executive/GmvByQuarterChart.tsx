import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

const COLORS = ['hsl(var(--muted-foreground) / 0.4)', 'hsl(var(--muted-foreground) / 0.7)', 'hsl(217, 91%, 60%)', 'hsl(var(--primary))'];

export const GmvByQuarterChart = () => {
  const { quarterlyByYear, loading } = useExecutiveMultiYearData();

  const fmt = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" />GMV por Trimestre</CardTitle></CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  const years = [...new Set(quarterlyByYear.map(d => d.year))].sort();
  const chartData = ['T1', 'T2', 'T3', 'T4'].map((q, qi) => {
    const row: Record<string, string | number> = { quarter: q };
    years.forEach(y => {
      const match = quarterlyByYear.find(d => d.year === y && d.quarter === qi + 1);
      row[`y${y}`] = match?.gmv || 0;
    });
    return row;
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" />GMV por Trimestre</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="quarter" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tickFormatter={fmt} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={50} />
              <Tooltip content={({ active, payload, label }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground mb-1">{label}</p>
                      {payload.map((p, i) => (
                        <p key={i} className="text-sm" style={{ color: p.color }}>{p.name}: {fmt(Number(p.value))}</p>
                      ))}
                    </div>
                  );
                }
                return null;
              }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span className="text-foreground">{v}</span>} />
              {years.map((y, i) => (
                <Bar key={y} dataKey={`y${y}`} name={y.toString()} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
