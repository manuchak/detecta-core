/**
 * Hook minimalista para ajuste de forecast por feriados mexicanos
 * Consulta feriados en el período proyectado y calcula factor de ajuste
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export interface HolidayAdjustment {
  holidaysInPeriod: number;
  adjustmentFactor: number; // Factor ponderado para aplicar al forecast
  holidays: Array<{
    fecha: string;
    nombre: string;
    factor_ajuste: number;
    impacto_pct: number;
  }>;
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
        return {
          holidaysInPeriod: 0,
          adjustmentFactor: 1.0,
          holidays: [],
          totalImpactDays: 0,
          explanation: 'Sin datos de feriados disponibles'
        };
      }
      
      if (!holidays || holidays.length === 0) {
        return {
          holidaysInPeriod: 0,
          adjustmentFactor: 1.0,
          holidays: [],
          totalImpactDays: 0,
          explanation: 'Sin feriados en el período de proyección'
        };
      }
      
      // Calcular factor de ajuste ponderado
      // Lógica: impacto diluido por cantidad de días restantes
      // Ej: 1 feriado con 72% impacto en 20 días = (1 - 0.72) / 20 = 1.4% impacto total
      const totalDays = daysRemaining;
      
      // Sumar el impacto de todos los feriados
      // Cada feriado reduce los servicios según su factor
      let adjustedDays = 0;
      
      holidays.forEach(holiday => {
        // factor_ajuste es el % de operación ese día (0.28 = 28% operación = 72% reducción)
        const holidayFactor = Number(holiday.factor_ajuste) || 0.3;
        // Este día contribuye solo (factor) de un día normal
        adjustedDays += holidayFactor;
      });
      
      // Días normales que no son feriados
      const normalDays = totalDays - holidays.length;
      
      // Total de "días efectivos" = días normales + días feriados ajustados
      const effectiveDays = normalDays + adjustedDays;
      
      // Factor de ajuste = días efectivos / días totales
      const adjustmentFactor = totalDays > 0 ? effectiveDays / totalDays : 1.0;
      
      // Preparar holidays para retorno
      const formattedHolidays = holidays.map(h => ({
        fecha: h.fecha,
        nombre: h.nombre,
        factor_ajuste: Number(h.factor_ajuste) || 0.3,
        impacto_pct: Number(h.impacto_observado_pct) || 70
      }));
      
      // Explicación legible
      const avgImpact = formattedHolidays.reduce((sum, h) => sum + h.impacto_pct, 0) / formattedHolidays.length;
      const totalImpactPct = ((1 - adjustmentFactor) * 100).toFixed(1);
      
      const explanation = holidays.length === 1
        ? `${holidays[0].nombre} (${formattedHolidays[0].impacto_pct.toFixed(0)}% impacto) reduce proyección en ${totalImpactPct}%`
        : `${holidays.length} feriados (promedio ${avgImpact.toFixed(0)}% impacto) reducen proyección en ${totalImpactPct}%`;
      
      return {
        holidaysInPeriod: holidays.length,
        adjustmentFactor,
        holidays: formattedHolidays,
        totalImpactDays: holidays.length,
        explanation
      };
    },
    enabled: daysRemaining > 0,
    staleTime: 60 * 60 * 1000, // 1 hora - los feriados no cambian frecuentemente
  });
}
