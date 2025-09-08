import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthClosureAnalysis } from '@/hooks/useMonthClosureAnalysis';
import { useYearOverYearComparison } from '@/hooks/useYearOverYearComparison';
import { Loader2, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getPaceStatus, getStatusTextColor } from '@/utils/paceStatus';
import { useMemo } from 'react';

export const PaceAnalysisCard = () => {
  const { data: monthData, isLoading: monthLoading } = useMonthClosureAnalysis();
  const { data: yearData, isLoading: yearLoading } = useYearOverYearComparison();

  const calculations = useMemo(() => {
    if (!monthData || !yearData) return null;
    
    // Calculate annual pace requirements
    const currentDate = new Date();
    const daysInYear = 365;
    const daysElapsed = Math.floor((currentDate.getTime() - new Date(2025, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = daysInYear - daysElapsed;
    
    const currentAnnualPace = yearData.current2025.ytdServices / daysElapsed;
    const requiredPaceFor2024 = (10714 - yearData.current2025.ytdServices) / daysRemaining; // Assuming 10714 was 2024 total
    const growthPaceNeeded = 32; // Target for growth

    // Get status using the utility function
    const monthPaceStatus = getPaceStatus(monthData.currentPace, monthData.requiredPace);
    const growthPaceStatus = getPaceStatus(monthData.currentPace, growthPaceNeeded);
    const annualPaceStatus = getPaceStatus(currentAnnualPace, requiredPaceFor2024);

    return {
      daysRemaining,
      currentAnnualPace,
      requiredPaceFor2024,
      growthPaceNeeded,
      monthPaceStatus,
      growthPaceStatus,
      annualPaceStatus
    };
  }, [monthData, yearData]);

  if (monthLoading || yearLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!monthData || !yearData || !calculations) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Análisis de Ritmo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* September Analysis */}
        <div>
          <div className="text-sm font-medium mb-3">SEPTIEMBRE</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Actual:</span>
              <span className="font-medium">{monthData.currentPace} servicios/día</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Meta agosto:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{monthData.requiredPace}/día</span>
                {calculations.monthPaceStatus.status === 'exceeding' || calculations.monthPaceStatus.status === 'on_track' ? (
                  <CheckCircle className={`h-4 w-4 ${getStatusTextColor(calculations.monthPaceStatus.status)}`} />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Meta crecimiento:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{calculations.growthPaceNeeded}/día</span>
                {calculations.growthPaceStatus.status === 'exceeding' || calculations.growthPaceStatus.status === 'on_track' ? (
                  <CheckCircle className={`h-4 w-4 ${getStatusTextColor(calculations.growthPaceStatus.status)}`} />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Annual Analysis */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3">ANUAL</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ritmo actual:</span>
              <span className="font-medium">{Math.round(calculations.currentAnnualPace * 10) / 10} servicios/día</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Para igualar 2024:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{Math.round(calculations.requiredPaceFor2024 * 10) / 10}/día</span>
                <span className="text-xs text-muted-foreground">
                  (+{Math.round(((calculations.requiredPaceFor2024 / calculations.currentAnnualPace) - 1) * 100)}%)
                </span>
                {calculations.annualPaceStatus.status === 'exceeding' || calculations.annualPaceStatus.status === 'on_track' ? (
                  <CheckCircle className={`h-4 w-4 ${getStatusTextColor(calculations.annualPaceStatus.status)}`} />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Días restantes:</span>
              <span className="font-medium">{calculations.daysRemaining}</span>
            </div>
          </div>
        </div>

        {/* Action Required */}
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-primary mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">ACCIÓN PARA SEPTIEMBRE</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="font-medium">
              Necesitas: +{Math.round((calculations.growthPaceNeeded - monthData.currentPace) * monthData.daysRemaining)} servicios adicionales
            </div>
            <div className="text-muted-foreground">
              = ${((calculations.growthPaceNeeded - monthData.currentPace) * monthData.daysRemaining * 7272 / 1000000).toFixed(1)}M GMV adicional
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};