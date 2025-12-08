import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useForecastVsActual } from '@/hooks/useForecastVsActual';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Target, DollarSign, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'services' | 'gmv';

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload, label, viewMode }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;

  const isGmv = viewMode === 'gmv';
  const forecast = isGmv ? data.gmvForecast : data.forecast;
  const actual = isGmv ? data.gmvActual : data.actual;
  const variance = isGmv ? data.gmvVariance : data.variance;
  const variancePct = isGmv ? data.gmvVariancePct : data.variancePct;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="font-medium text-foreground">
        {data.weekdayName} {data.dayOfMonth}
      </p>
      {data.isHoliday && (
        <p className="text-xs text-amber-500">{data.holidayName}</p>
      )}
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-muted-foreground">
          Forecast: <span className="text-foreground font-medium">
            {isGmv ? formatCurrency(forecast) : forecast}
          </span>
        </p>
        {actual !== null && (
          <>
            <p className="text-muted-foreground">
              Real: <span className="text-foreground font-medium">
                {isGmv ? formatCurrency(actual) : actual}
              </span>
            </p>
            <p className={`font-medium ${variance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {variance >= 0 ? '+' : ''}{isGmv ? formatCurrency(variance) : variance} ({variancePct?.toFixed(1)}%)
            </p>
          </>
        )}
        <div className="text-xs text-muted-foreground border-t border-border pt-1 mt-1">
          <p>Día semana: ×{data.weekdayFactor?.toFixed(2)}</p>
          {data.operationFactor < 1 && (
            <p>Factor feriado: ×{data.operationFactor?.toFixed(2)}</p>
          )}
          <p>Factor combinado: ×{data.combinedFactor?.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

const CumulativeTooltip = ({ active, payload, label, viewMode }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;

  const isGmv = viewMode === 'gmv';
  const forecastCum = isGmv ? data.gmvForecastCumulative : data.forecastCumulative;
  const actualCum = isGmv ? data.gmvActualCumulative : data.actualCumulative;
  const gap = actualCum !== null ? actualCum - forecastCum : null;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="font-medium text-foreground">Día {data.dayOfMonth}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-muted-foreground">
          Forecast acum: <span className="text-foreground font-medium">
            {isGmv ? formatCurrency(forecastCum) : forecastCum}
          </span>
        </p>
        {actualCum !== null && (
          <>
            <p className="text-muted-foreground">
              Real acum: <span className="text-foreground font-medium">
                {isGmv ? formatCurrency(actualCum) : actualCum}
              </span>
            </p>
            <p className={`font-medium ${gap >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              Gap: {isGmv ? formatCurrency(gap) : gap}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export const ForecastVsActualChart: React.FC = () => {
  const { comparisons, metrics, isLoading } = useForecastVsActual();
  const [viewMode, setViewMode] = useState<ViewMode>('services');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const isGmv = viewMode === 'gmv';

  const TrendIcon = metrics?.trend === 'improving' 
    ? TrendingUp 
    : metrics?.trend === 'declining' 
      ? TrendingDown 
      : Minus;

  const trendColor = metrics?.trend === 'improving'
    ? 'text-green-600'
    : metrics?.trend === 'declining'
      ? 'text-destructive'
      : 'text-muted-foreground';

  // Select metrics based on view mode
  const daysMetTarget = isGmv ? metrics?.gmvDaysMetForecast : metrics?.daysMetForecast;
  const avgVar = isGmv ? metrics?.avgGmvVariance : metrics?.avgVariance;
  const totalActualDisplay = isGmv ? metrics?.totalGmvActual : metrics?.totalActual;
  const totalForecastDisplay = isGmv ? metrics?.totalGmvForecast : metrics?.totalForecast;

  // Data keys based on view mode
  const forecastKey = isGmv ? 'gmvForecast' : 'forecast';
  const actualKey = isGmv ? 'gmvActual' : 'actual';
  const forecastCumKey = isGmv ? 'gmvForecastCumulative' : 'forecastCumulative';
  const actualCumKey = isGmv ? 'gmvActualCumulative' : 'actualCumulative';
  const varianceKey = isGmv ? 'gmvVariance' : 'variance';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Tracking Diario: Forecast vs Real
            </CardTitle>
            <div className="flex gap-1 bg-muted p-0.5 rounded-md">
              <Button
                size="sm"
                variant={viewMode === 'services' ? 'default' : 'ghost'}
                className="h-7 px-2 text-xs"
                onClick={() => setViewMode('services')}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Servicios
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'gmv' ? 'default' : 'ghost'}
                className="h-7 px-2 text-xs"
                onClick={() => setViewMode('gmv')}
              >
                <DollarSign className="h-3 w-3 mr-1" />
                GMV
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {metrics && (
              <>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {metrics.daysCompleted} de 31 días
                </Badge>
                <Badge 
                  variant={(daysMetTarget ?? 0) >= metrics.daysCompleted * 0.5 ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {daysMetTarget}/{metrics.daysCompleted} días cumplidos
                </Badge>
                <Badge variant="outline" className={`text-xs ${trendColor}`}>
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {metrics.trend === 'improving' ? 'Mejorando' : metrics.trend === 'declining' ? 'Decayendo' : 'Estable'}
                </Badge>
              </>
            )}
          </div>
        </div>
        {metrics && (
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span>
              Varianza promedio: 
              <span className={`ml-1 font-medium ${(avgVar ?? 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {(avgVar ?? 0) >= 0 ? '+' : ''}
                {isGmv ? formatCurrency(avgVar ?? 0) : `${(avgVar ?? 0).toFixed(1)} servicios`}
              </span>
            </span>
            <span>
              Total real: <span className="font-medium text-foreground">
                {isGmv ? formatCurrency(totalActualDisplay ?? 0) : totalActualDisplay}
              </span> / 
              Forecast: <span className="font-medium text-foreground">
                {isGmv ? formatCurrency(totalForecastDisplay ?? 0) : totalForecastDisplay}
              </span>
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="daily">Día vs Día</TabsTrigger>
            <TabsTrigger value="cumulative">Acumulado</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comparisons} margin={{ top: 10, right: 10, left: isGmv ? 10 : 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="dayLabel" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                    tickFormatter={isGmv ? (v) => formatCurrency(v) : undefined}
                  />
                  <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
                  
                  {/* Forecast line */}
                  <Line 
                    type="monotone" 
                    dataKey={forecastKey}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Forecast"
                  />
                  
                  {/* Actual bars */}
                  <Bar 
                    dataKey={actualKey}
                    name="Real"
                    radius={[2, 2, 0, 0]}
                  >
                    {comparisons.map((entry, index) => {
                      const variance = isGmv ? entry.gmvVariance : entry.variance;
                      let fill = 'hsl(var(--primary))';
                      if ((isGmv ? entry.gmvActual : entry.actual) !== null) {
                        if (variance !== null && variance >= 0) {
                          fill = 'hsl(142.1 76.2% 36.3%)'; // green-600
                        } else if (variance !== null && variance < 0) {
                          fill = 'hsl(var(--destructive))';
                        }
                      }
                      if (entry.isHoliday) {
                        fill = 'hsl(38 92% 50%)'; // amber for holidays
                      }
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>

                  {/* Today reference line */}
                  {comparisons.find(c => c.isToday) && (
                    <ReferenceLine 
                      x={comparisons.find(c => c.isToday)?.dayLabel} 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      label={{ value: 'Hoy', position: 'top', fontSize: 10 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142.1 76.2% 36.3%)' }} />
                Superó forecast
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-destructive" />
                Bajo forecast
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(38 92% 50%)' }} />
                Día feriado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-8 border-t-2 border-dashed border-primary" />
                Forecast (ajustado por día semana)
              </span>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">
              Patrón semanal histórico 2024: Dom ×0.41 | Sáb ×0.71 | Jue ×1.29
            </p>
          </TabsContent>

          <TabsContent value="cumulative" className="mt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comparisons} margin={{ top: 10, right: 10, left: isGmv ? 10 : 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="dayLabel" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                    tickFormatter={isGmv ? (v) => formatCurrency(v) : undefined}
                  />
                  <Tooltip content={<CumulativeTooltip viewMode={viewMode} />} />
                  
                  {/* Forecast cumulative line */}
                  <Line 
                    type="monotone" 
                    dataKey={forecastCumKey}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Forecast Acum."
                  />
                  
                  {/* Actual cumulative area */}
                  <Area 
                    type="monotone" 
                    dataKey={actualCumKey}
                    fill="hsl(142.1 76.2% 36.3% / 0.3)"
                    stroke="hsl(142.1 76.2% 36.3%)"
                    strokeWidth={2}
                    name="Real Acum."
                  />

                  {/* Today reference line */}
                  {comparisons.find(c => c.isToday) && (
                    <ReferenceLine 
                      x={comparisons.find(c => c.isToday)?.dayLabel} 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      label={{ value: 'Hoy', position: 'top', fontSize: 10 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142.1 76.2% 36.3% / 0.3)' }} />
                Real acumulado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-8 border-t-2 border-dashed border-primary" />
                Forecast acumulado
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
