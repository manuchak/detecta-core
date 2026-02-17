import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

const COLORS = [
  'hsl(var(--primary))', 'hsl(217, 91%, 60%)', 'hsl(262, 83%, 58%)',
  'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)',
  'hsl(190, 80%, 42%)', 'hsl(330, 70%, 50%)', 'hsl(var(--muted-foreground))',
  'hsl(60, 70%, 45%)', 'hsl(var(--muted-foreground) / 0.5)',
];

export const GmvClientDonut = () => {
  const { clientsMTD, loading } = useExecutiveMultiYearData();

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">GMV por Cliente MTD</CardTitle></CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  const top10 = clientsMTD.slice(0, 10);
  const othersGmv = clientsMTD.slice(10).reduce((sum, c) => sum + c.gmv, 0);
  const pieData = [
    ...top10.map(c => ({ name: c.client, value: c.gmv })),
    ...(othersGmv > 0 ? [{ name: 'Otros', value: othersGmv }] : []),
  ];
  const totalGmv = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">GMV por Cliente MTD</CardTitle>
          <span className="text-xs text-muted-foreground">Total: {formatCurrency(totalGmv)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="w-1/2 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload;
                    const pct = totalGmv > 0 ? ((d.value / totalGmv) * 100).toFixed(1) : '0';
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-foreground">{d.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(d.value)} ({pct}%)</p>
                      </div>
                    );
                  }
                  return null;
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-1 overflow-auto max-h-[260px]">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate text-foreground flex-1">{d.name}</span>
                <span className="text-muted-foreground">{totalGmv > 0 ? ((d.value / totalGmv) * 100).toFixed(0) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
