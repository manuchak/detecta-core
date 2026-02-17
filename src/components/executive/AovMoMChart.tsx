import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

export const AovMoMChart = () => {
  const { monthlyByYear, currentYear, loading } = useExecutiveMultiYearData();

  const fmt = (n: number) => `$${new Intl.NumberFormat('es-MX').format(Math.round(n))}`;

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" />AOV MoM</CardTitle></CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  const prevYear = currentYear - 1;
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-based

  const chartData = Array.from({ length: 12 }, (_, m) => {
    const monthNum = m + 1;
    const curr = monthlyByYear.find(d => d.year === currentYear && d.month === monthNum);
    const prev = monthlyByYear.find(d => d.year === prevYear && d.month === monthNum);
    const currVal = Math.round(curr?.aov || 0);
    return {
      month: curr?.monthLabel || prev?.monthLabel || '',
      [currentYear]: (currentYear > now.getFullYear() || (currentYear === now.getFullYear() && monthNum > currentMonth)) ? undefined : (currVal === 0 ? undefined : currVal),
      [prevYear]: Math.round(prev?.aov || 0),
    };
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />AOV MoM {currentYear} vs {prevYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={45} />
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
              <Line type="monotone" dataKey={prevYear} name={prevYear.toString()} stroke="hsl(var(--muted-foreground) / 0.6)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey={currentYear} name={currentYear.toString()} stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
