import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketTrendsChartProps {
  data: { date: string; created: number; resolved: number }[];
}

export const TicketTrendsChart: React.FC<TicketTrendsChartProps> = ({ data }) => {
  const formattedData = data.map(d => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'd MMM', { locale: es })
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="dateLabel" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="created"
            name="Creados"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorCreated)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="resolved"
            name="Resueltos"
            stroke="hsl(142, 76%, 36%)"
            fillOpacity={1}
            fill="url(#colorResolved)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
