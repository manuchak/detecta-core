import { useQuery } from '@tanstack/react-query';
import { useCurrentMonthTarget } from './useBusinessTargets';
import { useDailyActualServices } from './useDailyActualServices';
import { analyzeWeekdaySeasonality, calculateWeekdayAdjustedProjection, SeasonalProjection } from '@/utils/weekdaySeasonalityAnalysis';

export interface StrategicPlanDay {
  day: number;
  date: string;
  planServicesDaily: number;
  planServicesCumulative: number;
  actualServicesDaily: number;
  actualServicesCumulative: number;
  planGMVDaily: number;
  planGMVCumulative: number;
  actualGMVDaily: number;
  actualGMVCumulative: number;
  varianceServices: number;
  varianceGMV: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface StrategicPlanSummary {
  // Targets
  targetServices: number;
  targetGMV: number;
  targetAOV: number;
  targetActiveCustodians: number | null;
  
  // Actuals
  actualServices: number;
  actualGMV: number;
  actualAOV: number;
  
  // Pro-rata (where we should be today)
  proRataServices: number;
  proRataGMV: number;
  
  // Gaps
  gapToProRata: number;
  gapToProRataGMV: number;
  gapToTarget: number;
  gapToTargetGMV: number;
  
  // Pace
  paceActual: number;
  paceNeeded: number;
  paceActualGMV: number;
  paceNeededGMV: number;
  
  // Projections - Now using seasonal model
  projectedServices: number;
  projectedGMV: number;
  projectedGMVLinear: number; // Reference for comparison
  willMeetServicesTarget: boolean;
  willMeetGMVTarget: boolean;
  
  // Seasonal projection metadata
  seasonalConfidence: 'Alta' | 'Media' | 'Baja';
  projectionMethodology: string;
  
  // Progress
  percentCompleteServices: number;
  percentCompleteGMV: number;
  percentOfProRataServices: number;
  percentOfProRataGMV: number;
  
  // Time
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  currentDay: number;
}

export interface StrategicPlanMetrics {
  dailyData: StrategicPlanDay[];
  summary: StrategicPlanSummary;
  isLoading: boolean;
  error: Error | null;
}

export const useStrategicPlanTracking = (): StrategicPlanMetrics => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentDay = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const { data: targetData, isLoading: targetLoading } = useCurrentMonthTarget();
  const { data: dailyActuals, isLoading: actualsLoading } = useDailyActualServices(year, month);

