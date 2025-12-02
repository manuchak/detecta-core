import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StateTransition {
  id: string;
  candidato_id: string;
  from_state: string | null;
  to_state: string;
  changed_by: string | null;
  reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export const CANDIDATE_STATES = {
  lead: { label: 'Lead', color: 'bg-gray-500', order: 1 },
  contactado: { label: 'Contactado', color: 'bg-blue-500', order: 2 },
  entrevista_programada: { label: 'Entrevista Programada', color: 'bg-indigo-500', order: 3 },
  entrevista_en_progreso: { label: 'Entrevista en Progreso', color: 'bg-purple-500', order: 4 },
  entrevista_completada: { label: 'Entrevista Completada', color: 'bg-violet-500', order: 5 },
  segunda_entrevista: { label: 'Segunda Entrevista', color: 'bg-fuchsia-500', order: 6 },
  evaluacion_psicometrica: { label: 'Evaluación Psicométrica', color: 'bg-pink-500', order: 7 },
  evaluacion_toxicologica: { label: 'Evaluación Toxicológica', color: 'bg-rose-500', order: 8 },
  validacion_referencias: { label: 'Validación Referencias', color: 'bg-orange-500', order: 9 },
  validacion_documentos: { label: 'Validación Documentos', color: 'bg-amber-500', order: 10 },
  capacitacion: { label: 'Capacitación', color: 'bg-yellow-500', order: 11 },
  instalacion_tecnica: { label: 'Instalación Técnica', color: 'bg-lime-500', order: 12 },
  aprobado_final: { label: 'Aprobado Final', color: 'bg-green-500', order: 13 },
  en_liberacion: { label: 'En Liberación', color: 'bg-emerald-500', order: 14 },
  activo: { label: 'Activo', color: 'bg-teal-500', order: 15 },
  rechazado: { label: 'Rechazado', color: 'bg-red-500', order: -1 },
} as const;

export type CandidateState = keyof typeof CANDIDATE_STATES;

export function useStateTransitions(candidatoId: string) {
  return useQuery({
    queryKey: ['state-transitions', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custodio_state_transitions')
        .select('*')
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StateTransition[];
    },
    enabled: !!candidatoId,
  });
}

export function useTransitionState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      candidatoId,
      newState,
      reason,
      metadata,
    }: {
      candidatoId: string;
      newState: CandidateState;
      reason?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('transition_candidato_state', {
        p_candidato_id: candidatoId,
        p_new_state: newState,
        p_reason: reason || null,
        p_metadata: metadata || {},
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; from_state?: string; to_state?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Error en la transición de estado');
      }

      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['state-transitions', variables.candidatoId] });
      queryClient.invalidateQueries({ queryKey: ['candidatos-custodios'] });
      toast.success(`Estado actualizado: ${result.from_state} → ${result.to_state}`);
    },
    onError: (error: Error) => {
      console.error('Error transitioning state:', error);
      toast.error(error.message || 'Error al cambiar el estado');
    },
  });
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['supply-feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_feature_flags')
        .select('*');

      if (error) throw error;
      
      const flags: Record<string, boolean> = {};
      data?.forEach((flag: { flag_key: string; flag_value: boolean }) => {
        flags[flag.flag_key] = flag.flag_value;
      });
      return flags;
    },
  });
}
