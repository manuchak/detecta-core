import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { useStrategicPlanTracking } from '@/hooks/useStrategicPlanTracking';
import { BulletChart } from './BulletChart';
import { BurnUpChart } from './BurnUpChart';
import { PaceIndicator } from './PaceIndicator';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const StrategicPlanTracker: React.FC = () => {
  const { dailyData, summary, isLoading } = useStrategicPlanTracking();
  const [chartMetric, setChartMetric] = useState<'services' | 'gmv'>('services');

  const now = new Date();
  const currentMonth = MONTH_NAMES[now.getMonth()];
  const currentYear = now.getFullYear();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                Día {summary.currentDay} de {summary.daysInMonth}
              </Badge>
              <Badge className={cn("text-white", overallStatus.color)}>
                {overallStatus.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold">{summary.actualServices.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Servicios MTD</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                ${(summary.actualGMV / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-muted-foreground">GMV MTD</p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-2xl font-bold",
                summary.gapToProRata >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {summary.gapToProRata >= 0 ? '+' : ''}{summary.gapToProRata}
              </p>
              <p className="text-xs text-muted-foreground">vs Pro-rata</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{summary.daysRemaining}</p>
              <p className="text-xs text-muted-foreground">Días restantes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bullet Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Pace Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      {/* Burn-up Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Progreso Acumulado vs Plan
            </CardTitle>
            <Tabs value={chartMetric} onValueChange={(v) => setChartMetric(v as 'services' | 'gmv')}>
              <TabsList className="h-8">
                <TabsTrigger value="services" className="text-xs px-3 h-7">
                  Servicios
                </TabsTrigger>
                <TabsTrigger value="gmv" className="text-xs px-3 h-7">
                  GMV
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <p className="text-xs text-muted-foreground">
            Línea punteada = Plan estratégico • Área sólida = Realidad
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

      {/* Daily Variance Table (Collapsible) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Varianza Diaria (Últimos 7 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                {dailyData
                  .filter(d => d.isPast || d.isToday)
                  .slice(-7)
                  .map((day) => {
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
        </CardContent>
      </Card>
    </div>
  );
};
