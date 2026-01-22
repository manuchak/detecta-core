import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, startOfWeek, subDays, subMonths, format, differenceInDays } from 'date-fns';

export type PeriodoReporte = 'semana' | 'mes' | 'trimestre' | 'year' | 'custom';

export interface CustomDateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface MyPerformanceMetrics {
  serviciosCreados: number;
  serviciosPeriodoAnterior: number;
  tendenciaServicios: number;
  tasaAceptacion: number;
  tasaAceptacionAnterior: number;
  tendenciaAceptacion: number;
  tiempoPromedioAsignacion: number;
  incidencias: number;
  incidenciasAnterior: number;
  actividadPorDia: Array<{ fecha: string; cantidad: number }>;
  desglosePorEstado: {
    completados: number;
    pendientes: number;
    cancelados: number;
    rechazados: number;
  };
  custodiosDistintos: number;
  armadosDistintos: number;
}

export const useMyPerformance = (
  periodo: PeriodoReporte = 'mes',
  customRange?: CustomDateRange
) => {
  return useQuery({
    queryKey: ['my-performance', periodo, customRange?.startDate?.toISOString(), customRange?.endDate?.toISOString()],
    queryFn: async (): Promise<MyPerformanceMetrics | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Calculate date ranges based on period
      const ahora = new Date();
      let fechaInicio: Date;
      let fechaFin: Date = ahora;
      let fechaInicioPeriodoAnterior: Date;
      let fechaFinPeriodoAnterior: Date;
      
      switch (periodo) {
        case 'semana':
          fechaInicio = startOfWeek(ahora, { weekStartsOn: 1 });
          fechaFinPeriodoAnterior = subDays(fechaInicio, 1);
          fechaInicioPeriodoAnterior = subDays(fechaInicio, 7);
          break;
        case 'trimestre':
          fechaInicio = subMonths(ahora, 3);
          fechaFinPeriodoAnterior = subDays(fechaInicio, 1);
          fechaInicioPeriodoAnterior = subMonths(fechaInicio, 3);
          break;
        case 'year':
          fechaInicio = subMonths(ahora, 12);
          fechaFinPeriodoAnterior = subDays(fechaInicio, 1);
          fechaInicioPeriodoAnterior = subMonths(fechaInicio, 12);
          break;
        case 'custom':
          if (customRange?.startDate && customRange?.endDate) {
            fechaInicio = customRange.startDate;
            fechaFin = customRange.endDate;
            const duracionDias = differenceInDays(fechaFin, fechaInicio) + 1;
            fechaFinPeriodoAnterior = subDays(fechaInicio, 1);
            fechaInicioPeriodoAnterior = subDays(fechaInicio, duracionDias);
          } else {
            // Fallback to current month if no custom range provided
            fechaInicio = startOfMonth(ahora);
            fechaFinPeriodoAnterior = subDays(fechaInicio, 1);
            fechaInicioPeriodoAnterior = subMonths(fechaInicio, 1);
          }
          break;
        default: // mes
          fechaInicio = startOfMonth(ahora);
          fechaFinPeriodoAnterior = subDays(fechaInicio, 1);
          fechaInicioPeriodoAnterior = subMonths(fechaInicio, 1);
      }

      // Current period services (only for this user)
      // Using estado_planeacion (correct field name in servicios_planificados)
      let queryActual = supabase
        .from('servicios_planificados')
        .select('id, estado_planeacion, created_at, custodio_asignado, armado_asignado_id')
        .eq('created_by', user.id)
        .gte('created_at', fechaInicio.toISOString());
      
      // Apply end date filter for custom ranges
      if (periodo === 'custom' && customRange?.endDate) {
        queryActual = queryActual.lte('created_at', fechaFin.toISOString());
      }
      
      const { data: serviciosActuales } = await queryActual;

      // Previous period services (for comparison)
      const { data: serviciosAnteriores } = await supabase
        .from('servicios_planificados')
        .select('id, estado_planeacion')
        .eq('created_by', user.id)
        .gte('created_at', fechaInicioPeriodoAnterior.toISOString())
        .lt('created_at', fechaInicio.toISOString());

      const serviciosCreados = serviciosActuales?.length || 0;
      const serviciosPeriodoAnterior = serviciosAnteriores?.length || 0;
      
      // Calculate acceptance rate using correct field: estado_planeacion
      // "Accepted/Active" services = planificado + confirmado (have been assigned)
      const aceptados = serviciosActuales?.filter(s => 
        ['planificado', 'confirmado'].includes(s.estado_planeacion || '')
      ).length || 0;
      const tasaAceptacion = serviciosCreados > 0 ? (aceptados / serviciosCreados) * 100 : 0;

      // Previous period acceptance rate
      const aceptadosAnteriores = serviciosAnteriores?.filter(s => 
        ['planificado', 'confirmado'].includes(s.estado_planeacion || '')
      ).length || 0;
      const tasaAceptacionAnterior = serviciosPeriodoAnterior > 0 
        ? (aceptadosAnteriores / serviciosPeriodoAnterior) * 100 : 0;

      // Status breakdown using correct estado_planeacion values
      const desglosePorEstado = {
        completados: serviciosActuales?.filter(s => s.estado_planeacion === 'confirmado').length || 0,
        pendientes: serviciosActuales?.filter(s => 
          ['pendiente_asignacion', 'planificado'].includes(s.estado_planeacion || '')
        ).length || 0,
        cancelados: serviciosActuales?.filter(s => s.estado_planeacion === 'cancelado').length || 0,
        rechazados: 0, // This state doesn't exist in servicios_planificados
      };

      // Incidences (cancelled only - rechazado doesn't exist in this table)
      const incidencias = desglosePorEstado.cancelados;
      const incidenciasAnterior = serviciosAnteriores?.filter(s => 
        s.estado_planeacion === 'cancelado'
      ).length || 0;

      // Activity per day (last 7 days)
      const actividadPorDia = calcularActividadPorDia(serviciosActuales || []);

      // Distinct resources assigned
      const custodiosDistintos = new Set(
        serviciosActuales?.map(s => s.custodio_asignado).filter(Boolean)
      ).size;
      const armadosDistintos = new Set(
        serviciosActuales?.map(s => s.armado_asignado_id).filter(Boolean)
      ).size;

      return {
        serviciosCreados,
        serviciosPeriodoAnterior,
        tendenciaServicios: calcularTendencia(serviciosCreados, serviciosPeriodoAnterior),
        tasaAceptacion,
        tasaAceptacionAnterior,
        tendenciaAceptacion: tasaAceptacion - tasaAceptacionAnterior,
        tiempoPromedioAsignacion: 0, // Requires additional data
        incidencias,
        incidenciasAnterior,
        actividadPorDia,
        desglosePorEstado,
        custodiosDistintos,
        armadosDistintos,
      };
    },
    staleTime: 60000, // 1 minute
  });
};

function calcularTendencia(actual: number, anterior: number): number {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return ((actual - anterior) / anterior) * 100;
}

function calcularActividadPorDia(servicios: Array<{ created_at: string }>) {
  const porDia = new Map<string, number>();
  
  // Initialize last 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const fecha = format(subDays(new Date(), i), 'yyyy-MM-dd');
    porDia.set(fecha, 0);
  }
  
  // Count services per day
  servicios.forEach(s => {
    const fecha = s.created_at.split('T')[0];
    if (porDia.has(fecha)) {
      porDia.set(fecha, (porDia.get(fecha) || 0) + 1);
    }
  });
  
  return Array.from(porDia.entries()).map(([fecha, cantidad]) => ({ 
    fecha: format(new Date(fecha), 'dd/MM'),
    cantidad 
  }));
}
