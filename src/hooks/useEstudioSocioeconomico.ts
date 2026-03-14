import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EstudioSocioeconomico {
  id: string;
  candidato_id: string;
  proveedor: 'interno' | 'externo';
  nombre_proveedor?: string;
  fecha_estudio?: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'rechazado';
  resultado_general?: 'favorable' | 'con_observaciones' | 'desfavorable';
  score_vivienda?: number;
  score_entorno?: number;
  score_familiar?: number;
  score_economico?: number;
  score_referencias?: number;
  score_global?: number;
  observaciones?: string;
  recomendacion?: string;
  archivo_url?: string;
  realizado_por?: string;
  created_at: string;
  updated_at: string;
}

export type EstudioResultado = 'favorable' | 'con_observaciones' | 'desfavorable';

export function useEstudiosSocioeconomicos(candidatoId: string) {
  return useQuery({
    queryKey: ['estudios-socioeconomicos', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estudios_socioeconomicos')
        .select('*')
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EstudioSocioeconomico[];
    },
    enabled: !!candidatoId,
  });
}

export function useLatestEstudioSocioeconomico(candidatoId: string) {
  const { data: estudios } = useEstudiosSocioeconomicos(candidatoId);
  return estudios?.[0] || null;
}

export function useCrearEstudioSocioeconomico() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      candidatoId: string;
      proveedor: 'interno' | 'externo';
      nombre_proveedor?: string;
      fecha_estudio?: string;
      estado: string;
      resultado_general?: string;
      score_vivienda?: number;
      score_entorno?: number;
      score_familiar?: number;
      score_economico?: number;
      score_referencias?: number;
      observaciones?: string;
      recomendacion?: string;
      archivo_url?: string;
    }) => {
      // Calculate score_global
      const scores = [data.score_vivienda, data.score_entorno, data.score_familiar, data.score_economico, data.score_referencias].filter(s => s != null) as number[];
      const score_global = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null;

      const { data: estudio, error } = await supabase
        .from('estudios_socioeconomicos')
        .insert({
          candidato_id: data.candidatoId,
          proveedor: data.proveedor,
          nombre_proveedor: data.nombre_proveedor,
          fecha_estudio: data.fecha_estudio,
          estado: data.estado,
          resultado_general: data.resultado_general,
          score_vivienda: data.score_vivienda,
          score_entorno: data.score_entorno,
          score_familiar: data.score_familiar,
          score_economico: data.score_economico,
          score_referencias: data.score_referencias,
          score_global,
          observaciones: data.observaciones,
          recomendacion: data.recomendacion,
          archivo_url: data.archivo_url,
          realizado_por: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return estudio;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estudios-socioeconomicos', variables.candidatoId] });
      toast.success('Estudio socioeconómico registrado');
    },
    onError: (error) => {
      console.error('Error creando estudio:', error);
      toast.error('Error al registrar el estudio');
    }
  });
}

export function useActualizarEstudioSocioeconomico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, candidatoId, ...updates }: Partial<EstudioSocioeconomico> & { id: string; candidatoId: string }) => {
      // Recalculate score_global if scores changed
      const scores = [updates.score_vivienda, updates.score_entorno, updates.score_familiar, updates.score_economico, updates.score_referencias].filter(s => s != null) as number[];
      if (scores.length > 0) {
        (updates as any).score_global = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
      }

      const { data, error } = await supabase
        .from('estudios_socioeconomicos')
        .update(updates)
        .eq('id', id)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No se pudo actualizar el estudio — operación bloqueada por permisos');
      return { candidatoId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['estudios-socioeconomicos', result.candidatoId] });
      toast.success('Estudio actualizado');
    },
    onError: (error) => {
      console.error('Error actualizando estudio:', error);
      toast.error('Error al actualizar');
    }
  });
}
