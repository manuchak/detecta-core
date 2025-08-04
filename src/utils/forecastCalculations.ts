// Utility functions for forecast calculations with real historical data

interface HistoricalData {
  // 2024 Historical Data
  monthly2024Average: number;
  annual2024Total: number;
  gmvMonthly2024Average: number;
  gmvAnnual2024Total: number;
  
  // 2025 Current Data  
  ytd2025Services: number;
  ytd2025GMV: number;
  previousMonth2025Services: number;
  previousMonth2025GMV: number;
}

// Real historical data based on DB analysis
const HISTORICAL_DATA: HistoricalData = {
  // 2024 averages and totals
  monthly2024Average: 893,
  annual2024Total: 10714,
  gmvMonthly2024Average: 5.3, // Million MXN
  gmvAnnual2024Total: 63.6, // Million MXN
  
  // 2025 current data (YTD through July)
  ytd2025Services: 5238,
  ytd2025GMV: 33.2, // Million MXN
  previousMonth2025Services: 910, // July 2025
  previousMonth2025GMV: 5.8, // Million MXN July 2025
};

/**
 * Calculate monthly variance for current month forecast
 */
export function calculateMonthlyVariance(
  forecastValue: number,
  comparisonType: 'vs_2024_avg' | 'vs_previous_month',
  isGMV: boolean = false
): { variance: number; label: string } {
  let baseValue: number;
  let label: string;
  
  if (comparisonType === 'vs_2024_avg') {
    baseValue = isGMV ? HISTORICAL_DATA.gmvMonthly2024Average : HISTORICAL_DATA.monthly2024Average;
    label = 'vs prom. 2024';
  } else {
    baseValue = isGMV ? HISTORICAL_DATA.previousMonth2025GMV : HISTORICAL_DATA.previousMonth2025Services;
    label = 'vs mes anterior';
  }
  
  if (baseValue === 0) return { variance: 0, label };
  
  const variance = ((forecastValue - baseValue) / baseValue) * 100;
  return { variance: Math.round(variance * 10) / 10, label }; // Round to 1 decimal
}

/**
 * Calculate annual variance comparing 2025 projection vs 2024 actual
 */
export function calculateAnnualVariance(
  annualProjection: number,
  isGMV: boolean = false
): { variance: number; label: string } {
  const baseValue = isGMV ? HISTORICAL_DATA.gmvAnnual2024Total : HISTORICAL_DATA.annual2024Total;
  
  if (baseValue === 0) return { variance: 0, label: 'vs 2024' };
  
  const variance = ((annualProjection - baseValue) / baseValue) * 100;
  return { 
    variance: Math.round(variance * 10) / 10, 
    label: 'vs 2024' 
  };
}

/**
 * Calculate realistic annual progress (YTD / Annual Projection)
 */
export function calculateAnnualProgress(
  annualProjection: number,
  isGMV: boolean = false
): number {
  const ytdValue = isGMV ? HISTORICAL_DATA.ytd2025GMV : HISTORICAL_DATA.ytd2025Services;
  
  if (annualProjection === 0) return 0;
  
  const progress = (ytdValue / annualProjection) * 100;
  return Math.min(progress, 100); // Cap at 100% to avoid unrealistic values
}

/**
 * Get current month data for forecast comparison
 */
export function getCurrentMonthData(): {
  monthName: string;
  monthNumber: number;
  progressThroughYear: number;
} {
  const now = new Date();
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const monthNumber = now.getMonth() + 1;
  const progressThroughYear = (monthNumber / 12) * 100;
  
  return {
    monthName: monthNames[now.getMonth()],
    monthNumber,
    progressThroughYear: Math.round(progressThroughYear)
  };
}

/**
 * Get formatted actual values for display
 */
export function getActualValues(): {
  monthlyServices: number;
  monthlyGMV: number;
  annualServicesYTD: number;
  annualGMVYTD: number;
} {
  return {
    monthlyServices: HISTORICAL_DATA.previousMonth2025Services, // Last completed month
    monthlyGMV: HISTORICAL_DATA.previousMonth2025GMV,
    annualServicesYTD: HISTORICAL_DATA.ytd2025Services,
    annualGMVYTD: HISTORICAL_DATA.ytd2025GMV
  };
}

/**
 * Format numbers for display in cards
 */
export function formatMetricValue(value: number, isGMV: boolean = false): string {
  if (isGMV) {
    return `$${value.toFixed(1)}M`;
  }
  
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toLocaleString();
}

/**
 * Get historical comparison context for tooltips
 */
export function getHistoricalContext(isGMV: boolean = false): {
  avg2024: number;
  total2024: number;
  ytd2025: number;
  lastMonth2025: number;
} {
  return {
    avg2024: isGMV ? HISTORICAL_DATA.gmvMonthly2024Average : HISTORICAL_DATA.monthly2024Average,
    total2024: isGMV ? HISTORICAL_DATA.gmvAnnual2024Total : HISTORICAL_DATA.annual2024Total,
    ytd2025: isGMV ? HISTORICAL_DATA.ytd2025GMV : HISTORICAL_DATA.ytd2025Services,
    lastMonth2025: isGMV ? HISTORICAL_DATA.previousMonth2025GMV : HISTORICAL_DATA.previousMonth2025Services
  };
}