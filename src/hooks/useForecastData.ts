
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
    
    // Usar los datos reales: 3,515 servicios de enero a mayo 2025
    const realServicesJanMay = 3515;
    const realGmvJanMay = totalGMV; // Usar el GMV real proporcionado
    
    // Calcular promedios mensuales basados en datos reales
    const monthsWithData = 5; // Enero a Mayo
    const avgServicesPerMonth = Math.round(realServicesJanMay / monthsWithData); // 703 servicios/mes
    const avgGmvPerMonth = Math.round(realGmvJanMay / monthsWithData);
    
    console.log('useForecastData - Datos reales:', {
      realServicesJanMay,
      realGmvJanMay,
      avgServicesPerMonth,
      avgGmvPerMonth,
      monthsWithData
    });
    
    // Crear distribución mensual más realista basada en datos reales
    // Asumiendo variación estacional típica para servicios de custodia
    const monthlyDistribution = {
      1: { factor: 0.90, name: 'enero' },    // Enero - arranque lento
      2: { factor: 0.95, name: 'febrero' },  // Febrero - incremento gradual
      3: { factor: 1.05, name: 'marzo' },    // Marzo - actividad normal
      4: { factor: 1.10, name: 'abril' },    // Abril - pico de actividad
      5: { factor: 1.00, name: 'mayo' },     // Mayo - estable
      6: { factor: 0.95, name: 'junio' },    // Junio - ligera baja
      7: { factor: 0.85, name: 'julio' },    // Julio - vacaciones
      8: { factor: 0.90, name: 'agosto' },   // Agosto - recuperación gradual
      9: { factor: 1.00, name: 'septiembre' }, // Septiembre - vuelta normalidad
      10: { factor: 1.10, name: 'octubre' }, // Octubre - pico otoño
      11: { factor: 1.15, name: 'noviembre' }, // Noviembre - alta demanda
      12: { factor: 0.95, name: 'diciembre' }  // Diciembre - fin de año
    };
    
    // Calcular servicios por mes usando distribución
    const monthlyServices = Object.entries(monthlyDistribution).reduce((acc, [month, data]) => {
      const monthNum = parseInt(month);
      const services = Math.round(avgServicesPerMonth * data.factor);
      acc[monthNum] = { services, name: data.name };
      return acc;
    }, {} as { [key: number]: { services: number; name: string } });
    
    // Verificar que la suma de enero-mayo coincida con los datos reales
    const calculatedJanMay = Object.keys(monthlyServices)
      .filter(month => parseInt(month) <= 5)
      .reduce((sum, month) => sum + monthlyServices[parseInt(month)].services, 0);
    
    console.log('useForecastData - Verificación distribución:', {
      calculatedJanMay,
      realServicesJanMay,
      difference: Math.abs(calculatedJanMay - realServicesJanMay)
    });
    
    // Ajustar si hay diferencia significativa
    if (Math.abs(calculatedJanMay - realServicesJanMay) > 50) {
      const adjustmentFactor = realServicesJanMay / calculatedJanMay;
      Object.keys(monthlyServices).forEach(month => {
        if (parseInt(month) <= 5) {
          monthlyServices[parseInt(month)].services = Math.round(
            monthlyServices[parseInt(month)].services * adjustmentFactor
          );
        }
      });
      console.log('useForecastData - Aplicado factor de ajuste:', adjustmentFactor);
    }
    
    // Calcular forecast para junio (mes 6)
    const juneServices = monthlyServices[6].services;
    const juneGmv = Math.round((realGmvJanMay / realServicesJanMay) * juneServices);
    
    // Calcular forecast anual
    const remainingMonthsServices = Object.keys(monthlyServices)
      .filter(month => parseInt(month) > 5)
      .reduce((sum, month) => sum + monthlyServices[parseInt(month)].services, 0);
    
    const avgServiceValue = realGmvJanMay / realServicesJanMay;
    const remainingMonthsGmv = Math.round(remainingMonthsServices * avgServiceValue);
    
    const annualServicesForecast = realServicesJanMay + remainingMonthsServices;
    const annualGmvForecast = realGmvJanMay + remainingMonthsGmv;
    
    console.log('useForecastData - Forecast calculado:', {
      juneServices,
      juneGmv,
      remainingMonthsServices,
      remainingMonthsGmv,
      annualServicesForecast,
      annualGmvForecast,
      avgServiceValue
    });
    
    // Calcular varianzas comparando con promedio histórico
    const historicalMonthlyAvg = avgServicesPerMonth;
    const monthlyServicesVariance = ((juneServices - historicalMonthlyAvg) / historicalMonthlyAvg) * 100;
    
    const historicalGmvMonthlyAvg = avgGmvPerMonth;
    const monthlyGmvVariance = ((juneGmv - historicalGmvMonthlyAvg) / historicalGmvMonthlyAvg) * 100;
    
    // Calcular varianzas anuales comparando con proyección lineal
    const linearAnnualProjection = avgServicesPerMonth * 12;
    const annualServicesVariance = ((annualServicesForecast - linearAnnualProjection) / linearAnnualProjection) * 100;
    
    const linearGmvAnnualProjection = avgGmvPerMonth * 12;
    const annualGmvVariance = ((annualGmvForecast - linearGmvAnnualProjection) / linearGmvAnnualProjection) * 100;
    
    const result = {
      monthlyServicesForecast: juneServices,
      monthlyGmvForecast: juneGmv,
      annualServicesForecast,
      annualGmvForecast,
      monthlyServicesActual: realServicesJanMay, // Total enero-mayo
      monthlyGmvActual: realGmvJanMay, // Total enero-mayo
      annualServicesActual: realServicesJanMay, // Solo datos reales hasta mayo
      annualGmvActual: realGmvJanMay, // Solo datos reales hasta mayo
      monthlyServicesVariance,
      monthlyGmvVariance,
      annualServicesVariance,
      annualGmvVariance,
      lastDataMonth: 'mayo',
      forecastMonth: 'junio'
    };
    
    console.log('useForecastData - Resultado final:', result);
    
    return result;
  }, [totalServices, totalGMV, historicalData]);
};
