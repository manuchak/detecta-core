import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

export const ServicesMoMChart = () => {
  const { monthlyByYear, currentYear, loading } = useExecutiveMultiYearData();

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" />Servicios MoM</CardTitle></CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  const prevYear = currentYear - 1;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const chartData = Array.from({ length: 12 }, (_, m) => {
    const monthNum = m + 1;
    const curr = monthlyByYear.find(d => d.year === currentYear && d.month === monthNum);
    const prev = monthlyByYear.find(d => d.year === prevYear && d.month === monthNum);
    const currVal = curr?.services || 0;
    return {
      month: curr?.monthLabel || prev?.monthLabel || '',
      [currentYear]: (currentYear > now.getFullYear() || (currentYear === now.getFullYear() && monthNum > currentMonth)) ? undefined : (currVal === 0 ? undefined : currVal),
      [prevYear]: prev?.services || 0,
    };
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />Servicios MoM {currentYear} vs {prevYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={40} />
              <Tooltip content={({ active, payload, label }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground mb-1">{label}</p>
                      {payload.map((p, i) => (
                        <p key={i} className="text-sm" style={{ color: p.color }}>{p.name}: {p.value} servicios</p>
                      ))}
                    </div>
                  );
                }
                return null;
              }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span className="text-foreground">{v}</span>} />
              <Bar dataKey={prevYear} name={prevYear.toString()} fill="hsl(var(--muted-foreground) / 0.5)" radius={[4, 4, 0, 0]} />
              <Bar dataKey={currentYear} name={currentYear.toString()} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
