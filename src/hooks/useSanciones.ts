/**
 * Hooks for managing sanctions (sanciones)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays } from 'date-fns';

// Types
export interface CatalogoSancion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: 'leve' | 'moderada' | 'grave' | 'muy_grave';
  dias_suspension_default: number;
  afecta_score: boolean;
  puntos_score_perdidos: number;
  requiere_evidencia: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SancionAplicada {
  id: string;
  operativo_id: string;
  operativo_tipo: 'custodio' | 'armado';
  sancion_id: string;
  servicio_relacionado_id: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  dias_suspension: number;
  puntos_perdidos: number;
  estado: 'activa' | 'cumplida' | 'apelada' | 'revocada';
  evidencia_urls: string[] | null;
  notas: string | null;
  aplicada_por: string;
  revisada_por: string | null;
  fecha_revision: string | null;
  created_at: string;
  // Joined fields
  sancion?: CatalogoSancion;
  operativo_nombre?: string;
}

interface AplicarSancionParams {
  operativoId: string;
  operativoTipo: 'custodio' | 'armado';
  sancionId: string;
  diasSuspension: number;
  puntosPerdidos: number;
  servicioRelacionadoId?: string;
  evidenciaUrls?: string[];
  notas?: string;
}

/**
 * Hook to fetch sanction catalog
 */
export function useCatalogoSanciones() {
  return useQuery({
    queryKey: ['catalogo-sanciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_sanciones')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true });

      if (error) {
        console.error('Error fetching catalogo sanciones:', error);
        throw error;
      }

      return data as CatalogoSancion[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - catalog doesn't change often
  });
}

/**
 * Hook to fetch applied sanctions with optional filters
 */
export function useSancionesAplicadas(filters?: {
  operativoId?: string;
  operativoTipo?: 'custodio' | 'armado';
  estado?: 'activa' | 'cumplida' | 'apelada' | 'revocada';
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: ['sanciones-aplicadas', filters],
    queryFn: async () => {
      let query = supabase
        .from('sanciones_aplicadas')
        .select(`
          *,
          sancion:catalogo_sanciones(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.operativoId) {
        query = query.eq('operativo_id', filters.operativoId);
      }
      if (filters?.operativoTipo) {
        query = query.eq('operativo_tipo', filters.operativoTipo);
      }
      if (filters?.estado) {
        query = query.eq('estado', filters.estado);
      }
      if (filters?.fromDate) {
        query = query.gte('fecha_inicio', filters.fromDate);
      }
      if (filters?.toDate) {
        query = query.lte('fecha_inicio', filters.toDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching sanciones aplicadas:', error);
        throw error;
      }

      return data as SancionAplicada[];
    },
  });
}

/**
 * Hook to apply a new sanction
 */
export function useAplicarSancion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AplicarSancionParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      const fechaInicio = new Date().toISOString().split('T')[0];
      const fechaFin = addDays(new Date(), params.diasSuspension).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sanciones_aplicadas')
        .insert({
          operativo_id: params.operativoId,
          operativo_tipo: params.operativoTipo,
          sancion_id: params.sancionId,
          servicio_relacionado_id: params.servicioRelacionadoId || null,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          dias_suspension: params.diasSuspension,
          puntos_perdidos: params.puntosPerdidos,
          estado: 'activa',
          evidencia_urls: params.evidenciaUrls || null,
          notas: params.notas || null,
          aplicada_por: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // If suspension days > 0, also change operative status to suspended
      if (params.diasSuspension > 0) {
        const tableName = params.operativoTipo === 'custodio' 
          ? 'custodios_operativos' 
          : 'armados_operativos';

        await supabase
          .from(tableName)
          .update({
            estado: 'suspendido',
            fecha_inactivacion: fechaInicio,
            motivo_inactivacion: 'sancion_disciplinaria',
            tipo_inactivacion: 'temporal',
            fecha_reactivacion_programada: fechaFin,
          })
          .eq('id', params.operativoId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sanciones-aplicadas'] });
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['armados'] });
      toast.success('Sanción aplicada correctamente');
    },
    onError: (error) => {
      console.error('Error applying sanction:', error);
      toast.error('Error al aplicar la sanción');
    },
  });
}

/**
 * Hook to update sanction status (e.g., appeal, revoke)
 */
export function useActualizarSancion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      sancionId, 
      nuevoEstado,
      notas,
    }: { 
      sancionId: string; 
      nuevoEstado: 'activa' | 'cumplida' | 'apelada' | 'revocada';
      notas?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('sanciones_aplicadas')
        .update({
          estado: nuevoEstado,
          revisada_por: user?.id,
          fecha_revision: new Date().toISOString(),
          notas: notas,
        })
        .eq('id', sancionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sanciones-aplicadas'] });
      toast.success('Sanción actualizada');
    },
    onError: (error) => {
      console.error('Error updating sanction:', error);
      toast.error('Error al actualizar la sanción');
    },
  });
}

/**
 * Hook to check if operative has active sanctions
 */
export function useTieneSancionActiva(operativoId: string | undefined) {
  return useQuery({
    queryKey: ['tiene-sancion-activa', operativoId],
    queryFn: async () => {
      if (!operativoId) return false;

      const { data, error } = await supabase
        .from('sanciones_aplicadas')
        .select('id')
        .eq('operativo_id', operativoId)
        .eq('estado', 'activa')
        .limit(1);

      if (error) {
        console.error('Error checking active sanctions:', error);
        return false;
      }

      return data && data.length > 0;
    },
    enabled: !!operativoId,
  });
}
