import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { QuizQuestion } from "@/components/lms/admin/quiz/QuestionCard";

interface CrearPreguntasParams {
  cursoId: string;
  preguntas: QuizQuestion[];
}

export const useLMSCrearPreguntas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cursoId, preguntas }: CrearPreguntasParams) => {
      const preguntasDB = preguntas.map((p, index) => ({
        id: p.id,
        curso_id: cursoId,
        tipo: 'opcion_multiple' as const,
        pregunta: p.pregunta,
        opciones: p.opciones.map((o, idx) => ({
          texto: o.texto,
          es_correcta: idx === p.respuesta_correcta
        })),
        explicacion: p.explicacion || null,
        puntos: p.puntos || 10,
        orden: index + 1,
        activa: true
      }));

      const { data, error } = await supabase
        .from('lms_preguntas')
        .upsert(preguntasDB, { onConflict: 'id' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { cursoId }) => {
      queryClient.invalidateQueries({ queryKey: ['lms-admin-curso', cursoId] });
    }
  });
};

export const useLMSEliminarPreguntas = () => {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      
      const { error } = await supabase
        .from('lms_preguntas')
        .update({ activa: false })
        .in('id', ids);

      if (error) throw error;
    }
  });
};

export async function fetchPreguntasByIds(ids: string[]): Promise<QuizQuestion[]> {
  if (!ids || ids.length === 0) return [];

  const { data, error } = await supabase
    .from('lms_preguntas')
    .select('*')
    .in('id', ids)
    .eq('activa', true)
    .order('orden');

  if (error) throw error;
  if (!data) return [];

  return data.map(p => {
    const opciones = (p.opciones as any[]) || [];
    return {
      id: p.id,
      pregunta: p.pregunta,
      opciones: opciones.map(o => ({ texto: o.texto })),
      respuesta_correcta: opciones.findIndex(o => o.es_correcta),
      explicacion: p.explicacion || '',
      puntos: p.puntos || 10
    };
  });
}
