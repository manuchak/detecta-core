/**
 * UnifiedGMVDashboard - Componente consolidado que fusiona:
 * - GMVProjectionCard (proyección principal + escenarios)
 * - ForecastVsActualChart (tracking diario/acumulado)
 * - ForecastAccuracyPanel (MAPE + feriados)
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealisticProjectionsWithGuardrails } from '@/hooks/useRealisticProjectionsWithGuardrails';
import { usePreviousMonthData } from '@/hooks/usePreviousMonthData';
import { useForecastVsActual } from '@/hooks/useForecastVsActual';
import { useForecastAccuracyTracking } from '@/hooks/useForecastAccuracyTracking';
import { useHolidayAdjustment } from '@/hooks/useHolidayAdjustment';
import { getCurrentMonthInfo, formatMonthlyQuestion, capitalize } from '@/utils/dynamicDateUtils';
import { formatGMV } from '@/utils/formatUtils';
import { 
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { 
  DollarSign, Brain, Activity, History, Clock, TrendingUp, TrendingDown, 
  Minus, Calendar, Target, BarChart3, Eye, EyeOff, AlertTriangle, 
  Percent, ChevronDown, CheckCircle 
} from 'lucide-react';

type ViewMode = 'services' | 'gmv';

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

// Tooltips reutilizados del ForecastVsActualChart
const DailyTooltip = ({ active, payload, viewMode }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const isGmv = viewMode === 'gmv';
  const forecast = isGmv ? data.gmvForecast : data.forecast;
  const actual = isGmv ? data.gmvActual : data.actual;
  const variance = isGmv ? data.gmvVariance : data.variance;
  const variancePct = isGmv ? data.gmvVariancePct : data.variancePct;
  const adjustedForecast = isGmv ? data.gmvAdjustedForecast : data.adjustedForecast;
  const isFutureDay = !data.isPast && !data.isToday;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
      <p className="font-medium text-foreground">{data.weekdayName} {data.dayOfMonth}</p>
      {data.isHoliday && <p className="text-xs text-amber-500">{data.holidayName}</p>}
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-muted-foreground">
          Forecast: <span className="text-foreground font-medium">{isGmv ? formatCurrency(forecast) : forecast}</span>
        </p>
        {isFutureDay && data.adjustmentFactor !== 1 && (
          <p className="text-amber-600">
            Ajustado: <span className="font-medium">{isGmv ? formatCurrency(adjustedForecast) : adjustedForecast}</span>
            <span className="text-xs ml-1">({((data.adjustmentFactor - 1) * 100).toFixed(1)}%)</span>
          </p>
        )}
        {isFutureDay && (
          <p className={`text-xs font-medium ${data.probabilityToReach >= 50 ? 'text-green-600' : 'text-amber-500'}`}>
            <Percent className="h-3 w-3 inline mr-1" />
            {data.probabilityToReach.toFixed(0)}% prob.
          </p>
        )}
        {actual !== null && (
          <>
            <p className="text-muted-foreground">
              Real: <span className="text-foreground font-medium">{isGmv ? formatCurrency(actual) : actual}</span>
            </p>
            <p className={`font-medium ${variance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {variance >= 0 ? '+' : ''}{isGmv ? formatCurrency(variance) : variance} ({variancePct?.toFixed(1)}%)
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const CumulativeTooltip = ({ active, payload, viewMode }: any) => {
  if (!active || !payload?.length) return null;
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
          Forecast acum: <span className="text-foreground font-medium">{isGmv ? formatCurrency(forecastCum) : forecastCum}</span>
        </p>
        {actualCum !== null && (
          <>
            <p className="text-muted-foreground">
              Real acum: <span className="text-foreground font-medium">{isGmv ? formatCurrency(actualCum) : actualCum}</span>
            </p>
            <p className={`font-medium ${gap! >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              Gap: {isGmv ? formatCurrency(gap!) : gap}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export const UnifiedGMVDashboard: React.FC = () => {
  const { data: projectionData, isLoading: projectionLoading } = useRealisticProjectionsWithGuardrails();
  const previousMonthData = usePreviousMonthData();
  const { comparisons, metrics, isLoading: trackingLoading } = useForecastVsActual();
  const { data: accuracy } = useForecastAccuracyTracking();
  const { data: holidays } = useHolidayAdjustment(projectionData?.daysRemaining ?? 0);
  
  const [viewMode, setViewMode] = useState<ViewMode>('services');
  const [showConfidenceBands, setShowConfidenceBands] = useState(true);
  const [accuracyOpen, setAccuracyOpen] = useState(false);
  
  const currentMonth = getCurrentMonthInfo();

  const calculations = useMemo(() => {
    if (!projectionData) return null;
    return {
      mostLikelyGMV: projectionData.mostLikely.gmv,
      currentGMV: projectionData.current.gmv,
      remainingGMV: projectionData.mostLikely.gmv - projectionData.current.gmv,
    };
  }, [projectionData]);

  if (projectionLoading || trackingLoading) {
    return (
      <Card className="col-span-2">
        <CardContent className="flex items-center justify-center h-96">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!projectionData || !calculations) return null;

  const isGmv = viewMode === 'gmv';
  const mape = accuracy?.currentMAPE ?? 18.5;
  const targetMAPE = accuracy?.targetMAPE ?? 15;

  const TrendIcon = metrics?.trend === 'improving' ? TrendingUp : metrics?.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = metrics?.trend === 'improving' ? 'text-green-600' : metrics?.trend === 'declining' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-3">
        {/* Header principal */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-success" />
            <CardTitle className="text-xl font-medium">
              Proyección GMV {capitalize(currentMonth.fullName)}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Brain className="h-4 w-4 text-primary/60" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">{projectionData.regime.mathematicalJustification}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {projectionData.historicalMode?.active ? (
              <>
                <Badge variant="secondary" className="text-xs">
                  <History className="h-3 w-3 mr-1" />Histórica
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {projectionData.historicalMode.daysUntilRealtime}d → Real
                </Badge>
              </>
            ) : (
              <Badge 
                variant={projectionData.regime.type === 'exponential' ? 'default' : projectionData.regime.type === 'volatile' ? 'destructive' : 'outline'}
                className="text-xs"
              >
                <Activity className="h-3 w-3 mr-1" />
                {projectionData.regime.type === 'exponential' ? '🚀 Exponencial' :
                 projectionData.regime.type === 'volatile' ? '⚡ Volátil' : '📈 Normal'}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {projectionData.daysRemaining} días restantes
            </Badge>
          </div>
        </div>

        {/* Alerta modo histórico */}
        {projectionData.historicalMode?.active && (
          <Alert className="bg-secondary/50 border-secondary mt-3">
            <History className="h-4 w-4" />
            <AlertDescription className="text-sm">
              📊 Proyección basada en tendencias históricas. En {projectionData.historicalMode.daysUntilRealtime} días cambiará a tiempo real.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Proyección principal + Escenarios (compacto) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Proyección más probable */}
          <div className="lg:col-span-1 text-center p-4 bg-gradient-to-br from-warning/10 to-primary/10 rounded-xl border border-warning/20">
            <div className="text-xs text-muted-foreground mb-1">MÁS PROBABLE</div>
            <div className="text-3xl font-bold text-warning">${calculations.mostLikelyGMV.toFixed(1)}M</div>
            <Badge variant={projectionData.confidence.overall === 'high' ? 'default' : 'secondary'} className="text-xs mt-1">
              {projectionData.mostLikely.probability}% prob.
            </Badge>
            <div className="text-xs text-muted-foreground mt-2">
              vs {previousMonthData.month}: 
              <span className={`ml-1 font-medium ${calculations.mostLikelyGMV > previousMonthData.gmv ? 'text-success' : 'text-destructive'}`}>
                {calculations.mostLikelyGMV > previousMonthData.gmv ? '+' : ''}
                {(((calculations.mostLikelyGMV - previousMonthData.gmv) / previousMonthData.gmv) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Escenarios */}
          {projectionData.scenarios.map((scenario) => (
            <div key={scenario.name} className={`p-3 rounded-lg border ${
              scenario.color === 'destructive' ? 'bg-destructive/5 border-destructive/20' :
              scenario.color === 'warning' ? 'bg-warning/5 border-warning/20' :
              'bg-success/5 border-success/20'
            }`}>
              <div className={`text-xl font-bold ${
                scenario.color === 'destructive' ? 'text-destructive' :
                scenario.color === 'warning' ? 'text-warning' : 'text-success'
              }`}>
                ${scenario.gmv.toFixed(1)}M
              </div>
              <div className="text-sm font-medium">{scenario.name}</div>
              <div className="text-xs text-muted-foreground">{scenario.probability}% · {scenario.services} srv</div>
            </div>
          ))}
        </div>

        {/* Progreso actual */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-success">${calculations.currentGMV.toFixed(1)}M</div>
            <div className="text-xs text-muted-foreground">Actual ({((calculations.currentGMV / calculations.mostLikelyGMV) * 100).toFixed(0)}%)</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-warning">${calculations.remainingGMV.toFixed(1)}M</div>
            <div className="text-xs text-muted-foreground">Restante</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{projectionData.insights.paceNeeded}</div>
            <div className="text-xs text-muted-foreground">srv/día necesario</div>
          </div>
        </div>

        {/* Alerta de ajuste dinámico */}
        {metrics && metrics.correctionFactorApplied !== 1 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 text-xs">
            <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {metrics.adjustmentReason}
            </span>
          </div>
        )}

        {/* Tracking Chart con Tabs */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Tracking Diario</span>
              <div className="flex gap-0.5 bg-muted p-0.5 rounded-md">
                <Button size="sm" variant={viewMode === 'services' ? 'default' : 'ghost'} className="h-6 px-2 text-xs" onClick={() => setViewMode('services')}>
                  <BarChart3 className="h-3 w-3 mr-1" />Srv
                </Button>
                <Button size="sm" variant={viewMode === 'gmv' ? 'default' : 'ghost'} className="h-6 px-2 text-xs" onClick={() => setViewMode('gmv')}>
                  <DollarSign className="h-3 w-3 mr-1" />GMV
                </Button>
              </div>
              <Button size="sm" variant={showConfidenceBands ? 'default' : 'ghost'} className="h-6 px-2 text-xs" onClick={() => setShowConfidenceBands(!showConfidenceBands)}>
                {showConfidenceBands ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {metrics && (
                <>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />{metrics.daysCompleted}/31
                  </Badge>
                  <Badge variant={(metrics.daysMetForecast ?? 0) >= metrics.daysCompleted * 0.5 ? 'default' : 'destructive'} className="text-xs">
                    {metrics.daysMetForecast}/{metrics.daysCompleted} cumplidos
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${trendColor}`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {metrics.trend === 'improving' ? 'Mejorando' : metrics.trend === 'declining' ? 'Decayendo' : 'Estable'}
                  </Badge>
                  <Badge variant={metrics.monthlyTargetProbability >= 60 ? 'default' : 'destructive'} className="text-xs">
                    <Percent className="h-3 w-3 mr-1" />{metrics.monthlyTargetProbability}% prob.
                  </Badge>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 h-8">
              <TabsTrigger value="daily" className="text-xs">Día vs Día</TabsTrigger>
              <TabsTrigger value="cumulative" className="text-xs">Acumulado</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-0">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={comparisons} margin={{ top: 10, right: 10, left: isGmv ? 10 : 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="dayLabel" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" tickFormatter={isGmv ? (v) => formatCurrency(v) : undefined} />
                    <RechartsTooltip content={<DailyTooltip viewMode={viewMode} />} />
                    <Line type="monotone" dataKey={isGmv ? 'gmvForecast' : 'forecast'} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Bar dataKey={isGmv ? 'gmvActual' : 'actual'} radius={[2, 2, 0, 0]}>
                      {comparisons.map((entry, index) => {
                        const variance = isGmv ? entry.gmvVariance : entry.variance;
                        let fill = 'hsl(var(--primary))';
                        if ((isGmv ? entry.gmvActual : entry.actual) !== null) {
                          fill = variance !== null && variance >= 0 ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(var(--destructive))';
                        }
                        if (entry.isHoliday) fill = 'hsl(38 92% 50%)';
                        return <Cell key={`cell-${index}`} fill={fill} />;
                      })}
                    </Bar>
                    {comparisons.find(c => c.isToday) && (
                      <ReferenceLine x={comparisons.find(c => c.isToday)?.dayLabel} stroke="hsl(var(--primary))" strokeWidth={2} label={{ value: 'Hoy', position: 'top', fontSize: 9 }} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="cumulative" className="mt-0">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={comparisons} margin={{ top: 10, right: 10, left: isGmv ? 10 : 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="dayLabel" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" tickFormatter={isGmv ? (v) => formatCurrency(v) : undefined} />
                    <RechartsTooltip content={<CumulativeTooltip viewMode={viewMode} />} />
                    {showConfidenceBands && (
                      <>
                        <Area type="monotone" dataKey={isGmv ? 'gmvForecastCumulativeUpper' : 'forecastCumulativeUpper'} fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.2)" strokeWidth={1} strokeDasharray="2 2" dot={false} />
                        <Area type="monotone" dataKey={isGmv ? 'gmvForecastCumulativeLower' : 'forecastCumulativeLower'} fill="hsl(var(--background))" stroke="hsl(var(--primary) / 0.2)" strokeWidth={1} strokeDasharray="2 2" dot={false} />
                      </>
                    )}
                    <Line type="monotone" dataKey={isGmv ? 'gmvForecastCumulative' : 'forecastCumulative'} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Area type="monotone" dataKey={isGmv ? 'gmvActualCumulative' : 'actualCumulative'} fill="hsl(142.1 76.2% 36.3% / 0.3)" stroke="hsl(142.1 76.2% 36.3%)" strokeWidth={2} />
                    {comparisons.find(c => c.isToday) && (
                      <ReferenceLine x={comparisons.find(c => c.isToday)?.dayLabel} stroke="hsl(var(--primary))" strokeWidth={2} label={{ value: 'Hoy', position: 'top', fontSize: 9 }} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>

          {/* Leyenda compacta */}
          <div className="flex justify-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: 'hsl(142.1 76.2% 36.3%)' }} />Superó</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-destructive" />Bajo</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: 'hsl(38 92% 50%)' }} />Feriado</span>
            <span className="flex items-center gap-1"><span className="w-6 border-t-2 border-dashed border-primary" />Forecast</span>
          </div>
        </div>

        {/* Panel de Precisión Collapsible */}
        <Collapsible open={accuracyOpen} onOpenChange={setAccuracyOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2.5 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Precisión del Modelo</span>
              <Badge variant={accuracy?.isOnTarget ? 'default' : 'secondary'} className="text-xs">MAPE: {mape.toFixed(1)}%</Badge>
              {accuracy?.isOnTarget ? <CheckCircle className="h-3 w-3 text-success" /> : <AlertTriangle className="h-3 w-3 text-warning" />}
            </div>
            <div className="flex items-center gap-2">
              {holidays && holidays.totalImpactDays > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />{holidays.holidaysInPeriod} feriado{holidays.holidaysInPeriod > 1 ? 's' : ''}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${accuracyOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3 px-2 pb-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Precisión</span>
                <span>Target: {targetMAPE}%</span>
              </div>
              <Progress value={Math.max(0, Math.min(100, 100 - mape))} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-background rounded-lg">
                <div className="text-base font-semibold text-primary">{mape.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">MAPE Actual</div>
              </div>
              <div className="p-2 bg-background rounded-lg">
                <div className="text-base font-semibold text-muted-foreground">{accuracy?.historicalMAPE?.toFixed(1) ?? '20.0'}%</div>
                <div className="text-xs text-muted-foreground">Promedio 3M</div>
              </div>
              <div className="p-2 bg-background rounded-lg">
                <div className={`text-base font-semibold ${accuracy?.isOnTarget ? 'text-success' : 'text-warning'}`}>{targetMAPE}%</div>
                <div className="text-xs text-muted-foreground">Target</div>
              </div>
            </div>
            {holidays && holidays.totalImpactDays > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Feriados ({holidays.totalImpactDays} días impacto)
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {holidays.holidays.map((h, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-background rounded">
                      <span className="font-medium">{h.nombre}</span>
                      <Badge variant="destructive" className="text-xs">-{h.impacto_pct.toFixed(0)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
