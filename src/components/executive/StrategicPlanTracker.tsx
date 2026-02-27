import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, BarChart3, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useStrategicPlanTracking } from '@/hooks/useStrategicPlanTracking';
import { BulletChart } from './BulletChart';
import { BurnUpChart } from './BurnUpChart';
import { PaceIndicator } from './PaceIndicator';
import { MobileChartBlock } from './MobileChartBlock';
import { cn } from '@/lib/utils';
import { getLastDataDate, MONTH_NAMES_SHORT_ES } from '@/utils/timezoneUtils';
import { QuarterlyAnnualScorecard } from './QuarterlyAnnualScorecard';
import { useIsMobile } from '@/hooks/use-mobile';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const StrategicPlanTracker: React.FC = () => {
  const { dailyData, summary, isLoading } = useStrategicPlanTracking();
  const [chartMetric, setChartMetric] = useState<'services' | 'gmv'>('services');
  const [showAllDays, setShowAllDays] = useState(false);
  const isMobile = useIsMobile();

  const now = new Date();
  const currentMonth = MONTH_NAMES[now.getMonth()];
  const currentYear = now.getFullYear();
  
  const lastDataDate = getLastDataDate();
  const lastDataDay = lastDataDate.getDate();
  const lastDataMonth = MONTH_NAMES_SHORT_ES[lastDataDate.getMonth()];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const getOverallStatus = () => {
    const servicesOnTrack = summary.percentOfProRataServices >= 95;
    const gmvOnTrack = summary.percentOfProRataGMV >= 95;
    
    if (servicesOnTrack && gmvOnTrack) {
      return { label: 'En Meta', color: 'bg-emerald-500' };
    }
    if (summary.percentOfProRataServices >= 80 || summary.percentOfProRataGMV >= 80) {
      return { label: 'En Riesgo', color: 'bg-amber-500' };
    }
    return { label: 'Fuera de Meta', color: 'bg-red-500' };
  };

  const overallStatus = getOverallStatus();

  // Variance data
  const varianceDays = dailyData
    .filter(d => d.isPast || d.isToday)
    .slice(isMobile ? -5 : -7);

  const visibleDays = isMobile && !showAllDays ? varianceDays.slice(-3) : varianceDays;

  // Pace indicators content
  const paceServices = (
    <PaceIndicator
      label="Ritmo de Servicios"
      paceActual={summary.paceActual}
      paceNeeded={summary.paceNeeded}
      projected={summary.projectedServices}
      target={summary.targetServices}
      format="number"
      daysRemaining={summary.daysRemaining}
      seasonalConfidence={summary.seasonalConfidence}
      methodology={summary.projectionMethodology}
    />
  );

  const paceGMV = (
    <PaceIndicator
      label="Ritmo de GMV"
      paceActual={summary.paceActualGMV}
      paceNeeded={summary.paceNeededGMV}
      projected={summary.projectedGMV}
      target={summary.targetGMV}
      format="currency"
      daysRemaining={summary.daysRemaining}
      seasonalConfidence={summary.seasonalConfidence}
      methodology={summary.projectionMethodology}
    />
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Plan Estratégico 2026
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Seguimiento {currentMonth} {currentYear}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="gap-1 text-muted-foreground text-[10px] sm:text-xs">
                <Clock className="h-3 w-3" />
                {lastDataDay} {lastDataMonth}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs">
                <Calendar className="h-3 w-3" />
                D{summary.currentDay}/{summary.daysInMonth}
              </Badge>
              <Badge className={cn("text-white text-[10px] sm:text-xs", overallStatus.color)}>
                {overallStatus.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold">{summary.actualServices.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Servicios MTD</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold">
                ${(summary.actualGMV / 1000000).toFixed(2)}M
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">GMV MTD</p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-xl sm:text-2xl font-bold",
                summary.gapToProRata >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {summary.gapToProRata >= 0 ? '+' : ''}{summary.gapToProRata}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">vs Pro-rata</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold">{summary.daysRemaining}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Días restantes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bullet Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Servicios vs Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BulletChart
              label="Servicios"
              actual={summary.actualServices}
              proRata={summary.proRataServices}
              target={summary.targetServices}
              format="number"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              GMV vs Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BulletChart
              label="GMV"
              actual={summary.actualGMV}
              proRata={summary.proRataGMV}
              target={summary.targetGMV}
              format="currency"
            />
          </CardContent>
        </Card>
      </div>

      {/* Pace Indicators — tabs on mobile, grid on desktop */}
      {isMobile ? (
        <MobileChartBlock
          tabs={[
            { label: 'Servicios', content: paceServices },
            { label: 'GMV', content: paceGMV },
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paceServices}
          {paceGMV}
        </div>
      )}

      {/* Burn-up Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Progreso Acumulado vs Plan
            </CardTitle>
            <Tabs value={chartMetric} onValueChange={(v) => setChartMetric(v as 'services' | 'gmv')}>
              <TabsList className="h-8 md:h-8">
                <TabsTrigger value="services" className="text-xs px-3 min-h-[36px] md:min-h-0 md:h-7">
                  Servicios
                </TabsTrigger>
                <TabsTrigger value="gmv" className="text-xs px-3 min-h-[36px] md:min-h-0 md:h-7">
                  GMV
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <p className="text-xs text-muted-foreground">
            Línea punteada = Plan • Área = Real
          </p>
        </CardHeader>
        <CardContent>
          <BurnUpChart
            data={dailyData}
            metric={chartMetric}
            target={chartMetric === 'services' ? summary.targetServices : summary.targetGMV}
            currentDay={summary.currentDay}
          />
        </CardContent>
      </Card>

      {/* Daily Variance — Card list on mobile, table on desktop */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Varianza Diaria (Últimos {isMobile ? 5 : 7} días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <div className="space-y-2">
              {visibleDays.map((day) => {
                const dailyVariance = day.actualServicesDaily - day.planServicesDaily;
                return (
                  <div
                    key={day.day}
                    className={cn(
                      "rounded-lg border p-3 space-y-1.5",
                      day.isToday && "border-primary/40 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Día {day.day}</span>
                        {day.isToday && <Badge variant="outline" className="text-[10px] py-0">Hoy</Badge>}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          dailyVariance >= 0 ? "text-emerald-600 border-emerald-200" : "text-red-600 border-red-200"
                        )}
                      >
                        {dailyVariance >= 0 ? '+' : ''}{dailyVariance}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Plan: {day.planServicesDaily} · Real: {day.actualServicesDaily}</span>
                      <span>Acum: {day.actualServicesCumulative}/{day.planServicesCumulative}</span>
                    </div>
                  </div>
                );
              })}
              {varianceDays.length > 3 && (
                <button
                  onClick={() => setShowAllDays(!showAllDays)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground py-2 min-h-[44px] hover:text-foreground transition-colors"
                >
                  {showAllDays ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showAllDays ? 'Ver menos' : `Ver ${varianceDays.length - 3} días más`}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Día</th>
                    <th className="text-right py-2 font-medium">Plan</th>
                    <th className="text-right py-2 font-medium">Actual</th>
                    <th className="text-right py-2 font-medium">Varianza</th>
                    <th className="text-right py-2 font-medium">Acum. Plan</th>
                    <th className="text-right py-2 font-medium">Acum. Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {varianceDays.map((day) => {
                    const dailyVariance = day.actualServicesDaily - day.planServicesDaily;
                    return (
                      <tr 
                        key={day.day} 
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/30 transition-colors",
                          day.isToday && "bg-primary/5 font-medium"
                        )}
                      >
                        <td className="py-2">
                          {day.isToday && <Badge variant="outline" className="mr-2 text-xs">Hoy</Badge>}
                          {day.day}
                        </td>
                        <td className="text-right py-2 text-muted-foreground">
                          {day.planServicesDaily}
                        </td>
                        <td className="text-right py-2">
                          {day.actualServicesDaily}
                        </td>
                        <td className={cn(
                          "text-right py-2 font-medium",
                          dailyVariance >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {dailyVariance >= 0 ? '+' : ''}{dailyVariance}
                        </td>
                        <td className="text-right py-2 text-muted-foreground">
                          {day.planServicesCumulative}
                        </td>
                        <td className="text-right py-2">
                          {day.actualServicesCumulative}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quarterly & Annual Scorecard */}
      <QuarterlyAnnualScorecard />
    </div>
  );
};
