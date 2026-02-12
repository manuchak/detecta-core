import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface EvaluacionMidot {
  id: string;
  candidato_id: string;
  evaluador_id: string;
  score_integridad: number | null;
  score_honestidad: number | null;
  score_lealtad: number | null;
  score_global: number | null;
  resultado_semaforo: string;
  reporte_pdf_url: string | null;
  notas: string | null;
  fecha_evaluacion: string;
  created_at: string;
  updated_at: string;
}

export function useEvaluacionesMidot(candidatoId: string) {
  return useQuery({
    queryKey: ['evaluaciones-midot', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluaciones_midot')
        .select('*')
        .eq('candidato_id', candidatoId)
        .order('fecha_evaluacion', { ascending: false });
      if (error) throw error;
      return data as EvaluacionMidot[];
    },
    enabled: !!candidatoId,
  });
}

export function useLatestMidot(candidatoId: string) {
  const { data: evaluaciones } = useEvaluacionesMidot(candidatoId);
  return evaluaciones?.[0] ?? null;
}

function calcularSemaforo(score: number): string {
  if (score >= 70) return 'verde';
  if (score >= 50) return 'ambar';
  return 'rojo';
}

export interface CreateMidotInput {
  candidato_id: string;
  score_integridad: number;
  score_honestidad: number;
  score_lealtad: number;
  reporte_pdf_url?: string;
  notas?: string;
  fecha_evaluacion: string;
}

export function useCreateMidot() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateMidotInput) => {
      const score_global = Math.round(
        (input.score_integridad + input.score_honestidad + input.score_lealtad) / 3
      );
      const resultado_semaforo = calcularSemaforo(score_global);

      const { data, error } = await supabase
        .from('evaluaciones_midot')
        .insert({
          candidato_id: input.candidato_id,
          evaluador_id: user?.id || '',
          score_integridad: input.score_integridad,
          score_honestidad: input.score_honestidad,
          score_lealtad: input.score_lealtad,
          score_global,
          resultado_semaforo,
          reporte_pdf_url: input.reporte_pdf_url || null,
          notas: input.notas || null,
          fecha_evaluacion: input.fecha_evaluacion,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluaciones-midot', variables.candidato_id] });
      toast({ title: 'Evaluación Midot registrada', description: 'Los resultados se guardaron correctamente.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar la evaluación', variant: 'destructive' });
    },
  });
}
