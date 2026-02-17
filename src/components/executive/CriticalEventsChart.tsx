import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { useIncidentesExecutive } from '@/hooks/useIncidentesExecutive';

const COLORS = ['hsl(var(--muted-foreground) / 0.5)', 'hsl(217, 91%, 60%)', 'hsl(var(--primary))', 'hsl(0, 72%, 51%)'];

export const CriticalEventsChart = () => {
  const { data, loading } = useIncidentesExecutive();

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4" />% Eventos Críticos</CardTitle></CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  // Group by quarter, one bar per year
  const years = [...new Set(data.map(d => d.year))].sort();
  const chartData = ['T1', 'T2', 'T3', 'T4'].map((q, qi) => {
    const row: Record<string, string | number> = { quarter: q };
    years.forEach(y => {
      const match = data.find(d => d.year === y && d.quarter === qi + 1);
      row[`y${y}`] = match ? Math.round(match.tasaCriticos * 10) / 10 : 0;
    });
    return row;
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />% Eventos Críticos por Trimestre
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="quarter" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={40} />
              <Tooltip content={({ active, payload, label }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground mb-1">{label}</p>
                      {payload.map((p, i) => (
                        <p key={i} className="text-sm" style={{ color: p.color }}>{p.name}: {p.value}%</p>
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
