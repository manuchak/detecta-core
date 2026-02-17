import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

const YEAR_COLORS = ['hsl(var(--muted-foreground) / 0.4)', 'hsl(var(--muted-foreground) / 0.7)', 'hsl(217, 91%, 60%)', 'hsl(var(--primary))'];

export const GmvMoMChart = () => {
  const { monthlyByYear, loading } = useExecutiveMultiYearData();

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />GMV MoM
          </CardTitle>
        </CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  // Get unique years
  const years = [...new Set(monthlyByYear.map(d => d.year))].sort();

  const latestYear = years[years.length - 1];

  // Transform: one row per month, columns per year; skip future months for current year
  const chartData = Array.from({ length: 12 }, (_, m) => {
    const row: Record<string, string | number | undefined> = { month: monthlyByYear.find(d => d.month === m + 1)?.monthLabel || '' };
    years.forEach(y => {
      const match = monthlyByYear.find(d => d.year === y && d.month === m + 1);
      const val = match?.gmv || 0;
      // For the latest year, omit months with 0 GMV (future) to avoid misleading drop
      if (y === latestYear && val === 0) {
        row[`y${y}`] = undefined;
      } else {
        row[`y${y}`] = val;
      }
    });
    return row;
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />GMV MoM (Multi-Año)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={50} />
              <Tooltip content={({ active, payload, label }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground mb-1">{label}</p>
                      {payload.map((p, i) => (
                        <p key={i} className="text-sm" style={{ color: p.color }}>
                          {p.name}: {formatCurrency(Number(p.value))}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span className="text-foreground">{v}</span>} />
              {years.map((y, i) => (
                <Line key={y} type="monotone" dataKey={`y${y}`} name={y.toString()} stroke={YEAR_COLORS[i] || YEAR_COLORS[0]} strokeWidth={y === latestYear ? 2.5 : 1.5} dot={{ fill: YEAR_COLORS[i] || YEAR_COLORS[0], r: 3 }} connectNulls={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
