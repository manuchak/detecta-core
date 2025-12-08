/**
 * Hook para ajuste de forecast por feriados mexicanos con efecto extendido
 * Consulta feriados en el período proyectado y calcula factor de ajuste
 * incluyendo días de impacto antes/después de feriados principales
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, subDays, isWithinInterval, parseISO } from 'date-fns';

// Configuración de impacto extendido para feriados principales
interface ExtendedImpactConfig {
  holidayPattern: string;   // Patrón para identificar el feriado
  daysBefore: number;       // Días antes con impacto reducido
  daysAfter: number;        // Días después con impacto reducido
  beforeFactor: number;     // Factor de operación días previos (ej: 0.70 = 30% menos)
  afterFactor: number;      // Factor de operación días posteriores
}

const EXTENDED_IMPACT_CONFIG: ExtendedImpactConfig[] = [
  { 
    holidayPattern: 'Navidad', 
    daysBefore: 2,      // 23-24 dic tienen impacto
    daysAfter: 1,       // 26 dic tiene impacto leve
    beforeFactor: 0.70, // 30% reducción días previos
    afterFactor: 0.90   // 10% reducción día después
  },
  { 
    holidayPattern: 'Año Nuevo', 
    daysBefore: 1,      // 31 dic (aunque ya es feriado, refuerza)
    daysAfter: 1,       // 2 enero
    beforeFactor: 0.50, 
    afterFactor: 0.85 
  },
  { 
    holidayPattern: 'Semana Santa',
    daysBefore: 1,
    daysAfter: 1,
    beforeFactor: 0.75,
    afterFactor: 0.80
  },
  {
    holidayPattern: 'Independencia',
    daysBefore: 1,
    daysAfter: 0,
    beforeFactor: 0.80,
    afterFactor: 1.0
  }
];

export interface ExtendedDay {
  fecha: string;
  relacionadoCon: string;
  factor_ajuste: number;
  tipo: 'before' | 'after';
}

export interface HolidayAdjustment {
  holidaysInPeriod: number;
  extendedImpactDays: number;
  adjustmentFactor: number;
  holidays: Array<{
    fecha: string;
    nombre: string;
    factor_ajuste: number;
    impacto_pct: number;
  }>;
  extendedDays: ExtendedDay[];
  totalImpactDays: number;
  explanation: string;
}

export function useHolidayAdjustment(daysRemaining: number) {
  return useQuery({
    queryKey: ['holiday-adjustment', daysRemaining],
    queryFn: async (): Promise<HolidayAdjustment> => {
      const today = new Date();
      const endDate = addDays(today, daysRemaining);
      
      const { data: holidays, error } = await supabase
        .from('calendario_feriados_mx')
        .select('fecha, nombre, factor_ajuste, impacto_observado_pct')
        .eq('activo', true)
        .gte('fecha', format(today, 'yyyy-MM-dd'))
        .lte('fecha', format(endDate, 'yyyy-MM-dd'))
        .order('fecha', { ascending: true });
      
      if (error) {
        console.error('Error fetching holidays:', error);
        return createEmptyResult('Sin datos de feriados disponibles');
      }
      
      if (!holidays || holidays.length === 0) {
        return createEmptyResult('Sin feriados en el período de proyección');
      }
      
      // Preparar holidays formateados
      const formattedHolidays = holidays.map(h => ({
        fecha: h.fecha,
        nombre: h.nombre,
        factor_ajuste: Number(h.factor_ajuste) || 0.3,
        impacto_pct: Number(h.impacto_observado_pct) || 70
      }));
      
      // Calcular días de impacto extendido
      const extendedDays: ExtendedDay[] = [];
      const holidayDates = new Set(holidays.map(h => h.fecha));
      
      for (const holiday of holidays) {
        const config = EXTENDED_IMPACT_CONFIG.find(c => 
          holiday.nombre.toLowerCase().includes(c.holidayPattern.toLowerCase())
        );
        
        if (!config) continue;
        
        const holidayDate = parseISO(holiday.fecha);
        
        // Días antes
        for (let i = 1; i <= config.daysBefore; i++) {
          const extendedDate = subDays(holidayDate, i);
          const dateStr = format(extendedDate, 'yyyy-MM-dd');
          
          // Solo agregar si:
          // 1. Está en el rango de proyección
          // 2. No es ya un feriado registrado
          // 3. No está ya en la lista de días extendidos
          if (
            isWithinInterval(extendedDate, { start: today, end: endDate }) &&
            !holidayDates.has(dateStr) &&
            !extendedDays.some(d => d.fecha === dateStr)
          ) {
            extendedDays.push({
              fecha: dateStr,
              relacionadoCon: holiday.nombre,
              factor_ajuste: config.beforeFactor,
              tipo: 'before'
            });
          }
        }
        
        // Días después
        for (let i = 1; i <= config.daysAfter; i++) {
          const extendedDate = addDays(holidayDate, i);
          const dateStr = format(extendedDate, 'yyyy-MM-dd');
          
          if (
            isWithinInterval(extendedDate, { start: today, end: endDate }) &&
            !holidayDates.has(dateStr) &&
            !extendedDays.some(d => d.fecha === dateStr)
          ) {
            extendedDays.push({
              fecha: dateStr,
              relacionadoCon: holiday.nombre,
              factor_ajuste: config.afterFactor,
              tipo: 'after'
            });
          }
        }
      }
      
      // Calcular factor de ajuste ponderado
      const totalDays = daysRemaining;
      
      // Sumar el impacto de feriados oficiales
      let adjustedDays = 0;
      formattedHolidays.forEach(holiday => {
        adjustedDays += holiday.factor_ajuste;
      });
      
      // Sumar el impacto de días extendidos
      let extendedAdjustedDays = 0;
      extendedDays.forEach(day => {
        extendedAdjustedDays += day.factor_ajuste;
      });
      
      // Días normales (sin feriados ni días extendidos)
      const normalDays = totalDays - formattedHolidays.length - extendedDays.length;
      
      // Total de "días efectivos"
      const effectiveDays = normalDays + adjustedDays + extendedAdjustedDays;
      
      // Factor de ajuste = días efectivos / días totales
      const adjustmentFactor = totalDays > 0 ? effectiveDays / totalDays : 1.0;
      
      // Calcular impacto total en porcentaje
      const totalImpactPct = ((1 - adjustmentFactor) * 100).toFixed(1);
      
      // Generar explicación legible
      const explanation = generateExplanation(
        formattedHolidays,
        extendedDays,
        totalImpactPct
      );
      
      return {
        holidaysInPeriod: formattedHolidays.length,
        extendedImpactDays: extendedDays.length,
        adjustmentFactor,
        holidays: formattedHolidays,
        extendedDays,
        totalImpactDays: formattedHolidays.length + extendedDays.length,
        explanation
      };
    },
    enabled: daysRemaining > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos para ver cambios rápidamente
  });
}

function createEmptyResult(explanation: string): HolidayAdjustment {
  return {
    holidaysInPeriod: 0,
    extendedImpactDays: 0,
    adjustmentFactor: 1.0,
    holidays: [],
    extendedDays: [],
    totalImpactDays: 0,
    explanation
  };
}

function generateExplanation(
  holidays: HolidayAdjustment['holidays'],
  extendedDays: ExtendedDay[],
  totalImpactPct: string
): string {
  if (holidays.length === 0) {
    return 'Sin feriados en el período';
  }
  
  const holidayNames = holidays.map(h => h.nombre).join(', ');
  
  if (extendedDays.length === 0) {
    return `${holidays.length} feriado${holidays.length > 1 ? 's' : ''} (${holidayNames}) reduce${holidays.length === 1 ? '' : 'n'} proyección en ${totalImpactPct}%`;
  }
  
  const beforeDays = extendedDays.filter(d => d.tipo === 'before').length;
  const afterDays = extendedDays.filter(d => d.tipo === 'after').length;
  
  let extendedDesc = '';
  if (beforeDays > 0 && afterDays > 0) {
    extendedDesc = ` + ${beforeDays} día${beforeDays > 1 ? 's' : ''} previo${beforeDays > 1 ? 's' : ''} y ${afterDays} posterior${afterDays > 1 ? 'es' : ''}`;
  } else if (beforeDays > 0) {
    extendedDesc = ` + ${beforeDays} día${beforeDays > 1 ? 's' : ''} previo${beforeDays > 1 ? 's' : ''}`;
  } else if (afterDays > 0) {
    extendedDesc = ` + ${afterDays} día${afterDays > 1 ? 's' : ''} posterior${afterDays > 1 ? 'es' : ''}`;
  }
  
  return `${holidays.length} feriado${holidays.length > 1 ? 's' : ''}${extendedDesc} reducen proyección en ${totalImpactPct}%`;
}
