/**
 * Utilidades para cálculos YTD por fechas exactas
 */

import { supabase } from "@/integrations/supabase/client";

export interface YTDComparisonData {
  currentYear: number;
  currentServices: number;
  currentGMV: number;
  previousYear: number;
  previousServices: number;
  previousGMV: number;
  servicesGrowth: number;
  gmvGrowth: number;
  servicesGrowthPercentage: number;
  gmvGrowthPercentage: number;
}

/**
 * Obtiene las fechas exactas para comparación YTD
 */
export const getExactYTDDates = () => {
  const now = new Date();
  
  // Ajustar por el retraso de un día en los datos
  const adjustedDate = new Date(now);
  adjustedDate.setDate(adjustedDate.getDate() - 1);
  
  // Fechas del año actual (YTD hasta ayer)
  const currentYearStart = new Date(adjustedDate.getFullYear(), 0, 1); // 1 enero año actual
  const currentYearEnd = new Date(adjustedDate); // hasta ayer
  
  // Fechas del año anterior (mismo período exacto)
  const previousYearStart = new Date(adjustedDate.getFullYear() - 1, 0, 1); // 1 enero año anterior
  const previousYearEnd = new Date(adjustedDate.getFullYear() - 1, adjustedDate.getMonth(), adjustedDate.getDate());
  
  return {
    currentYearStart: currentYearStart.toISOString().split('T')[0],
    currentYearEnd: currentYearEnd.toISOString().split('T')[0],
    previousYearStart: previousYearStart.toISOString().split('T')[0],
    previousYearEnd: previousYearEnd.toISOString().split('T')[0]
  };
};

/**
 * Calcula YTD usando fechas exactas para comparación justa
 */
export const calculateExactYTDComparison = async (): Promise<YTDComparisonData | null> => {
  try {
    const dates = getExactYTDDates();
    
    const { data, error } = await supabase.rpc('get_ytd_by_exact_dates', {
      start_date_current: dates.currentYearStart,
      end_date_current: dates.currentYearEnd,
      start_date_previous: dates.previousYearStart,
      end_date_previous: dates.previousYearEnd
    });

    if (error) {
      console.error('Error fetching exact YTD data:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    
    // Calcular crecimientos
    const servicesGrowth = result.current_services - result.previous_services;
    const gmvGrowth = result.current_gmv - result.previous_gmv;
    
    const servicesGrowthPercentage = result.previous_services > 0 
      ? ((servicesGrowth / result.previous_services) * 100)
      : 0;
    
    const gmvGrowthPercentage = result.previous_gmv > 0 
      ? ((gmvGrowth / result.previous_gmv) * 100)
      : 0;

    return {
      currentYear: result.current_year,
      currentServices: result.current_services,
      currentGMV: result.current_gmv,
      previousYear: result.previous_year,
      previousServices: result.previous_services,
      previousGMV: result.previous_gmv,
      servicesGrowth,
      gmvGrowth,
      servicesGrowthPercentage,
      gmvGrowthPercentage
    };
  } catch (error) {
    console.error('Error in calculateExactYTDComparison:', error);
    return null;
  }
};

/**
 * Obtiene la etiqueta descriptiva del período YTD
 */
export const getYTDPeriodLabel = () => {
  const dates = getExactYTDDates();
  const currentEndDate = new Date(dates.currentYearEnd);
  const previousEndDate = new Date(dates.previousYearEnd);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    });
  };
  
  return {
    current: `YTD al ${formatDate(currentEndDate)}, ${currentEndDate.getFullYear()}`,
    previous: `YTD al ${formatDate(previousEndDate)}, ${previousEndDate.getFullYear()}`,
    comparison: `YTD ${currentEndDate.getFullYear()} vs YTD ${previousEndDate.getFullYear()} (períodos exactos)`
  };
};