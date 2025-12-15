import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDuration } from '@/hooks/useTicketMetrics';

interface DepartmentPerformanceChartProps {
  data: { 
    departamento: string; 
    count: number; 
    avgResolution: number; 
    slaCompliance: number;
  }[];
}

export const DepartmentPerformanceChart: React.FC<DepartmentPerformanceChartProps> = ({ data }) => {
  const formattedData = data.map(d => ({
    ...d,
    avgResolutionHours: Math.round(d.avgResolution / 60 * 10) / 10, // Convert to hours
    slaComplianceRounded: Math.round(d.slaCompliance)
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="departamento" 
            tick={{ fontSize: 12 }}
            width={100}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Tickets') return [value, name];
              if (name === 'SLA %') return [`${value}%`, name];
              return [value, name];
            }}
          />
          <Legend />
          <Bar 
            dataKey="count" 
            name="Tickets" 
            fill="hsl(var(--primary))" 
            radius={[0, 4, 4, 0]}
          />
          <Bar 
            dataKey="slaComplianceRounded" 
            name="SLA %" 
            fill="hsl(142, 76%, 36%)" 
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
