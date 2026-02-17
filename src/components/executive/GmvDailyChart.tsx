import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { DollarSign } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

export const GmvDailyChart = () => {
  const { dailyCurrent, loading } = useExecutiveMultiYearData();

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
            <DollarSign className="h-4 w-4" />GMV Diario
          </CardTitle>
        </CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />GMV Diario (Mes Actual)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyCurrent} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="dayLabel" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={50} />
              <Tooltip content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground">Día {d.day}</p>
                      <p className="text-sm text-muted-foreground">GMV: {formatCurrency(d.gmv)}</p>
                      <p className="text-sm text-muted-foreground">{d.services} servicios</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Bar dataKey="gmv" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="gmv" position="top" formatter={formatCurrency} style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
