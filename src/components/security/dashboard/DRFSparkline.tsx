import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

interface DRFSparklineProps {
  dailyScores: { date: string; score: number }[];
}

export function DRFSparkline({ dailyScores }: DRFSparklineProps) {
  if (!dailyScores.length) return null;

  const avg = Math.round(dailyScores.reduce((s, d) => s + d.score, 0) / dailyScores.length);
  const latest = dailyScores[dailyScores.length - 1]?.score ?? 0;
  const color = latest >= 75 ? 'hsl(0,72%,51%)' : latest >= 50 ? 'hsl(25,95%,53%)' : latest >= 25 ? 'hsl(45,93%,47%)' : 'hsl(142,71%,45%)';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-muted-foreground">Últimos 30 días</span>
        <span className="text-[9px] text-muted-foreground">Avg: {avg}</span>
      </div>
      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyScores}>
            <Line type="monotone" dataKey="score" stroke={color} strokeWidth={1.5} dot={false} />
            <ReferenceLine y={avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeOpacity={0.4} />
            <Tooltip
              contentStyle={{
                fontSize: '10px', borderRadius: '6px', padding: '4px 8px',
                border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(v: number) => [`DRF: ${v}`, '']}
              labelFormatter={(l: string) => l}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
