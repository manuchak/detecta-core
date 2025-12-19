import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HeroType } from '@/config/roleHomeConfig';

interface HeroData {
  count: number;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
}

const fetchHeroData = async (type: HeroType): Promise<HeroData> => {
  try {
    switch (type) {
      case 'pendingCandidates': {
        const { count, error } = await supabase
          .from('candidatos_custodios')
          .select('*', { count: 'exact', head: true })
          .in('estado_proceso', ['lead', 'entrevista', 'documentacion', 'en_liberacion']);
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'activeCustodians': {
        const { count, error } = await supabase
          .from('pc_custodios')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'activo');
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'unassignedServices': {
        const today = new Date().toISOString().split('T')[0];
        const { count, error } = await supabase
          .from('pc_servicios')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_programada', today)
          .is('custodio_asignado_id', null)
          .neq('estado', 'cancelado');
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'todayServices': {
        const today = new Date().toISOString().split('T')[0];
        const { count, error } = await supabase
          .from('pc_servicios')
          .select('*', { count: 'exact', head: true })
          .eq('fecha_programada', today)
          .neq('estado', 'cancelado');
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'weekServices': {
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        
        const { count, error } = await supabase
          .from('pc_servicios')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_programada', today.toISOString().split('T')[0])
          .lte('fecha_programada', weekEnd.toISOString().split('T')[0])
          .neq('estado', 'cancelado');
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'newLeads': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { count, error } = await supabase
          .from('candidatos_custodios')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString())
          .eq('estado_proceso', 'lead');
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'activeAlerts': {
        const { count, error } = await supabase
          .from('alertas_sistema_nacional')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente');
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'vehiclesOnline': {
        const { count, error } = await supabase
          .from('activos_monitoreo')
          .select('*', { count: 'exact', head: true })
          .eq('integrado_sistema', true);
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'monthlyGMV': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
          .from('pc_servicios')
          .select('valor_estimado')
          .gte('fecha_programada', startOfMonth.toISOString().split('T')[0])
          .eq('estado', 'completado');
        
        if (error) throw error;
        
        const total = data?.reduce((sum, s) => sum + (s.valor_estimado || 0), 0) || 0;
        return { count: Math.round(total) };
      }

      case 'openTickets': {
        const { count, error } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .in('status', ['abierto', 'en_progreso']);
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'pendingInstallations': {
        const today = new Date().toISOString().split('T')[0];
        const { count, error } = await supabase
          .from('programacion_instalaciones')
          .select('*', { count: 'exact', head: true })
          .eq('fecha_programada', today)
          .eq('estado', 'pendiente');
        
        if (error) throw error;
        return { count: count || 0 };
      }

      case 'completedInstallations': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        
        const { count, error } = await supabase
          .from('programacion_instalaciones')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_programada', startOfMonth.toISOString().split('T')[0])
          .eq('estado', 'completada');
        
        if (error) throw error;
        return { count: count || 0 };
      }

      default:
        return { count: 0 };
    }
  } catch (error) {
    console.error(`Error fetching hero data for type ${type}:`, error);
    return { count: 0 };
  }
};

export const useHeroData = (type?: HeroType) => {
  return useQuery({
    queryKey: ['home-hero', type],
    queryFn: () => fetchHeroData(type!),
    enabled: !!type,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
