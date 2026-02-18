import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { PeriodMetrics } from '@/hooks/usePerformanceHistorico';

interface Props {
  data: PeriodMetrics[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload[0]?.payload?.total ?? 0;
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}%
        </p>
      ))}
      <p className="text-muted-foreground text-xs">{total} servicios</p>
    </div>
  );
};

export default function PerformanceLineChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          interval="preserveStartEnd"
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" unit="%" />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={32} />
        <ReferenceLine
          y={90}
          strokeDasharray="6 4"
          stroke="hsl(var(--muted-foreground))"
          strokeOpacity={0.5}
          label={{ value: 'Target 90%', position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Line
          type="monotone"
          dataKey="fillRate"
          name="Fill Rate"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="onTimeRate"
          name="On Time"
          stroke="hsl(142 71% 45%)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="otifRate"
          name="OTIF"
          stroke="hsl(38 92% 50%)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
