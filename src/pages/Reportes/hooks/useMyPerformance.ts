import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, startOfWeek, subDays, subMonths, format } from 'date-fns';

export type PeriodoReporte = 'semana' | 'mes' | 'trimestre';

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

export const useMyPerformance = (periodo: PeriodoReporte = 'mes') => {
  return useQuery({
    queryKey: ['my-performance', periodo],
    queryFn: async (): Promise<MyPerformanceMetrics | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Calculate date ranges based on period
      const ahora = new Date();
      let fechaInicio: Date;
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
        default: // mes
          fechaInicio = startOfMonth(ahora);
          fechaFinPeriodoAnterior = subDays(fechaInicio, 1);
          fechaInicioPeriodoAnterior = subMonths(fechaInicio, 1);
      }

      // Current period services (only for this user)
      const { data: serviciosActuales } = await supabase
        .from('servicios_planificados')
        .select('id, estado_servicio, created_at, custodio_asignado, armado_asignado_id')
        .eq('created_by', user.id)
        .gte('created_at', fechaInicio.toISOString());

      // Previous period services (for comparison)
      const { data: serviciosAnteriores } = await supabase
        .from('servicios_planificados')
        .select('id, estado_servicio')
        .eq('created_by', user.id)
        .gte('created_at', fechaInicioPeriodoAnterior.toISOString())
        .lt('created_at', fechaInicio.toISOString());

      const serviciosCreados = serviciosActuales?.length || 0;
      const serviciosPeriodoAnterior = serviciosAnteriores?.length || 0;
      
      // Calculate acceptance rate
      const aceptados = serviciosActuales?.filter(s => 
        ['aceptado', 'completado', 'en_sitio', 'confirmado'].includes(s.estado_servicio || '')
      ).length || 0;
      const tasaAceptacion = serviciosCreados > 0 ? (aceptados / serviciosCreados) * 100 : 0;

      // Previous period acceptance rate
      const aceptadosAnteriores = serviciosAnteriores?.filter(s => 
        ['aceptado', 'completado', 'en_sitio', 'confirmado'].includes(s.estado_servicio || '')
      ).length || 0;
      const tasaAceptacionAnterior = serviciosPeriodoAnterior > 0 
        ? (aceptadosAnteriores / serviciosPeriodoAnterior) * 100 : 0;

      // Status breakdown
      const desglosePorEstado = {
        completados: serviciosActuales?.filter(s => s.estado_servicio === 'completado').length || 0,
        pendientes: serviciosActuales?.filter(s => 
          ['pendiente', 'programado', 'en_sitio'].includes(s.estado_servicio || '')
        ).length || 0,
        cancelados: serviciosActuales?.filter(s => s.estado_servicio === 'cancelado').length || 0,
        rechazados: serviciosActuales?.filter(s => s.estado_servicio === 'rechazado').length || 0,
      };

      // Incidences (rejected + cancelled)
      const incidencias = desglosePorEstado.rechazados + desglosePorEstado.cancelados;
      const incidenciasAnterior = serviciosAnteriores?.filter(s => 
        ['rechazado', 'cancelado'].includes(s.estado_servicio || '')
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
