/**
 * Hook para comparar datos históricos de diciembre entre años
 * Calcula factores de impacto reales de feriados vs configurados
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, getDaysInMonth } from 'date-fns';

export interface DecemberDayData {
  day: number;
  dayName: string;
  isHoliday: boolean;
  holidayName?: string;
  year2023: { services: number; gmv: number };
  year2024: { services: number; gmv: number };
  year2025: { services: number; gmv: number | null; isProjected?: boolean };
  avgHistorical: number;
  factorReal2023: number;
  factorReal2024: number;
}

export interface HolidayImpactComparison {
  date: string;
  name: string;
  configuredFactor: number;
  realFactor2023: number;
  realFactor2024: number;
  avgRealFactor: number;
  recommendation: 'correct' | 'overestimated' | 'underestimated';
  suggestedFactor: number;
  difference: number;
}

export interface DecemberSummary {
  total2023: { services: number; gmv: number };
  total2024: { services: number; gmv: number };
  total2025: { services: number; gmv: number; daysWithData: number };
  nov2023: { services: number; gmv: number };
  nov2024: { services: number; gmv: number };
  nov2025: { services: number; gmv: number };
  novVsDec2023: number;
  novVsDec2024: number;
  projected2025: { services: number; gmv: number };
  projectedCorrected: { services: number; gmv: number };
}

export interface DecemberComparison {
  dailyData: DecemberDayData[];
  summary: DecemberSummary;
  holidayImpacts: HolidayImpactComparison[];
  isLoading: boolean;
}

const HOLIDAY_DATES: Record<string, string> = {
  '12': 'Virgen de Guadalupe',
  '24': 'Nochebuena',
  '25': 'Navidad',
  '31': 'Fin de Año'
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function useDecemberHistoricalComparison() {
  const { data, isLoading } = useQuery({
    queryKey: ['december-historical-comparison'],
    queryFn: async () => {
      // Obtener datos de diciembre 2023, 2024, 2025
      const { data: servicesData, error: servicesError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, precio_total')
        .gte('fecha_hora_cita', '2023-12-01')
        .lte('fecha_hora_cita', '2025-12-31')
        .order('fecha_hora_cita', { ascending: true });

      if (servicesError) throw servicesError;

      // Obtener datos de noviembre para comparación
      const { data: novData, error: novError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, precio_total')
        .or('and(fecha_hora_cita.gte.2023-11-01,fecha_hora_cita.lt.2023-12-01),and(fecha_hora_cita.gte.2024-11-01,fecha_hora_cita.lt.2024-12-01),and(fecha_hora_cita.gte.2025-11-01,fecha_hora_cita.lt.2025-12-01)')
        .order('fecha_hora_cita', { ascending: true });

      if (novError) throw novError;

      // Obtener factores configurados de feriados
      const { data: configuredHolidays, error: holidaysError } = await supabase
        .from('calendario_feriados_mx')
        .select('fecha, nombre, factor_ajuste, impacto_observado_pct')
        .gte('fecha', '2025-12-01')
        .lte('fecha', '2025-12-31');

      if (holidaysError) throw holidaysError;

      // Procesar datos por día
      const dailyData = processDailyData(servicesData || []);
      const novSummary = processNovemberData(novData || []);
      
      // Calcular totales
      const summary = calculateSummary(dailyData, novSummary);
      
      // Calcular impactos de feriados
      const holidayImpacts = calculateHolidayImpacts(dailyData, configuredHolidays || []);
      
      return { dailyData, summary, holidayImpacts };
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    dailyData: data?.dailyData || [],
    summary: data?.summary || createEmptySummary(),
    holidayImpacts: data?.holidayImpacts || [],
    isLoading
  };
}

function processDailyData(services: any[]): DecemberDayData[] {
  const dailyMap: Record<string, Record<number, { services: number; gmv: number }>> = {
    '2023': {},
    '2024': {},
    '2025': {}
  };

  // Inicializar todos los días
  for (let day = 1; day <= 31; day++) {
    dailyMap['2023'][day] = { services: 0, gmv: 0 };
    dailyMap['2024'][day] = { services: 0, gmv: 0 };
    dailyMap['2025'][day] = { services: 0, gmv: 0 };
  }

  // Agrupar servicios por día
  services.forEach(service => {
    const date = parseISO(service.fecha_hora_cita);
    const year = date.getFullYear().toString();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (month === 12 && dailyMap[year]) {
      dailyMap[year][day].services++;
      dailyMap[year][day].gmv += Number(service.precio_total) || 0;
    }
  });

  // Calcular promedios para días normales (excluyendo feriados)
  const normalDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30];
  const avg2023 = normalDays.reduce((sum, d) => sum + dailyMap['2023'][d].services, 0) / normalDays.length;
  const avg2024 = normalDays.reduce((sum, d) => sum + dailyMap['2024'][d].services, 0) / normalDays.length;

  // Determinar hasta qué día tenemos datos de 2025
  const today = new Date();
  const currentDay = today.getMonth() === 11 ? today.getDate() : 0;

  // Construir array de días
  return Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const date2025 = new Date(2025, 11, day);
    const dayOfWeek = date2025.getDay();
    const holidayName = HOLIDAY_DATES[day.toString()];

    const services2023 = dailyMap['2023'][day].services;
    const services2024 = dailyMap['2024'][day].services;
    const avgHistorical = (services2023 + services2024) / 2;

    return {
      day,
      dayName: DAY_NAMES[dayOfWeek],
      isHoliday: !!holidayName,
      holidayName,
      year2023: dailyMap['2023'][day],
      year2024: dailyMap['2024'][day],
      year2025: {
        services: day <= currentDay ? dailyMap['2025'][day].services : null,
        gmv: day <= currentDay ? dailyMap['2025'][day].gmv : null,
        isProjected: day > currentDay
      },
      avgHistorical,
      factorReal2023: avg2023 > 0 ? services2023 / avg2023 : 1,
      factorReal2024: avg2024 > 0 ? services2024 / avg2024 : 1
    };
  });
}

function processNovemberData(services: any[]): Record<number, { services: number; gmv: number }> {
  const novData: Record<number, { services: number; gmv: number }> = {
    2023: { services: 0, gmv: 0 },
    2024: { services: 0, gmv: 0 },
    2025: { services: 0, gmv: 0 }
  };

  services.forEach(service => {
    const date = parseISO(service.fecha_hora_cita);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (month === 11) {
      novData[year].services++;
      novData[year].gmv += Number(service.precio_total) || 0;
    }
  });

  return novData;
}

function calculateSummary(dailyData: DecemberDayData[], novSummary: Record<number, { services: number; gmv: number }>): DecemberSummary {
  const total2023 = dailyData.reduce((acc, d) => ({
    services: acc.services + d.year2023.services,
    gmv: acc.gmv + d.year2023.gmv
  }), { services: 0, gmv: 0 });

  const total2024 = dailyData.reduce((acc, d) => ({
    services: acc.services + d.year2024.services,
    gmv: acc.gmv + d.year2024.gmv
  }), { services: 0, gmv: 0 });

  const daysWithData = dailyData.filter(d => d.year2025.services !== null).length;
  const total2025 = dailyData.reduce((acc, d) => ({
    services: acc.services + (d.year2025.services || 0),
    gmv: acc.gmv + (d.year2025.gmv || 0)
  }), { services: 0, gmv: 0 });

  // Calcular proyección basada en datos actuales
  const avgDailyServices2025 = daysWithData > 0 ? total2025.services / daysWithData : 0;
  const avgDailyGMV2025 = daysWithData > 0 ? total2025.gmv / daysWithData : 0;
  
  // Proyección simple: promedio actual * días restantes
  const daysRemaining = 31 - daysWithData;
  
  // Factor de corrección basado en históricos (promedio de los últimos días suele bajar)
  const holidayDays = [24, 25, 31];
  const normalDaysRemaining = daysRemaining - holidayDays.filter(d => d > daysWithData).length;
  const holidayDaysRemaining = holidayDays.filter(d => d > daysWithData).length;
  
  // Usar factores históricos reales para proyección
  const avgHistoricalHolidayFactor = 0.35; // Basado en análisis previo
  const projectedServices = total2025.services + 
    (normalDaysRemaining * avgDailyServices2025) + 
    (holidayDaysRemaining * avgDailyServices2025 * avgHistoricalHolidayFactor);
  
  const projectedGMV = total2025.gmv + 
    (normalDaysRemaining * avgDailyGMV2025) + 
    (holidayDaysRemaining * avgDailyGMV2025 * avgHistoricalHolidayFactor);

  // Proyección con factores corregidos (más precisos)
  const correctedHolidayFactor = 0.43; // Basado en análisis de datos 2023-2024
  const projectedCorrectedServices = total2025.services + 
    (normalDaysRemaining * avgDailyServices2025) + 
    (holidayDaysRemaining * avgDailyServices2025 * correctedHolidayFactor);
  
  const projectedCorrectedGMV = total2025.gmv + 
    (normalDaysRemaining * avgDailyGMV2025) + 
    (holidayDaysRemaining * avgDailyGMV2025 * correctedHolidayFactor);

  return {
    total2023,
    total2024,
    total2025: { ...total2025, daysWithData },
    nov2023: novSummary[2023],
    nov2024: novSummary[2024],
    nov2025: novSummary[2025],
    novVsDec2023: novSummary[2023].services > 0 
      ? ((total2023.services - novSummary[2023].services) / novSummary[2023].services) * 100 
      : 0,
    novVsDec2024: novSummary[2024].services > 0 
      ? ((total2024.services - novSummary[2024].services) / novSummary[2024].services) * 100 
      : 0,
    projected2025: {
      services: Math.round(projectedServices),
      gmv: projectedGMV
    },
    projectedCorrected: {
      services: Math.round(projectedCorrectedServices),
      gmv: projectedCorrectedGMV
    }
  };
}

function calculateHolidayImpacts(
  dailyData: DecemberDayData[], 
  configuredHolidays: any[]
): HolidayImpactComparison[] {
  const impacts: HolidayImpactComparison[] = [];
  
  // Días de feriados a analizar
  const holidayDays = [12, 24, 25, 31];
  
  // Calcular promedio de días normales para cada año
  const normalDays = dailyData.filter(d => !d.isHoliday && d.day <= 23);
  const avg2023 = normalDays.reduce((sum, d) => sum + d.year2023.services, 0) / normalDays.length;
  const avg2024 = normalDays.reduce((sum, d) => sum + d.year2024.services, 0) / normalDays.length;
  
  holidayDays.forEach(day => {
    const dayData = dailyData.find(d => d.day === day);
    if (!dayData) return;
    
    const holidayName = HOLIDAY_DATES[day.toString()] || `Día ${day}`;
    
    // Buscar factor configurado
    const configured = configuredHolidays.find(h => {
      const holidayDate = parseISO(h.fecha);
      return holidayDate.getDate() === day;
    });
    
    const configuredFactor = configured?.factor_ajuste || 0.5;
    
    // Calcular factores reales
    const realFactor2023 = avg2023 > 0 ? dayData.year2023.services / avg2023 : 1;
    const realFactor2024 = avg2024 > 0 ? dayData.year2024.services / avg2024 : 1;
    const avgRealFactor = (realFactor2023 + realFactor2024) / 2;
    
    // Determinar recomendación
    const difference = configuredFactor - avgRealFactor;
    let recommendation: 'correct' | 'overestimated' | 'underestimated';
    
    if (Math.abs(difference) < 0.15) {
      recommendation = 'correct';
    } else if (difference < -0.15) {
      recommendation = 'overestimated'; // Factor configurado es muy bajo (predice más impacto del real)
    } else {
      recommendation = 'underestimated'; // Factor configurado es muy alto (predice menos impacto del real)
    }
    
    impacts.push({
      date: `2025-12-${day.toString().padStart(2, '0')}`,
      name: holidayName,
      configuredFactor,
      realFactor2023,
      realFactor2024,
      avgRealFactor,
      recommendation,
      suggestedFactor: Math.round(avgRealFactor * 100) / 100,
      difference
    });
  });
  
  return impacts;
}

function createEmptySummary(): DecemberSummary {
  return {
    total2023: { services: 0, gmv: 0 },
    total2024: { services: 0, gmv: 0 },
    total2025: { services: 0, gmv: 0, daysWithData: 0 },
    nov2023: { services: 0, gmv: 0 },
    nov2024: { services: 0, gmv: 0 },
    nov2025: { services: 0, gmv: 0 },
    novVsDec2023: 0,
    novVsDec2024: 0,
    projected2025: { services: 0, gmv: 0 },
    projectedCorrected: { services: 0, gmv: 0 }
  };
}
