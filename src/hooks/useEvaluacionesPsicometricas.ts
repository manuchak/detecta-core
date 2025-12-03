import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EvaluacionPsicometrica {
  id: string;
  candidato_id: string;
  evaluador_id: string;
  score_integridad: number | null;
  score_psicopatia: number | null;
  score_violencia: number | null;
  score_agresividad: number | null;
  score_afrontamiento: number | null;
  score_veracidad: number | null;
  score_entrevista: number | null;
  score_global: number;
  percentiles: Record<string, number> | null;
  interpretacion_clinica: string | null;
  risk_flags: string[] | null;
  resultado_semaforo: 'verde' | 'ambar' | 'rojo';
  requiere_aval_coordinacion: boolean;
  aval_coordinacion_id: string | null;
  aval_decision: 'aprobado' | 'rechazado' | 'pendiente' | null;
  aval_notas: string | null;
  fecha_aval: string | null;
  estado: string;
  fecha_evaluacion: string;
  created_at: string;
  updated_at: string;
  evaluador?: { display_name: string };
  aval_coordinacion?: { display_name: string };
}

export interface CreateEvaluacionData {
  candidato_id: string;
  score_integridad?: number;
  score_psicopatia?: number;
  score_violencia?: number;
  score_agresividad?: number;
  score_afrontamiento?: number;
  score_veracidad?: number;
  score_entrevista?: number;
  score_global: number;
  percentiles?: Record<string, number>;
  interpretacion_clinica?: string;
  risk_flags?: string[];
}

export const useEvaluacionesPsicometricas = (candidatoId: string) => {
  return useQuery({
    queryKey: ['evaluaciones-psicometricas', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluaciones_psicometricas')
        .select(`
          *,
          evaluador:evaluador_id(display_name),
          aval_coordinacion:aval_coordinacion_id(display_name)
        `)
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EvaluacionPsicometrica[];
    },
    enabled: !!candidatoId,
  });
};

export const useLatestEvaluacionPsicometrica = (candidatoId: string) => {
  return useQuery({
    queryKey: ['evaluacion-psicometrica-latest', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluaciones_psicometricas')
        .select(`
          *,
          evaluador:evaluador_id(display_name),
          aval_coordinacion:aval_coordinacion_id(display_name)
        `)
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as EvaluacionPsicometrica | null;
    },
    enabled: !!candidatoId,
  });
};

export const useCreateEvaluacionPsicometrica = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateEvaluacionData) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { data: result, error } = await supabase
        .from('evaluaciones_psicometricas')
        .insert({
          ...data,
          evaluador_id: user.id,
          resultado_semaforo: 'verde', // Will be overwritten by trigger
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluaciones-psicometricas', variables.candidato_id] });
      queryClient.invalidateQueries({ queryKey: ['evaluacion-psicometrica-latest', variables.candidato_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-avals'] });
      toast.success('Evaluación psicométrica registrada');
    },
    onError: (error) => {
      console.error('Error creating evaluation:', error);
      toast.error('Error al registrar evaluación');
    },
  });
};

export const useUpdateAvalPsicometrico = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      evaluacionId, 
      decision, 
      notas 
    }: { 
      evaluacionId: string; 
      decision: 'aprobado' | 'rechazado'; 
      notas?: string;
    }) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('evaluaciones_psicometricas')
        .update({
          aval_coordinacion_id: user.id,
          aval_decision: decision,
          aval_notas: notas,
          fecha_aval: new Date().toISOString(),
        })
        .eq('id', evaluacionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluaciones-psicometricas'] });
      queryClient.invalidateQueries({ queryKey: ['evaluacion-psicometrica-latest'] });
      queryClient.invalidateQueries({ queryKey: ['pending-avals'] });
      toast.success('Aval registrado correctamente');
    },
    onError: (error) => {
      console.error('Error updating aval:', error);
      toast.error('Error al registrar aval');
    },
  });
};

export const usePendingAvals = () => {
  return useQuery({
    queryKey: ['pending-avals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluaciones_psicometricas')
        .select(`
          *,
          candidato:candidato_id(id, nombre, telefono, email),
          evaluador:evaluador_id(display_name)
        `)
        .eq('aval_decision', 'pendiente')
        .eq('requiere_aval_coordinacion', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
