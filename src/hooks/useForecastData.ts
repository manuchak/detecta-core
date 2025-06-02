
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
  lastDataMonth: string;
  forecastMonth: string;
}

export const useForecastData = (
  totalServices: number,
  totalGMV: number,
  historicalData?: Array<{ month: number; services: number; gmv: number }>
): ForecastData => {
  
  return useMemo(() => {
    console.log('useForecastData - Datos recibidos:', { totalServices, totalGMV, historicalData });
    
    // Obtener el mes actual y el último mes con datos reales
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // Generar datos históricos más realistas basados en los totales actuales
    // Asumiendo que los datos actuales son acumulados hasta mayo (mes 5)
    const monthsWithData = 5; // Enero a Mayo
    const avgServicesPerMonth = Math.floor(totalServices / monthsWithData);
    const avgGmvPerMonth = Math.floor(totalGMV / monthsWithData);
    
    console.log('useForecastData - Promedios calculados:', { avgServicesPerMonth, avgGmvPerMonth, monthsWithData });
    
    // Crear datos históricos más realistas con variación estacional
    const seasonalFactors = {
      1: 0.85, // Enero - menor actividad
      2: 0.90, // Febrero
      3: 1.05, // Marzo - incremento
      4: 1.10, // Abril - pico
      5: 1.05, // Mayo
      6: 0.95, // Junio - verano
      7: 0.85, // Julio - vacaciones
      8: 0.90, // Agosto
      9: 1.00, // Septiembre - regreso
      10: 1.10, // Octubre - pico otoño
      11: 1.15, // Noviembre - pre-fin de año
      12: 0.95  // Diciembre - fin de año
    };
    
    const defaultHistoricalData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const seasonalFactor = seasonalFactors[month as keyof typeof seasonalFactors];
      
      // Calcular servicios y GMV con factor estacional y variación aleatoria moderada
      const services = month <= monthsWithData 
        ? Math.floor(avgServicesPerMonth * seasonalFactor * (0.9 + Math.random() * 0.2))
        : 0; // Meses futuros sin datos
        
      const gmv = month <= monthsWithData 
        ? Math.floor(avgGmvPerMonth * seasonalFactor * (0.9 + Math.random() * 0.2))
        : 0; // Meses futuros sin datos
        
      return { month, services, gmv };
    });
    
    const dataToUse = historicalData || defaultHistoricalData;
    console.log('useForecastData - Datos históricos a usar:', dataToUse.slice(0, 6));
    
    // Filtrar solo datos reales (hasta mayo)
    const realData = dataToUse.filter(d => d.month <= monthsWithData && d.services > 0);
    console.log('useForecastData - Datos reales filtrados:', realData);
    
    // Función de suavizado exponencial mejorada
    const exponentialSmoothing = (data: number[], alpha: number = 0.3): number => {
      if (data.length === 0) return 0;
      if (data.length === 1) return data[0];
      
      let forecast = data[0];
      for (let i = 1; i < data.length; i++) {
        forecast = alpha * data[i] + (1 - alpha) * forecast;
      }
      return forecast;
    };
    
    // Calcular tendencia usando regresión lineal simple
    const calculateTrend = (data: number[]): number => {
      if (data.length < 2) return 0;
      
      const n = data.length;
      const x = Array.from({ length: n }, (_, i) => i + 1);
      const y = data;
      
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      return slope;
    };
    
    // Extraer datos históricos para análisis
    const servicesHistory = realData.map(d => d.services);
    const gmvHistory = realData.map(d => d.gmv);
    
    console.log('useForecastData - Historiales:', { servicesHistory, gmvHistory });
    
    // Calcular forecast del próximo mes usando suavizado exponencial + tendencia
    const servicesTrend = calculateTrend(servicesHistory);
    const gmvTrend = calculateTrend(gmvHistory);
    
    const servicesSmoothed = exponentialSmoothing(servicesHistory);
    const gmvSmoothed = exponentialSmoothing(gmvHistory);
    
    // Forecast del próximo mes (junio) con factor estacional
    const nextMonth = monthsWithData + 1;
    const nextMonthSeasonal = seasonalFactors[nextMonth as keyof typeof seasonalFactors];
    
    const monthlyServicesForecast = Math.round(
      (servicesSmoothed + servicesTrend) * nextMonthSeasonal
    );
    
    const monthlyGmvForecast = Math.round(
      (gmvSmoothed + gmvTrend) * nextMonthSeasonal
    );
    
    console.log('useForecastData - Forecast mensual:', { 
      monthlyServicesForecast, 
      monthlyGmvForecast,
      servicesTrend,
      gmvTrend,
      nextMonthSeasonal
    });
    
    // Forecast anual: sumar datos reales + forecast para meses restantes
    const totalRealServices = servicesHistory.reduce((sum, val) => sum + val, 0);
    const totalRealGmv = gmvHistory.reduce((sum, val) => sum + val, 0);
    
    // Calcular forecast para meses restantes (junio-diciembre)
    const remainingMonths = 12 - monthsWithData;
    let remainingServicesForecast = 0;
    let remainingGmvForecast = 0;
    
    for (let month = nextMonth; month <= 12; month++) {
      const seasonalFactor = seasonalFactors[month as keyof typeof seasonalFactors];
      remainingServicesForecast += Math.round((servicesSmoothed + servicesTrend) * seasonalFactor);
      remainingGmvForecast += Math.round((gmvSmoothed + gmvTrend) * seasonalFactor);
    }
    
    const annualServicesForecast = totalRealServices + remainingServicesForecast;
    const annualGmvForecast = totalRealGmv + remainingGmvForecast;
    
    console.log('useForecastData - Forecast anual:', {
      totalRealServices,
      totalRealGmv,
      remainingServicesForecast,
      remainingGmvForecast,
      annualServicesForecast,
      annualGmvForecast
    });
    
    // Calcular varianzas comparando con promedios históricos
    const avgHistoricalServices = servicesHistory.length > 0 
      ? servicesHistory.reduce((sum, val) => sum + val, 0) / servicesHistory.length 
      : 0;
    const avgHistoricalGmv = gmvHistory.length > 0 
      ? gmvHistory.reduce((sum, val) => sum + val, 0) / gmvHistory.length 
      : 0;
    
    const monthlyServicesVariance = avgHistoricalServices > 0 
      ? ((monthlyServicesForecast - avgHistoricalServices) / avgHistoricalServices * 100) 
      : 0;
    
    const monthlyGmvVariance = avgHistoricalGmv > 0 
      ? ((monthlyGmvForecast - avgHistoricalGmv) / avgHistoricalGmv * 100) 
      : 0;
    
    // Para varianza anual, comparar con proyección simple
    const simpleAnnualProjection = avgHistoricalServices * 12;
    const simpleGmvAnnualProjection = avgHistoricalGmv * 12;
    
    const annualServicesVariance = simpleAnnualProjection > 0 
      ? ((annualServicesForecast - simpleAnnualProjection) / simpleAnnualProjection * 100) 
      : 0;
    
    const annualGmvVariance = simpleGmvAnnualProjection > 0 
      ? ((annualGmvForecast - simpleGmvAnnualProjection) / simpleGmvAnnualProjection * 100) 
      : 0;
    
    // Nombres de meses en español
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const result = {
      monthlyServicesForecast,
      monthlyGmvForecast,
      annualServicesForecast,
      annualGmvForecast,
      monthlyServicesActual: totalRealServices, // Total hasta mayo
      monthlyGmvActual: totalRealGmv, // Total hasta mayo
      annualServicesActual: totalRealServices, // Solo datos reales
      annualGmvActual: totalRealGmv, // Solo datos reales
      monthlyServicesVariance,
      monthlyGmvVariance,
      annualServicesVariance,
      annualGmvVariance,
      lastDataMonth: monthNames[monthsWithData - 1], // mayo
      forecastMonth: monthNames[nextMonth - 1] // junio
    };
    
    console.log('useForecastData - Resultado final:', result);
    
    return result;
  }, [totalServices, totalGMV, historicalData]);
};
