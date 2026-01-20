import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';
import { StrategicPlanDay } from '@/hooks/useStrategicPlanTracking';

interface BurnUpChartProps {
  data: StrategicPlanDay[];
  metric: 'services' | 'gmv';
  target: number;
  currentDay: number;
}

export const BurnUpChart: React.FC<BurnUpChartProps> = ({
  data,
  metric,
  target,
  currentDay,
}) => {
  const chartData = data.map((day) => ({
    day: day.day,
    date: day.date,
    plan: metric === 'services' ? day.planServicesCumulative : day.planGMVCumulative,
    actual: day.isPast || day.isToday 
      ? (metric === 'services' ? day.actualServicesCumulative : day.actualGMVCumulative)
      : null,
    isToday: day.isToday,
  }));

  const formatYAxis = (value: number) => {
    if (metric === 'gmv') {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value}`;
    }
    return value.toLocaleString();
  };

  const formatTooltipValue = (value: number) => {
    if (metric === 'gmv') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="planGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
              <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5}
            vertical={false}
          />
          
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickMargin={8}
          />
          
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickFormatter={formatYAxis}
            width={60}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              formatTooltipValue(value),
              name === 'plan' ? 'Plan' : 'Actual'
            ]}
            labelFormatter={(label) => `Día ${label}`}
          />

          {/* Plan line (dashed) */}
          <Line
            type="monotone"
            dataKey="plan"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            name="plan"
          />

          {/* Actual area with line */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#actualGradient)"
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.isToday && payload.actual !== null) {
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            }}
            name="actual"
            connectNulls={false}
          />

          {/* Today reference line */}
          <ReferenceLine
            x={currentDay}
            stroke="hsl(var(--primary))"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
