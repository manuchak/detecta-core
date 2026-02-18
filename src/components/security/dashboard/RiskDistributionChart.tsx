import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskDistributionChartProps {
  distribution: {
    extremo: number;
    alto: number;
    medio: number;
    bajo: number;
  };
}

const COLORS = {
  extremo: '#ef4444',
  alto: '#f97316',
  medio: '#eab308',
  bajo: '#22c55e',
};

const LABELS: Record<string, string> = {
  extremo: 'Extremo',
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};

export function RiskDistributionChart({ distribution }: RiskDistributionChartProps) {
  const data = Object.entries(distribution)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key],
      value,
      color: COLORS[key as keyof typeof COLORS],
    }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-xs text-muted-foreground">Sin datos de zonas</p>
      </div>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={55}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value} zonas`, name]}
            contentStyle={{
              fontSize: '11px',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
