import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, Info, Target } from 'lucide-react';
import { 
  DSOMetrics, 
  DSOHistoryPoint, 
  getDSOStatusColor, 
  getDSOStatusBg,
  getTrendIcon 
} from '../../hooks/useFinancialReports';

interface DSOTrendChartProps {
  dso: DSOMetrics;
  history: DSOHistoryPoint[];
  isLoading?: boolean;
}

export function DSOTrendChart({ dso, history, isLoading }: DSOTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">DSO - Days Sales Outstanding</CardTitle>
        </CardHeader>
        <CardContent className="h-48 animate-pulse bg-muted/50 rounded" />
      </Card>
    );
  }

  const TrendIcon = dso.trend === 'mejorando' ? TrendingDown : 
                    dso.trend === 'empeorando' ? TrendingUp : Minus;

  const trendColor = dso.trend === 'mejorando' ? 'text-emerald-600' : 
                     dso.trend === 'empeorando' ? 'text-red-600' : 'text-muted-foreground';

  const statusLabels = {
    excelente: 'Excelente',
    bueno: 'Bueno',
    regular: 'Regular',
    malo: 'Crítico',
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">DSO - Days Sales Outstanding</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>DSO</strong> mide el promedio de días que toma cobrar una factura.
                    Fórmula: (CxC / Ventas) × 30 días.
                    <br /><br />
                    • Excelente: &lt;30d | Bueno: 30-45d | Regular: 45-60d | Crítico: &gt;60d
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Badge 
            variant="outline" 
            className={`${getDSOStatusBg(dso.status)} ${getDSOStatusColor(dso.status)} border-0`}
          >
            {statusLabels[dso.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Main DSO Display */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-3xl font-bold tracking-tight">
              {dso.current}
              <span className="text-lg text-muted-foreground ml-1">días</span>
            </div>
            <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span>
                {dso.trendPercent > 0 ? '+' : ''}{dso.trendPercent}% vs mes anterior
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Benchmark: {dso.benchmark}d
            </div>
            <div className="text-xs text-muted-foreground">
              Mes anterior: {dso.previous}d
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="dsoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                domain={[0, 'auto']}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value} días`, 'DSO']}
              />
              <ReferenceLine 
                y={dso.benchmark} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'Benchmark', 
                  position: 'right',
                  fontSize: 10,
                  fill: 'hsl(var(--destructive))'
                }}
              />
              <Area
                type="monotone"
                dataKey="dso"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#dsoGradient)"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