  // Seasonal projection query
  const { data: seasonalProjection, isLoading: seasonalLoading } = useQuery({
    queryKey: ['seasonal-projection', year, month, currentDay],
    queryFn: async (): Promise<SeasonalProjection> => {
      const weekdayPattern = await analyzeWeekdaySeasonality();
      return await calculateWeekdayAdjustedProjection(weekdayPattern);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const isLoading = targetLoading || actualsLoading || seasonalLoading;

  // Calculate daily data
  const dailyData: StrategicPlanDay[] = [];
  
  if (targetData && dailyActuals) {
    const dailyPlanServices = targetData.targetServices / daysInMonth;
    const dailyPlanGMV = targetData.targetGMV / daysInMonth;
    
    let cumulativeActualServices = 0;
    let cumulativeActualGMV = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = dailyActuals.find(d => d.dayOfMonth === day);
      const actualServicesDaily = dayData?.services || 0;
      const actualGMVDaily = dayData?.gmv || 0;
      
      cumulativeActualServices += actualServicesDaily;
      cumulativeActualGMV += actualGMVDaily;
      
      const planServicesCumulative = Math.round(dailyPlanServices * day);
      const planGMVCumulative = Math.round(dailyPlanGMV * day);
      
      dailyData.push({
        day,
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        planServicesDaily: Math.round(dailyPlanServices),
        planServicesCumulative,
        actualServicesDaily,
        actualServicesCumulative: cumulativeActualServices,
        planGMVDaily: Math.round(dailyPlanGMV),
        planGMVCumulative,
        actualGMVDaily,
        actualGMVCumulative: cumulativeActualGMV,
        varianceServices: cumulativeActualServices - planServicesCumulative,
        varianceGMV: cumulativeActualGMV - planGMVCumulative,
        isToday: day === currentDay,
        isPast: day < currentDay,
        isFuture: day > currentDay,
      });
    }
  }

  // Calculate summary
  const todayData = dailyData.find(d => d.isToday);
  const actualServices = todayData?.actualServicesCumulative || 0;
  const actualGMV = todayData?.actualGMVCumulative || 0;
  
  const targetServices = targetData?.targetServices || 0;
  const targetGMV = targetData?.targetGMV || 0;
  const proRataServices = targetData?.proRataServices || 0;
  const proRataGMV = targetData?.proRataGMV || 0;
  
  const daysElapsed = currentDay;
  const daysRemaining = daysInMonth - currentDay;
  
  // Pace calculations (still useful for display)
  const paceActual = daysElapsed > 0 ? actualServices / daysElapsed : 0;
  const paceNeeded = daysRemaining > 0 
    ? (targetServices - actualServices) / daysRemaining 
    : 0;
  
  const paceActualGMV = daysElapsed > 0 ? actualGMV / daysElapsed : 0;
  const paceNeededGMV = daysRemaining > 0 
    ? (targetGMV - actualGMV) / daysRemaining 
    : 0;
  
  // Linear projection (for reference/comparison)
  const projectedGMVLinear = Math.round(paceActualGMV * daysInMonth);
  
  // Use seasonal projection as primary (more accurate)
  const projectedGMV = seasonalProjection?.totalProjectedGMV || projectedGMVLinear;
  
  // Calculate projected services based on actual AOV and seasonal GMV
  const actualAOV = actualServices > 0 ? actualGMV / actualServices : 0;
  const projectedServices = actualAOV > 0 
    ? Math.round(projectedGMV / actualAOV)
    : Math.round(paceActual * daysInMonth);
  
  const summary: StrategicPlanSummary = {
    targetServices,
    targetGMV,
    targetAOV: targetServices > 0 ? targetGMV / targetServices : 0,
    targetActiveCustodians: targetData?.targetActiveCustodians || null,
    
    actualServices,
    actualGMV,
    actualAOV,
    
    proRataServices,
    proRataGMV,
    
    gapToProRata: actualServices - proRataServices,
    gapToProRataGMV: actualGMV - proRataGMV,
    gapToTarget: actualServices - targetServices,
    gapToTargetGMV: actualGMV - targetGMV,
    
    paceActual,
    paceNeeded,
    paceActualGMV,
    paceNeededGMV,
    
    // Primary projections now use seasonal model
    projectedServices,
    projectedGMV,
    projectedGMVLinear, // Keep linear for transparency
    willMeetServicesTarget: projectedServices >= targetServices,
    willMeetGMVTarget: projectedGMV >= targetGMV,
    
    // Seasonal metadata
    seasonalConfidence: seasonalProjection?.confidence || 'Media',
    projectionMethodology: seasonalProjection?.methodology || 'Proyección lineal (cargando estacional...)',
    
    percentCompleteServices: targetServices > 0 ? (actualServices / targetServices) * 100 : 0,
    percentCompleteGMV: targetGMV > 0 ? (actualGMV / targetGMV) * 100 : 0,
    percentOfProRataServices: proRataServices > 0 ? (actualServices / proRataServices) * 100 : 0,
    percentOfProRataGMV: proRataGMV > 0 ? (actualGMV / proRataGMV) * 100 : 0,
    
    daysElapsed,
    daysRemaining,
    daysInMonth,
    currentDay,
  };

  return {
    dailyData,
    summary,
    isLoading,
    error: null,
  };
};
