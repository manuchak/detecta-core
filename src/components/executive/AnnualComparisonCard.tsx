/**
 * AnnualComparisonCard - Fusiona YearOverYearCard + PaceAnalysisCard
 * Muestra comparativa YTD 2025 vs 2024 y ritmo anual requerido
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useYearOverYearComparison } from '@/hooks/useYearOverYearComparison';
import { useDynamicServiceData } from '@/hooks/useDynamicServiceData';
import { Loader2, Calendar, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { getPaceStatus, getStatusTextColor } from '@/utils/paceStatus';
import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

export const AnnualComparisonCard = () => {
  const { data: yearData, isLoading: yearLoading } = useYearOverYearComparison();
  const { data: dynamicData, isLoading: dynamicLoading } = useDynamicServiceData();

  const calculations = useMemo(() => {
    if (!dynamicData || !yearData) return null;
    
    const currentDate = new Date();
    const daysInYear = 365;
    const daysElapsed = Math.floor((currentDate.getTime() - new Date(2025, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = daysInYear - daysElapsed;
    
    const currentAnnualPace = yearData.current2025.ytdServices / daysElapsed;
    const requiredPaceFor2024 = (10714 - yearData.current2025.ytdServices) / daysRemaining;
    const annualPaceStatus = getPaceStatus(currentAnnualPace, requiredPaceFor2024);

    const servicesNeeded = 10714 - yearData.current2025.ytdServices;
    const gmvNeeded = (servicesNeeded * dynamicData.currentMonth.aov) / 1000000;
    
    const progressPercent = (yearData.current2025.ytdServices / 10714) * 100;

    return {
      daysElapsed,
      daysRemaining,
      currentAnnualPace,
      requiredPaceFor2024,
      annualPaceStatus,
      servicesNeeded,
      gmvNeeded,
      progressPercent
    };
  }, [dynamicData, yearData]);

  if (yearLoading || dynamicLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!yearData || !calculations) return null;

  const isNegativeGrowth = yearData.growth.servicesPercent < 0;
  const isOnTrack = calculations.annualPaceStatus.status === 'exceeding' || calculations.annualPaceStatus.status === 'on_track';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Comparativa Anual
          </CardTitle>
          <div className="flex items-center gap-2">
            {isNegativeGrowth && (
              <Badge variant="destructive" className="text-xs">
                <TrendingDown className="h-3 w-3 mr-1" />Declive
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              Día {calculations.daysElapsed}/{365}
            </Badge>
          </div>
        </div>
        {yearData.periodLabel && (
          <p className="text-xs text-muted-foreground mt-1">{yearData.periodLabel.comparison}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress hacia 2024 */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progreso vs 2024 total (10,714)</span>
            <span>{calculations.progressPercent.toFixed(1)}%</span>
          </div>
          <Progress value={calculations.progressPercent} className="h-2" />
        </div>

        {/* Comparativa YTD Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-primary/5 rounded-lg">
            <div className="text-lg font-bold">{yearData.current2025.ytdServices.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">YTD 2025</div>
            <div className="text-xs text-muted-foreground">${yearData.current2025.ytdGmv.toFixed(1)}M</div>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-muted-foreground">{yearData.same2024.ytdServices.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">YTD 2024</div>
            <div className="text-xs text-muted-foreground">${yearData.same2024.ytdGmv.toFixed(1)}M</div>
          </div>
          <div className={`p-2 rounded-lg ${isNegativeGrowth ? 'bg-destructive/10' : 'bg-success/10'}`}>
            <div className={`text-lg font-bold flex items-center justify-center gap-1 ${isNegativeGrowth ? 'text-destructive' : 'text-success'}`}>
              {isNegativeGrowth ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {yearData.growth.servicesPercent}%
            </div>
            <div className="text-xs text-muted-foreground">Brecha</div>
            <div className={`text-xs ${isNegativeGrowth ? 'text-destructive' : 'text-success'}`}>
              {yearData.growth.servicesGap >= 0 ? '+' : ''}{yearData.growth.servicesGap.toLocaleString()} srv
            </div>
          </div>
        </div>

        {/* Ritmo Anual */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Ritmo para igualar 2024</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold">{calculations.currentAnnualPace.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">srv/día actual</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold flex items-center justify-center gap-1 ${isOnTrack ? 'text-success' : 'text-warning'}`}>
                {calculations.requiredPaceFor2024.toFixed(1)}
                {isOnTrack ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </div>
              <div className="text-xs text-muted-foreground">srv/día necesario</div>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className={`text-xs font-medium ${isOnTrack ? 'text-success' : 'text-warning'}`}>
              {isOnTrack ? '✓ En buen camino' : `+${Math.round(((calculations.requiredPaceFor2024 / calculations.currentAnnualPace) - 1) * 100)}% más rápido requerido`}
            </span>
          </div>
        </div>

        {/* Acción requerida o éxito */}
        {!isOnTrack ? (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Acción Requerida</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Faltan <span className="font-medium text-foreground">+{Math.round(calculations.servicesNeeded).toLocaleString()}</span> servicios 
              (≈${calculations.gmvNeeded.toFixed(1)}M) para igualar 2024
            </div>
          </div>
        ) : (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">En camino de {calculations.annualPaceStatus.status === 'exceeding' ? 'superar' : 'igualar'} 2024</span>
            </div>
          </div>
        )}

        {/* Proyección anual */}
        <div className="text-center p-2 bg-muted/30 rounded-lg">
          <div className="text-xs text-muted-foreground">Proyección anual 2025</div>
          <div className="text-lg font-bold">{yearData.annualProjection.projected2025.toLocaleString()} srv</div>
          <div className={`text-xs ${yearData.annualProjection.vs2024Percent < 0 ? 'text-destructive' : 'text-success'}`}>
            {yearData.annualProjection.vs2024Percent >= 0 ? '+' : ''}{yearData.annualProjection.vs2024Percent}% vs 2024 total
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
