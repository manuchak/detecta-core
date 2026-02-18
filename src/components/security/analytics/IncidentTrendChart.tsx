import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Props {
  data: { month: string; total: number; criticos: number; atribuibles: number }[];
}

export function IncidentTrendChart({ data }: Props) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">Sin datos de tendencia</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="criticos" name="Críticos" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="atribuibles" name="Atribuibles Op." stroke="hsl(25 95% 53%)" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
