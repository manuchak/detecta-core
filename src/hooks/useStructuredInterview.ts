import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StructuredInterview {
  id: string;
  candidato_id: string;
  entrevistador_id: string | null;
  rating_comunicacion: number | null;
  rating_actitud: number | null;
  rating_experiencia: number | null;
  rating_disponibilidad: number | null;
  rating_motivacion: number | null;
  rating_profesionalismo: number | null;
  rating_promedio: number | null;
  notas_generales: string | null;
  fortalezas: string[];
  areas_mejora: string[];
  decision: 'aprobar' | 'rechazar' | 'segunda_entrevista' | 'pendiente' | null;
  motivo_decision: string | null;
  tipo_entrevista: string;
  duracion_minutos: number | null;
  fecha_entrevista: string;
  created_at: string;
}

export interface InterviewFormData {
  candidato_id: string;
  rating_comunicacion: number;
  rating_actitud: number;
  rating_experiencia: number;
  rating_disponibilidad: number;
  rating_motivacion: number;
  rating_profesionalismo: number;
  notas_generales?: string;
  fortalezas?: string[];
  areas_mejora?: string[];
  decision?: 'aprobar' | 'rechazar' | 'segunda_entrevista' | 'pendiente';
  motivo_decision?: string;
  tipo_entrevista?: string;
  duracion_minutos?: number;
}

export function useStructuredInterviews(candidatoId?: string) {
  return useQuery({
    queryKey: ['structured-interviews', candidatoId],
    queryFn: async () => {
      let query = supabase
        .from('entrevistas_estructuradas')
        .select('*')
        .order('fecha_entrevista', { ascending: false });

      if (candidatoId) {
        query = query.eq('candidato_id', candidatoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StructuredInterview[];
    },
    enabled: true,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InterviewFormData) => {
      const { data: interview, error } = await supabase
        .from('entrevistas_estructuradas')
        .insert({
          candidato_id: data.candidato_id,
          rating_comunicacion: data.rating_comunicacion,
          rating_actitud: data.rating_actitud,
          rating_experiencia: data.rating_experiencia,
          rating_disponibilidad: data.rating_disponibilidad,
          rating_motivacion: data.rating_motivacion,
          rating_profesionalismo: data.rating_profesionalismo,
          notas_generales: data.notas_generales,
          fortalezas: data.fortalezas || [],
          areas_mejora: data.areas_mejora || [],
          decision: data.decision || 'pendiente',
          motivo_decision: data.motivo_decision,
          tipo_entrevista: data.tipo_entrevista || 'inicial',
          duracion_minutos: data.duracion_minutos,
        })
        .select()
        .single();

      if (error) throw error;
      return interview;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['structured-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['structured-interviews', variables.candidato_id] });
      toast.success('Entrevista guardada correctamente');
    },
    onError: (error) => {
      console.error('Error saving interview:', error);
      toast.error('Error al guardar la entrevista');
    },
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InterviewFormData> & { id: string }) => {
      const { data: interview, error } = await supabase
        .from('entrevistas_estructuradas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return interview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structured-interviews'] });
      toast.success('Entrevista actualizada');
    },
    onError: (error) => {
      console.error('Error updating interview:', error);
      toast.error('Error al actualizar la entrevista');
    },
  });
}

export function useInterviewMetrics() {
  return useQuery({
    queryKey: ['interview-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_interview_metrics')
        .select('*')
        .limit(12);

      if (error) throw error;
      return data;
    },
  });
}
