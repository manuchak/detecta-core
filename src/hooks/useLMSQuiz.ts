import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LMSPregunta, RespuestaQuiz, QuizContent } from "@/types/lms";

// Obtener preguntas de un quiz
export function useLMSPreguntas(preguntasIds: string[] | undefined) {
  return useQuery({
    queryKey: ['lms-preguntas', preguntasIds],
    queryFn: async () => {
      if (!preguntasIds || preguntasIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('lms_preguntas')
        .select('*')
        .in('id', preguntasIds)
        .eq('activa', true);

      if (error) throw error;
      
      // Ordenar según el orden en preguntasIds
      const ordenMap = new Map(preguntasIds.map((id, idx) => [id, idx]));
      return (data as LMSPregunta[]).sort((a, b) => 
        (ordenMap.get(a.id) ?? 0) - (ordenMap.get(b.id) ?? 0)
      );
    },
    enabled: !!preguntasIds && preguntasIds.length > 0,
  });
}

// Calcular puntaje del quiz
export function calcularPuntaje(
  respuestas: Record<string, string | string[]>,
  preguntas: LMSPregunta[]
): {
  puntosObtenidos: number;
  puntosTotal: number;
  porcentaje: number;
  detalles: RespuestaQuiz[];
} {
  let puntosObtenidos = 0;
  let puntosTotal = 0;
  const detalles: RespuestaQuiz[] = [];

  preguntas.forEach(pregunta => {
    puntosTotal += pregunta.puntos;
    const respuesta = respuestas[pregunta.id];
    let esCorrecta = false;
    let puntosGanados = 0;

    if (pregunta.tipo === 'opcion_multiple' || pregunta.tipo === 'verdadero_falso') {
      const opcionCorrecta = pregunta.opciones.find(o => o.es_correcta);
      if (opcionCorrecta && respuesta === opcionCorrecta.id) {
        esCorrecta = true;
        puntosGanados = pregunta.puntos;
      }
    } else if (pregunta.tipo === 'respuesta_corta') {
      const respuestaCorrecta = pregunta.opciones[0]?.texto;
      if (respuestaCorrecta) {
        const respuestaLimpia = String(respuesta || '').trim().toLowerCase();
        const correctaLimpia = respuestaCorrecta.trim().toLowerCase();
        if (respuestaLimpia === correctaLimpia) {
          esCorrecta = true;
          puntosGanados = pregunta.puntos;
        }
      }
    } else if (pregunta.tipo === 'ordenar') {
      // Para ordenar, verificar que el orden sea correcto
      const ordenCorrecto = pregunta.opciones
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map(o => o.id);
      if (Array.isArray(respuesta) && 
          respuesta.length === ordenCorrecto.length &&
          respuesta.every((id, idx) => id === ordenCorrecto[idx])) {
        esCorrecta = true;
        puntosGanados = pregunta.puntos;
      }
    }

    puntosObtenidos += puntosGanados;
    detalles.push({
      pregunta_id: pregunta.id,
      respuesta: respuesta,
      es_correcta: esCorrecta,
      puntos_obtenidos: puntosGanados,
    });
  });

  return {
    puntosObtenidos,
    puntosTotal,
    porcentaje: puntosTotal > 0 ? Math.round((puntosObtenidos / puntosTotal) * 100) : 0,
    detalles,
  };
}

// Guardar resultado del quiz
export function useLMSGuardarQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inscripcionId,
      contenidoId,
      respuestas,
      puntaje,
      tiempoSegundos,
      aprobado,
    }: {
      inscripcionId: string;
      contenidoId: string;
      respuestas: RespuestaQuiz[];
      puntaje: number;
      tiempoSegundos: number;
      aprobado: boolean;
    }) => {
      // Primero obtener el progreso actual
      const { data: progresoActual } = await supabase
        .from('lms_progreso')
        .select('*')
        .eq('inscripcion_id', inscripcionId)
        .eq('contenido_id', contenidoId)
        .maybeSingle();

      const ahora = new Date().toISOString();
      const intentosActuales = progresoActual?.quiz_intentos ?? 0;
      const mejorPuntajeActual = progresoActual?.quiz_mejor_puntaje ?? 0;

      const nuevosDatos = {
        inscripcion_id: inscripcionId,
        contenido_id: contenidoId,
        iniciado: true,
        completado: aprobado || (progresoActual?.completado ?? false),
        fecha_inicio: progresoActual?.fecha_inicio ?? ahora,
        fecha_completado: aprobado ? ahora : progresoActual?.fecha_completado,
        tiempo_dedicado_seg: (progresoActual?.tiempo_dedicado_seg ?? 0) + tiempoSegundos,
        veces_visto: (progresoActual?.veces_visto ?? 0) + 1,
        quiz_intentos: intentosActuales + 1,
        quiz_mejor_puntaje: Math.max(puntaje, mejorPuntajeActual),
        quiz_ultimo_puntaje: puntaje,
        quiz_respuestas: respuestas,
        updated_at: ahora,
      };

      const { data, error } = await supabase
        .from('lms_progreso')
        .upsert(nuevosDatos, {
          onConflict: 'inscripcion_id,contenido_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lms-progreso', variables.inscripcionId] });
    },
    onError: (error) => {
      console.error('Error guardando quiz:', error);
      toast.error('Error al guardar el resultado del quiz');
    },
  });
}

// Verificar si puede reintentar
export function puedeReintentar(
  intentosUsados: number,
  intentosPermitidos: number
): boolean {
  if (intentosPermitidos === 0) return true; // 0 = ilimitados
  return intentosUsados < intentosPermitidos;
}

// Hook para obtener el progreso del quiz actual
export function useQuizProgreso(inscripcionId: string | undefined, contenidoId: string | undefined) {
  return useQuery({
    queryKey: ['lms-quiz-progreso', inscripcionId, contenidoId],
    queryFn: async () => {
      if (!inscripcionId || !contenidoId) return null;

      const { data, error } = await supabase
        .from('lms_progreso')
        .select('*')
        .eq('inscripcion_id', inscripcionId)
        .eq('contenido_id', contenidoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!inscripcionId && !!contenidoId,
  });
}
