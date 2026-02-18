import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { PeriodMetrics } from '@/hooks/usePerformanceHistorico';

interface Props {
  data: PeriodMetrics[];
  dataKey: keyof Omit<PeriodMetrics, 'label' | 'total'>;
  color: string;
  target?: number;
}

const SingleTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload[0]?.payload?.total ?? 0;
  return (
    <div className="rounded-lg border bg-popover p-2 shadow-md text-sm space-y-0.5">
      <p className="font-medium text-foreground">{label}</p>
      <p style={{ color: payload[0]?.color }}>{payload[0]?.value}%</p>
      <p className="text-muted-foreground text-xs">{total} servicios</p>
    </div>
  );
};

const DotLabel = ({ x, y, value }: any) => (
  <text x={x} y={y - 8} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
    {value}%
  </text>
);

export default function SingleMetricChart({ data, dataKey, color, target }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10 }}
          className="text-muted-foreground"
          interval="preserveStartEnd"
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" unit="%" />
        <Tooltip content={<SingleTooltip />} />
        {target != null && (
          <ReferenceLine
            y={target}
            strokeDasharray="6 4"
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.5}
            label={{ value: `${target}%`, position: 'right', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
          />
        )}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          label={<DotLabel />}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
