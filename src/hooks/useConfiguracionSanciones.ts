import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConfiguracionSancionesAuto {
  id: string;
  activo: boolean;
  // NO_SHOW settings
  no_show_habilitado: boolean;
  no_show_minutos_tolerancia: number;
  no_show_dias_suspension: number;
  // CANCELACION_ULTIMA_HORA settings
  cancelacion_habilitado: boolean;
  cancelacion_horas_limite: number;
  cancelacion_dias_suspension: number;
  // LLEGADA_TARDE settings
  llegada_tarde_habilitado: boolean;
  llegada_tarde_minutos_tolerancia: number;
  llegada_tarde_ocurrencias_limite: number;
  llegada_tarde_periodo_dias: number;
  llegada_tarde_dias_suspension: number;
  // Detection window
  ventana_deteccion_dias: number;
  // Audit
  modificado_por: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useConfiguracionSanciones() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['configuracion-sanciones-auto'],
    queryFn: async (): Promise<ConfiguracionSancionesAuto | null> => {
      const { data, error } = await supabase
        .from('configuracion_sanciones_auto')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching sanctions config:', error);
        throw error;
      }

      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<ConfiguracionSancionesAuto>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('configuracion_sanciones_auto')
        .update({
          ...updates,
          modificado_por: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', query.data?.id!)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion-sanciones-auto'] });
      toast({
        title: 'Configuración actualizada',
        description: 'Los cambios se han guardado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error updating sanctions config:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración.',
        variant: 'destructive',
      });
    },
  });

  return {
    config: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateConfig: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

// Hook for catalog of sanctions
export interface CatalogoSancion {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  dias_suspension_default: number;
  puntos_score_perdidos: number | null;
  afecta_score: boolean | null;
  requiere_evidencia: boolean | null;
  activo: boolean | null;
}

export function useCatalogoSanciones() {
  return useQuery({
    queryKey: ['catalogo-sanciones'],
    queryFn: async (): Promise<CatalogoSancion[]> => {
      const { data, error } = await supabase
        .from('catalogo_sanciones')
        .select('*')
        .order('dias_suspension_default', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

// Hook for sanctions statistics
export interface SancionesStats {
  total: number;
  activas: number;
  revocadas: number;
  cumplidas: number;
  porCategoria: Record<string, number>;
}

export function useSancionesStats() {
  return useQuery({
    queryKey: ['sanciones-stats'],
    queryFn: async (): Promise<SancionesStats> => {
      const { data, error } = await supabase
        .from('sanciones_aplicadas')
        .select('estado, catalogo_sanciones(categoria)');

      if (error) throw error;

      const stats: SancionesStats = {
        total: data?.length || 0,
        activas: 0,
        revocadas: 0,
        cumplidas: 0,
        porCategoria: {},
      };

      data?.forEach((s: any) => {
        if (s.estado === 'activa') stats.activas++;
        if (s.estado === 'revocada') stats.revocadas++;
        if (s.estado === 'cumplida') stats.cumplidas++;
        
        const cat = s.catalogo_sanciones?.categoria || 'sin_categoria';
        stats.porCategoria[cat] = (stats.porCategoria[cat] || 0) + 1;
      });

      return stats;
    },
  });
}
