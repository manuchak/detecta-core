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

// EXTENDED_IMPACT_CONFIG ya no se usa - los días puente ahora están en calendario_feriados_mx
// La migración agregó todos los días del período 24-dic al 2-ene con factores específicos
// Esto permite mayor precisión y configuración desde la base de datos
const EXTENDED_IMPACT_CONFIG: ExtendedImpactConfig[] = [
  // Configuración legacy para feriados que no estén explícitos en la BD
  { 
    holidayPattern: 'Semana Santa',
    daysBefore: 2,
    daysAfter: 2,
    beforeFactor: 0.75,
    afterFactor: 0.80
  },
  {
    holidayPattern: 'Independencia',
    daysBefore: 1,
    daysAfter: 0,
    beforeFactor: 0.80,
    afterFactor: 1.0
  },
  {
    holidayPattern: 'Revolución',
    daysBefore: 1,
    daysAfter: 0,
    beforeFactor: 0.85,
    afterFactor: 1.0
  }
];

// Factores de día de semana validados con datos 2024 (10,714 servicios)
// Basado en query: SELECT EXTRACT(DOW FROM fecha_hora_cita), COUNT(*), AVG(servicios_por_día)
const WEEKDAY_FACTORS: Record<number, number> = {
  0: 0.41,  // Domingo - -59% vs promedio
  1: 0.99,  // Lunes - ~promedio
  2: 1.25,  // Martes - +25%
  3: 1.13,  // Miércoles - +13%
  4: 1.29,  // Jueves - +29% (día más fuerte)
  5: 1.21,  // Viernes - +21%
  6: 0.71,  // Sábado - -29%
};

const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export interface ExtendedDay {
  fecha: string;
  relacionadoCon: string;
  factor_ajuste: number;
  tipo: 'before' | 'after';
}

// Interfaz para proyección día por día con patrón semanal
export interface DayProjection {
  fecha: string;
  dayOfMonth: number;
  dayOfWeek: number;           // 0-6 (Domingo-Sábado)
  weekdayName: string;         // "Lun", "Mar", etc.
  weekdayFactor: number;       // 0.41-1.29 según día
  isHoliday: boolean;
  isExtendedImpact: boolean;
  holidayName?: string;
  operationFactor: number;     // Factor por feriado (1.0 si no aplica)
  combinedFactor: number;      // weekdayFactor × operationFactor
  expectedServices: number;    // ritmo_diario × combinedFactor
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
  // NUEVO: Proyección día por día
  dayByDayProjection: DayProjection[];
  projectedServicesRemaining: number;
  normalDaysRemaining: number;
}

export function useHolidayAdjustment(daysRemaining: number, currentDailyPace: number = 0) {
  return useQuery({
    queryKey: ['holiday-adjustment', daysRemaining, currentDailyPace],
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
      
      // ========== NUEVO: PROYECCIÓN DÍA POR DÍA ==========
      const dayByDayProjection: DayProjection[] = [];
      const holidayMap = new Map(formattedHolidays.map(h => [h.fecha, h]));
      const extendedMap = new Map(extendedDays.map(d => [d.fecha, d]));
      
      // Usar ritmo diario proporcionado o un valor por defecto razonable
      const dailyPace = currentDailyPace > 0 ? currentDailyPace : 33.6; // fallback basado en histórico
      
      for (let i = 1; i <= daysRemaining; i++) {
        const projectedDate = addDays(today, i);
        const dateStr = format(projectedDate, 'yyyy-MM-dd');
        const dayOfMonth = projectedDate.getDate();
        const dayOfWeek = projectedDate.getDay(); // 0-6
        
        const holiday = holidayMap.get(dateStr);
        const extendedDay = extendedMap.get(dateStr);
        
        // Factor de día de semana (patrón histórico 2024)
        const weekdayFactor = WEEKDAY_FACTORS[dayOfWeek];
        const weekdayName = WEEKDAY_NAMES[dayOfWeek];
        
        let operationFactor = 1.0;
        let isHoliday = false;
        let isExtendedImpact = false;
        let holidayName: string | undefined;
        
        if (holiday) {
          operationFactor = holiday.factor_ajuste;
          isHoliday = true;
          holidayName = holiday.nombre;
        } else if (extendedDay) {
          operationFactor = extendedDay.factor_ajuste;
          isExtendedImpact = true;
          holidayName = `${extendedDay.tipo === 'before' ? 'Pre' : 'Post'}-${extendedDay.relacionadoCon}`;
        }
        
        // Factor combinado: patrón semanal × impacto feriado
        const combinedFactor = weekdayFactor * operationFactor;
        const expectedServices = dailyPace * combinedFactor;
        
        dayByDayProjection.push({
          fecha: dateStr,
          dayOfMonth,
          dayOfWeek,
          weekdayName,
          weekdayFactor,
          isHoliday,
          isExtendedImpact,
          holidayName,
          operationFactor,
          combinedFactor,
          expectedServices
        });
      }
      
      // Sumar servicios proyectados
      const projectedServicesRemaining = dayByDayProjection.reduce(
        (sum, day) => sum + day.expectedServices, 
        0
      );
      
      // Log para debugging
      console.log('📅 Day-by-Day Projection:', {
        daysRemaining,
        dailyPace,
        normalDays,
        holidayDays: formattedHolidays.length,
        extendedDays: extendedDays.length,
        projectedServicesRemaining: Math.round(projectedServicesRemaining),
        impactedDays: dayByDayProjection.filter(d => d.operationFactor < 1).map(d => ({
          fecha: d.fecha,
          factor: d.operationFactor,
          services: Math.round(d.expectedServices)
        }))
      });
      
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
        explanation,
        // NUEVO
        dayByDayProjection,
        projectedServicesRemaining: Math.round(projectedServicesRemaining),
        normalDaysRemaining: normalDays
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
    explanation,
    dayByDayProjection: [],
    projectedServicesRemaining: 0,
    normalDaysRemaining: 0
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
