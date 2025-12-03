import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServicioPlanificado {
  id: string;
  folio: string | null;
  cliente_nombre: string | null;
  destino_texto: string | null;
  fecha_hora_cita: string | null;
  hora_ventana_inicio: string | null;
  hora_ventana_fin: string | null;
  estado_planeacion: string | null;
  custodio_asignado: string | null;
  requiere_armado: boolean | null;
  armado: string | null;
  zona_destino: string | null;
  created_at: string;
}

export const useServiciosHoy = () => {
  return useQuery({
    queryKey: ['servicios-hoy'],
    queryFn: async (): Promise<ServicioPlanificado[]> => {
      const hoy = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('*')
        .gte('fecha_hora_cita', `${hoy}T00:00:00`)
        .lt('fecha_hora_cita', `${hoy}T23:59:59`)
        .order('fecha_hora_cita');
      
      if (error) throw error;
      return (data || []) as ServicioPlanificado[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

export const useCustodiosDisponibles = () => {
  return useQuery({
    queryKey: ['custodios-disponibles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custodios_operativos')
        .select('id, nombre, zona_base, disponibilidad, estado')
        .eq('disponibilidad', 'disponible')
        .eq('estado', 'activo');
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useZonasOperativas = () => {
  return useQuery({
    queryKey: ['zonas-operativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custodios_operativos')
        .select('zona_base, disponibilidad, estado')
        .eq('estado', 'activo');
      
      if (error) throw error;
      
      // Group by zona_base
      const zonaMap = new Map<string, { total: number; disponibles: number }>();
      
      (data || []).forEach(c => {
        const zona = c.zona_base || 'Sin zona';
        if (!zonaMap.has(zona)) {
          zonaMap.set(zona, { total: 0, disponibles: 0 });
        }
        const entry = zonaMap.get(zona)!;
        entry.total++;
        if (c.disponibilidad === 'disponible') {
          entry.disponibles++;
        }
      });
      
      return Array.from(zonaMap.entries()).map(([zona, stats]) => ({
        zona,
        total: stats.total,
        disponibles: stats.disponibles,
        porcentaje: stats.total > 0 ? Math.round((stats.disponibles / stats.total) * 100) : 0
      }));
    },
  });
};
