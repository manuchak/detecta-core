
import { useMemo } from 'react';

export interface ForecastData {
  monthlyServicesForecast: number;
  monthlyGmvForecast: number;
  annualServicesForecast: number;
  annualGmvForecast: number;
  monthlyServicesActual: number;
  monthlyGmvActual: number;
  annualServicesActual: number;
  annualGmvActual: number;
  monthlyServicesVariance: number;
  monthlyGmvVariance: number;
  annualServicesVariance: number;
  annualGmvVariance: number;
}

export const useForecastData = (
  totalServices: number,
  totalGMV: number,
  historicalData?: Array<{ month: number; services: number; gmv: number }>
): ForecastData => {
  
  return useMemo(() => {
    // Obtener datos del mes actual
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const daysInMonth = new Date(currentDate.getFullYear(), currentMonth, 0).getDate();
    const daysPassed = currentDate.getDate();
    const daysRemaining = daysInMonth - daysPassed;
    
    // Función de suavizado exponencial simple
    const exponentialSmoothing = (data: number[], alpha: number = 0.3): number => {
      if (data.length === 0) return 0;
      if (data.length === 1) return data[0];
      
      let forecast = data[0];
      for (let i = 1; i < data.length; i++) {
        forecast = alpha * data[i] + (1 - alpha) * forecast;
      }
      return forecast;
    };
    
    // Generar datos históricos simulados si no se proporcionan
    const defaultHistoricalData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      services: Math.floor(totalServices * (0.7 + Math.random() * 0.6) / 12),
      gmv: Math.floor(totalGMV * (0.7 + Math.random() * 0.6) / 12)
    }));
    
    const dataToUse = historicalData || defaultHistoricalData;
    
    // Calcular promedios y tendencias
    const dailyServicesRate = totalServices / daysPassed;
    const dailyGmvRate = totalGMV / daysPassed;
    
    // Forecast mensual usando suavizado exponencial
    const monthlyServicesHistory = dataToUse.slice(-6).map(d => d.services);
    const monthlyGmvHistory = dataToUse.slice(-6).map(d => d.gmv);
    
    const monthlyServicesTrend = exponentialSmoothing(monthlyServicesHistory);
    const monthlyGmvTrend = exponentialSmoothing(monthlyGmvHistory);
    
    // Ajustar por progreso del mes actual
    const monthlyServicesForecast = Math.round(
      totalServices + (dailyServicesRate * daysRemaining * 1.1) // Factor de crecimiento
    );
    
    const monthlyGmvForecast = Math.round(
      totalGMV + (dailyGmvRate * daysRemaining * 1.15) // Factor de crecimiento ligeramente mayor para GMV
    );
    
    // Forecast anual basado en tendencia mensual
    const annualServicesForecast = Math.round(monthlyServicesForecast * 12 * 1.05); // Factor de crecimiento anual
    const annualGmvForecast = Math.round(monthlyGmvForecast * 12 * 1.08); // Factor de crecimiento anual mayor para GMV
    
    // Calcular varianzas (diferencia porcentual)
    const monthlyServicesVariance = totalServices > 0 
      ? ((monthlyServicesForecast - totalServices) / totalServices * 100) 
      : 0;
    
    const monthlyGmvVariance = totalGMV > 0 
      ? ((monthlyGmvForecast - totalGMV) / totalGMV * 100) 
      : 0;
    
    // Para varianza anual, comparamos con una meta anual estimada
    const estimatedAnnualTarget = totalServices * 12;
    const estimatedGmvAnnualTarget = totalGMV * 12;
    
    const annualServicesVariance = estimatedAnnualTarget > 0 
      ? ((annualServicesForecast - estimatedAnnualTarget) / estimatedAnnualTarget * 100) 
      : 0;
    
    const annualGmvVariance = estimatedGmvAnnualTarget > 0 
      ? ((annualGmvForecast - estimatedGmvAnnualTarget) / estimatedGmvAnnualTarget * 100) 
      : 0;
    
    return {
      monthlyServicesForecast,
      monthlyGmvForecast,
      annualServicesForecast,
      annualGmvForecast,
      monthlyServicesActual: totalServices,
      monthlyGmvActual: totalGMV,
      annualServicesActual: totalServices * 12, // Estimación simple
      annualGmvActual: totalGMV * 12, // Estimación simple
      monthlyServicesVariance,
      monthlyGmvVariance,
      annualServicesVariance,
      annualGmvVariance
    };
  }, [totalServices, totalGMV, historicalData]);
};
