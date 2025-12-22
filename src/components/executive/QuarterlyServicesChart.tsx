import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuarterlyComparison } from '@/hooks/useQuarterlyComparison';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

export const QuarterlyServicesChart = () => {
  const { quarters, years, loading } = useQuarterlyComparison();

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Servicios por Trimestre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Transform data for grouped bar chart
  const chartData = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
    const row: Record<string, string | number> = { quarter: q };
    years.forEach(year => {
      const match = quarters.find(d => d.quarter === q && d.year === year);
      row[`y${year}`] = match?.servicios || 0;
    });
    return row;
  });

  const colors = [
    'hsl(var(--primary))',
    'hsl(217, 91%, 60%)',
    'hsl(262, 83%, 58%)',
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Servicios por Trimestre
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="quarter"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={40}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium text-foreground mb-2">{label}</p>
                        {payload.map((p, idx) => (
                          <p key={idx} className="text-sm" style={{ color: p.color }}>
                            {p.name}: {p.value} servicios
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span className="text-foreground">{value}</span>}
              />
              {years.slice(0, 3).map((year, idx) => (
                <Bar 
                  key={year}
                  dataKey={`y${year}`}
                  name={year.toString()}
                  fill={colors[idx]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
