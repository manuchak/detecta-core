import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Shield } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

export const ArmedServicesMoMChart = () => {
  const { armedMonthly, loading } = useExecutiveMultiYearData();

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Shield className="h-4 w-4" />Servicios Armados MoM</CardTitle></CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  const chartData = armedMonthly.map(d => ({
    month: d.yearMonth,
    'Con armado': Math.round(d.armedPct * 10) / 10,
    'Sin armado': Math.round((100 - d.armedPct) * 10) / 10,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />Servicios Armados MoM
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} stackOffset="expand" margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={40} />
              <Tooltip content={({ active, payload, label }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground mb-1">{label}</p>
                      {payload.map((p, i) => (
                        <p key={i} className="text-sm" style={{ color: p.color }}>{p.name}: {Number(p.value).toFixed(1)}%</p>
                      ))}
                    </div>
                  );
                }
                return null;
              }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span className="text-foreground">{v}</span>} />
              <Bar dataKey="Con armado" stackId="a" fill="hsl(142, 76%, 36%)" />
              <Bar dataKey="Sin armado" stackId="a" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
