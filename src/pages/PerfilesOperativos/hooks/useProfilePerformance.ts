import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetrics {
  // From servicios_planificados (assignments by UUID)
  totalAsignaciones: number;
  asignacionesCompletadas: number;
  asignacionesCanceladas: number;
  tasaAsignacion: number;
  
  // From servicios_custodia (execution by name)
  totalEjecuciones: number;
  ejecucionesCompletadas: number;
  kmTotales: number;
  ingresosTotales: number;
  
  // Calculated scores
  scoreGlobal: number;
  scorePuntualidad: number;
  scoreConfiabilidad: number;
}

export function useProfilePerformance(custodioId: string | undefined, nombre: string | undefined) {
  // Query for servicios_planificados (by custodio_id UUID)
  const planificacionQuery = useQuery({
    queryKey: ['profile-performance-planificacion', custodioId],
    queryFn: async () => {
      if (!custodioId) return null;
      
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, estado_planeacion, fecha_hora_cita, created_at')
        .eq('custodio_id', custodioId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!custodioId
  });

  // Query for servicios_custodia (by nombre - legacy)
  const ejecucionQuery = useQuery({
    queryKey: ['profile-performance-ejecucion', nombre],
    queryFn: async () => {
      if (!nombre) return null;
      
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('id, estado, costo_custodio, km_recorridos, km_teorico, fecha_hora_cita, created_at')
        .ilike('nombre_custodio', `%${nombre}%`);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!nombre
  });

  // Calculate metrics
  const planificacion = planificacionQuery.data || [];
  const ejecucion = ejecucionQuery.data || [];

  const totalAsignaciones = planificacion.length;
  const asignacionesCompletadas = planificacion.filter(s => s.estado_planeacion === 'confirmado').length;
  const asignacionesCanceladas = planificacion.filter(s => s.estado_planeacion === 'cancelado').length;
  const tasaAsignacion = totalAsignaciones > 0 
    ? Math.round((asignacionesCompletadas / totalAsignaciones) * 100) 
    : 0;

  const totalEjecuciones = ejecucion.length;
  const ejecucionesCompletadas = ejecucion.filter(s => 
    s.estado === 'completado' || s.estado === 'Completado'
  ).length;
  const kmTotales = ejecucion.reduce((sum, s) => sum + (s.km_recorridos || s.km_teorico || 0), 0);
  const ingresosTotales = ejecucion.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);

  // Calculate scores (0-100 scale)
  const scorePuntualidad = tasaAsignacion;
  const scoreConfiabilidad = totalAsignaciones > 0 
    ? Math.round(((totalAsignaciones - asignacionesCanceladas) / totalAsignaciones) * 100) 
    : 100;
  const scoreGlobal = Math.round((scorePuntualidad + scoreConfiabilidad) / 2);

  const metrics: PerformanceMetrics = {
    totalAsignaciones,
    asignacionesCompletadas,
    asignacionesCanceladas,
    tasaAsignacion,
    totalEjecuciones,
    ejecucionesCompletadas,
    kmTotales,
    ingresosTotales,
    scoreGlobal,
    scorePuntualidad,
    scoreConfiabilidad
  };

  return {
    metrics,
    isLoading: planificacionQuery.isLoading || ejecucionQuery.isLoading,
    isError: planificacionQuery.isError || ejecucionQuery.isError
  };
}
