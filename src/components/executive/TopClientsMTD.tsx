import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTopClientsMTD } from '@/hooks/useTopClientsMTD';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const TopClientsMTD = () => {
  const { clients, totalGMV, loading } = useTopClientsMTD();

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const chartData = clients.slice(0, 8).map(c => ({
    name: c.cliente.length > 12 ? c.cliente.slice(0, 12) + '...' : c.cliente,
    fullName: c.cliente,
    gmv: c.gmvActual,
    variacion: c.variacion
  }));

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--primary) / 0.85)',
    'hsl(var(--primary) / 0.7)',
    'hsl(var(--primary) / 0.6)',
    'hsl(var(--primary) / 0.5)',
    'hsl(var(--primary) / 0.4)',
    'hsl(var(--primary) / 0.35)',
    'hsl(var(--primary) / 0.3)',
  ];

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">GMV por Cliente MTD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">GMV por Cliente MTD</CardTitle>
          <span className="text-xs text-muted-foreground">
            Total: {formatCurrency(totalGMV)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                tickFormatter={(v) => formatCurrency(v)}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={90}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-foreground">{data.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          GMV: {formatCurrency(data.gmv)}
                        </p>
                        <p className={`text-xs flex items-center mt-1 ${data.variacion >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {data.variacion >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {data.variacion >= 0 ? '+' : ''}{data.variacion.toFixed(1)}% vs mes ant.
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="gmv" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={colors[index] || colors[colors.length - 1]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
