import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export interface DailyTrendData {
  fecha: string;
  fechaLabel: string;
  solicitados: number;
  realizados: number;
  fillRate: number;
  aTiempo: number;
  conRetraso: number;
  otpRate: number;
}

interface DoDTrendChartProps {
  data: DailyTrendData[];
  fillRateTarget?: number;
  otpTarget?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium text-sm text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          const isPercentage = entry.dataKey === 'fillRate' || entry.dataKey === 'otpRate';
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {isPercentage ? `${entry.value.toFixed(1)}%` : entry.value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MobileTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border border-border rounded-md shadow-lg p-2 min-w-[120px]">
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const isPercentage = entry.dataKey === 'fillRate' || entry.dataKey === 'otpRate';
          if (entry.dataKey === 'solicitados') return null;
          return (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[10px] text-muted-foreground">{entry.name}</span>
              </div>
              <span className="text-[10px] font-medium text-foreground">
                {isPercentage ? `${entry.value.toFixed(0)}%` : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DoDTrendChart: React.FC<DoDTrendChartProps> = ({
  data,
  fillRateTarget = 95,
  otpTarget = 90
}) => {
  const isMobile = useIsMobile();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Tendencia Operativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No hay datos de tendencia disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mobile: last 7 days only
  const chartData = isMobile ? data.slice(-7) : data;
  const chartHeight = isMobile ? 180 : 200;
  const daysLabel = isMobile ? '7' : '14';

  return (
    <Card>
      <CardHeader className={isMobile ? 'pb-1 px-3 pt-3' : 'pb-2'}>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          {isMobile ? `Tendencia ${daysLabel}d` : `Tendencia Operativa (Últimos ${daysLabel} días)`}
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-emerald-500 rounded" />
            <span>Fill Rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-blue-500 rounded border-dashed" style={{ borderStyle: 'dashed' }} />
            <span>On-Time</span>
          </div>
          {!isMobile && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-muted rounded opacity-50" />
              <span>Volumen</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={isMobile ? 'px-2 pb-3' : ''}>
        <div style={{ height: chartHeight }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={isMobile 
                ? { top: 5, right: 5, left: -20, bottom: 0 }
                : { top: 10, right: 10, left: -10, bottom: 0 }
              }
            >
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              
              <XAxis 
                dataKey="fechaLabel" 
                tick={{ fontSize: isMobile ? 9 : 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tickFormatter={isMobile ? (val: string) => {
                  // Extract just the day number
                  const parts = val.split(' ');
                  return parts[0] || val;
                } : undefined}
              />
              
              {!isMobile && (
                <YAxis 
                  yAxisId="percentage"
                  domain={[60, 100]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
              )}
              
              {isMobile && (
                <YAxis 
                  yAxisId="percentage"
                  domain={[60, 100]}
                  hide
                />
              )}
              
              <YAxis 
                yAxisId="volume"
                orientation="right"
                hide
              />

              <Tooltip content={isMobile ? <MobileTooltip /> : <CustomTooltip />} />
              
              {/* Volume area (background) */}
              <Area
                yAxisId="volume"
                type="monotone"
                dataKey="solicitados"
                name="Volumen"
                fill="url(#volumeGradient)"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={0}
              />
              
              {/* Target lines */}
              <ReferenceLine 
                yAxisId="percentage"
                y={fillRateTarget} 
                stroke="hsl(142 76% 36%)" 
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <ReferenceLine 
                yAxisId="percentage"
                y={otpTarget} 
                stroke="hsl(217 91% 60%)" 
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              
              {/* Fill Rate line */}
              <Line
                yAxisId="percentage"
                type="monotone"
                dataKey="fillRate"
                name="Fill Rate"
                stroke="hsl(142 76% 36%)"
                strokeWidth={2.5}
                dot={isMobile ? false : { fill: 'hsl(142 76% 36%)', strokeWidth: 0, r: 3 }}
                activeDot={{ r: isMobile ? 4 : 5, strokeWidth: 0 }}
              />
              
              {/* OTP line */}
              <Line
                yAxisId="percentage"
                type="monotone"
                dataKey="otpRate"
                name="On-Time"
                stroke="hsl(217 91% 60%)"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={isMobile ? false : { fill: 'hsl(217 91% 60%)', strokeWidth: 0, r: 2.5 }}
                activeDot={{ r: isMobile ? 3 : 4, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
