import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryDistributionChartProps {
  data: { categoria: string; count: number; color: string }[];
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          innerRadius={60}
          fill="#8884d8"
          dataKey="count"
          nameKey="categoria"
          label={({ categoria, percent }) => 
            percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
          }
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => (
            <span className="text-sm text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
