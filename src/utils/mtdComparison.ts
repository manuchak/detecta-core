/**
 * Utilidades para comparaciones Month-to-Date (MTD) justas
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentMonthInfo, getPreviousMonthInfo } from './dynamicDateUtils';

export interface MTDComparisonData {
  current: {
    year: number;
    services: number;
    gmv: number;
    aov: number;
  };
  previous: {
    year: number;
    services: number;
    gmv: number;
    aov: number;
  };
  growth: {
    services: number;
    gmv: number;
    aov: number;
  };
  periodLabel: {
    current: string;
    previous: string;
  };
}

/**
 * Calcula las fechas para comparación MTD
 */
export const getMTDDates = () => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = getCurrentMonthInfo();
  const previousMonth = getPreviousMonthInfo();
  
  return {
    currentYear: currentMonth.year,
    currentMonth: currentMonth.monthNumber,
    currentDay,
    previousYear: previousMonth.year,
    previousMonth: previousMonth.monthNumber,
  };
};

/**
 * Obtiene datos de comparación MTD desde Supabase
 */
export const calculateMTDComparison = async (): Promise<MTDComparisonData> => {
  try {
    const dates = getMTDDates();
    
    const { data, error } = await supabase.rpc('get_mtd_comparison', {
      p_current_year: dates.currentYear,
      p_current_month: dates.currentMonth,
      p_current_day: dates.currentDay,
      p_previous_year: dates.previousYear,
      p_previous_month: dates.previousMonth,
    });

    if (error) {
      console.error('Error fetching MTD comparison:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No MTD data available');
    }

    const result = data[0];
    
    // Calcular crecimiento porcentual
    const servicesGrowth = result.previous_services > 0 
      ? ((result.current_services - result.previous_services) / result.previous_services) * 100 
      : 0;
    
    const gmvGrowth = result.previous_gmv > 0 
      ? ((result.current_gmv - result.previous_gmv) / result.previous_gmv) * 100 
      : 0;
    
    const aovGrowth = result.previous_aov > 0 
      ? ((result.current_aov - result.previous_aov) / result.previous_aov) * 100 
      : 0;

    // Generar etiquetas de período
    const currentMonthInfo = getCurrentMonthInfo();
    const previousMonthInfo = getPreviousMonthInfo();
    
    const periodLabel = {
      current: `${currentMonthInfo.monthName} (1-${dates.currentDay})`,
      previous: `${previousMonthInfo.monthName} (1-${dates.currentDay})`
    };

    return {
      current: {
        year: result.current_year,
        services: result.current_services,
        gmv: result.current_gmv,
        aov: result.current_aov,
      },
      previous: {
        year: result.previous_year,
        services: result.previous_services,
        gmv: result.previous_gmv,
        aov: result.previous_aov,
      },
      growth: {
        services: Math.round(servicesGrowth * 100) / 100,
        gmv: Math.round(gmvGrowth * 100) / 100,
        aov: Math.round(aovGrowth * 100) / 100,
      },
      periodLabel,
    };
  } catch (error) {
    console.error('Error calculating MTD comparison:', error);
    
    // Valores por defecto en caso de error
    const currentMonthInfo = getCurrentMonthInfo();
    const previousMonthInfo = getPreviousMonthInfo();
    
    return {
      current: { year: currentMonthInfo.year, services: 0, gmv: 0, aov: 0 },
      previous: { year: previousMonthInfo.year, services: 0, gmv: 0, aov: 0 },
      growth: { services: 0, gmv: 0, aov: 0 },
      periodLabel: {
        current: `${currentMonthInfo.monthName} (1-${new Date().getDate()})`,
        previous: `${previousMonthInfo.monthName} (1-${new Date().getDate()})`
      },
    };
  }
};

/**
 * Formatea el porcentaje de crecimiento con color
 */
export const formatGrowthPercentage = (growth: number): { value: string; isPositive: boolean } => {
  const isPositive = growth >= 0;
  const formattedValue = `${isPositive ? '+' : ''}${growth.toFixed(1)}%`;
  
  return {
    value: formattedValue,
    isPositive,
  };
};