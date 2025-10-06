import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useYearOverYearComparison } from '@/hooks/useYearOverYearComparison';
import { useDynamicServiceData } from '@/hooks/useDynamicServiceData';
import { Loader2, Zap, CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { getPaceStatus, getStatusTextColor } from '@/utils/paceStatus';
import { useMemo } from 'react';

export const PaceAnalysisCard = () => {
  const { data: yearData, isLoading: yearLoading } = useYearOverYearComparison();
  const { data: dynamicData, isLoading: dynamicLoading } = useDynamicServiceData();

  const calculations = useMemo(() => {
    if (!dynamicData || !yearData) return null;
    
    // Calculate annual pace requirements
    const currentDate = new Date();
    const daysInYear = 365;
    const daysElapsed = Math.floor((currentDate.getTime() - new Date(2025, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = daysInYear - daysElapsed;
    
    const currentAnnualPace = yearData.current2025.ytdServices / daysElapsed;
    const requiredPaceFor2024 = (10714 - yearData.current2025.ytdServices) / daysRemaining;
    const annualPaceStatus = getPaceStatus(currentAnnualPace, requiredPaceFor2024);

    // Calculate services needed to match 2024
    const servicesNeeded = 10714 - yearData.current2025.ytdServices;
    const gmvNeeded = (servicesNeeded * dynamicData.currentMonth.aov) / 1000000;

    return {
      daysElapsed,
      daysRemaining,
      currentAnnualPace,
      requiredPaceFor2024,
      annualPaceStatus,
      servicesNeeded,
      gmvNeeded
    };
  }, [dynamicData, yearData]);

  if (dynamicLoading || yearLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!dynamicData || !yearData || !calculations) return null;

  const isOnTrack = calculations.annualPaceStatus.status === 'exceeding' || calculations.annualPaceStatus.status === 'on_track';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Ritmo Anual 2025
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Annual Pace Analysis */}
        <div>
          <div className="text-sm font-medium mb-3">ANÁLISIS YTD</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Días transcurridos:</span>
              <span className="font-medium">{calculations.daysElapsed} días</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ritmo actual YTD:</span>
              <span className="font-medium">{Math.round(calculations.currentAnnualPace * 10) / 10} srv/día</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Para igualar 2024:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{Math.round(calculations.requiredPaceFor2024 * 10) / 10} srv/día</span>
                <span className="text-xs text-muted-foreground">
                  ({Math.round(((calculations.requiredPaceFor2024 / calculations.currentAnnualPace) - 1) * 100) >= 0 ? '+' : ''}{Math.round(((calculations.requiredPaceFor2024 / calculations.currentAnnualPace) - 1) * 100)}%)
                </span>
                {isOnTrack ? (
                  <CheckCircle className={`h-4 w-4 ${getStatusTextColor(calculations.annualPaceStatus.status)}`} />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Días restantes:</span>
              <span className="font-medium">{calculations.daysRemaining} días</span>
            </div>
          </div>
        </div>

        {/* Year Comparison */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3">COMPARATIVA 2025 vs 2024</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">YTD 2025:</span>
              <span className="font-medium">{yearData.current2025.ytdServices.toLocaleString()} srv | ${yearData.current2025.ytdGmv.toFixed(1)}M</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">YTD 2024 (mismo período):</span>
              <span className="font-medium">{yearData.same2024.ytdServices.toLocaleString()} srv | ${yearData.same2024.ytdGmv.toFixed(1)}M</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Brecha:</span>
              <span className={`font-medium ${yearData.growth.servicesPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                {yearData.growth.servicesGap >= 0 ? '+' : ''}{yearData.growth.servicesGap.toLocaleString()} srv ({yearData.growth.servicesPercent >= 0 ? '+' : ''}{yearData.growth.servicesPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Required - Only show if behind */}
        {!isOnTrack && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">ACCIÓN REQUERIDA</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="font-medium">
                Necesitas: +{Math.round(calculations.servicesNeeded).toLocaleString()} servicios adicionales
              </div>
              <div className="text-muted-foreground">
                ≈ ${calculations.gmvNeeded.toFixed(1)}M GMV adicional para igualar 2024
              </div>
            </div>
          </div>
        )}

        {/* Success message if on track */}
        {isOnTrack && (
          <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center gap-2 text-success mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">En buen camino</span>
            </div>
            <div className="text-sm text-muted-foreground">
              El ritmo actual es suficiente para {calculations.annualPaceStatus.status === 'exceeding' ? 'superar' : 'igualar'} el desempeño de 2024.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};