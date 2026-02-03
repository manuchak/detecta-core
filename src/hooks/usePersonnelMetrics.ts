import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface PersonnelMetrics {
  // Custodios
  custodiosActivos: number;          // estado='activo'
  custodiosDisponibles: number;      // activo + disponibilidad='disponible'
  custodiosNoDisponibles: number;    // activo pero con indisponibilidad temporal
  custodiosConActividad30d: number;  // con servicios en últimos 30 días
  
  // Armados
  armadosInternos: number;           // tipo_armado='interno' y estado='activo'
  armadosExternos: number;           // tipo_armado='externo' y estado='activo'
  armadosActivos: number;            // estado='activo'
}

/**
 * Hook centralizado para métricas de personal operativo.
 * Fuente única de verdad para Dashboard y Perfiles Operativos.
 */
export function usePersonnelMetrics() {
  return useQuery({
    queryKey: ['personnel-metrics'],
    queryFn: async (): Promise<PersonnelMetrics> => {
      // Query 1: Custodios activos totales
      const { count: custodiosActivos, error: e1 } = await supabase
        .from('custodios_operativos')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo');
      
      if (e1) throw e1;

      // Query 2: Custodios disponibles (activo + disponibilidad='disponible')
      const { count: custodiosDisponibles, error: e2 } = await supabase
        .from('custodios_operativos')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo')
        .eq('disponibilidad', 'disponible');
      
      if (e2) throw e2;

      // Query 3: Custodios con actividad en 30 días
      const hace30Dias = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data: serviciosRecientes, error: e3 } = await supabase
        .from('servicios_planificados')
        .select('custodio_asignado')
        .gte('fecha_hora_cita', `${hace30Dias}T00:00:00`)
        .not('custodio_asignado', 'is', null)
        .not('custodio_asignado', 'eq', '');
      
      if (e3) throw e3;
      
      const custodiosUnicos30d = new Set(
        (serviciosRecientes || [])
          .map(s => s.custodio_asignado?.trim().toLowerCase())
          .filter(Boolean)
      );

      // Query 4: Armados internos activos
      const { count: armadosInternos, error: e4 } = await supabase
        .from('armados_operativos')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo')
        .eq('tipo_armado', 'interno');
      
      if (e4) throw e4;

      // Query 5: Armados externos activos
      const { count: armadosExternos, error: e5 } = await supabase
        .from('armados_operativos')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo')
        .eq('tipo_armado', 'externo');
      
      if (e5) throw e5;

      // Query 6: Total armados activos
      const { count: armadosActivos, error: e6 } = await supabase
        .from('armados_operativos')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo');
      
      if (e6) throw e6;

      const activos = custodiosActivos || 0;
      const disponibles = custodiosDisponibles || 0;

      return {
        custodiosActivos: activos,
        custodiosDisponibles: disponibles,
        custodiosNoDisponibles: activos - disponibles,
        custodiosConActividad30d: custodiosUnicos30d.size,
        armadosInternos: armadosInternos || 0,
        armadosExternos: armadosExternos || 0,
        armadosActivos: armadosActivos || 0,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos cache
  });
}
