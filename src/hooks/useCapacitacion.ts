import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ModuloCapacitacion, 
  PreguntaQuiz, 
  ProgresoCapacitacion, 
  ResultadoQuiz,
  QUIZ_MIN_SCORE 
} from '@/types/capacitacion';

export const useCapacitacion = (candidatoId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch todos los módulos activos
  const { data: modulos, isLoading: loadingModulos } = useQuery({
    queryKey: ['modulos-capacitacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modulos_capacitacion')
        .select('*')
        .eq('activo', true)
        .order('orden');
      
      if (error) throw error;
      return data as ModuloCapacitacion[];
    }
  });

  // Fetch progreso del candidato
  const { data: progreso, isLoading: loadingProgreso } = useQuery({
    queryKey: ['progreso-capacitacion', candidatoId],
    queryFn: async () => {
      if (!candidatoId) return [];
      
      const { data, error } = await supabase
        .from('progreso_capacitacion')
        .select(`
          *,
          modulo:modulos_capacitacion(*)
        `)
        .eq('candidato_id', candidatoId);
      
      if (error) throw error;
      return data as ProgresoCapacitacion[];
    },
    enabled: !!candidatoId
  });

  // Fetch preguntas de un módulo
  const fetchPreguntas = async (moduloId: string) => {
    const { data, error } = await supabase
      .from('preguntas_quiz')
      .select('*')
      .eq('modulo_id', moduloId)
      .eq('activa', true)
      .order('orden');
    
    if (error) throw error;
    return data as PreguntaQuiz[];
  };

  // Iniciar contenido de módulo
  const iniciarContenido = useMutation({
    mutationFn: async ({ moduloId }: { moduloId: string }) => {
      if (!candidatoId) throw new Error('Candidato ID requerido');

      const { data, error } = await supabase
        .from('progreso_capacitacion')
        .upsert({
          candidato_id: candidatoId,
          modulo_id: moduloId,
          contenido_iniciado: true,
          fecha_inicio_contenido: new Date().toISOString()
        }, {
          onConflict: 'candidato_id,modulo_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progreso-capacitacion', candidatoId] });
    }
  });

  // Completar contenido de módulo
  const completarContenido = useMutation({
    mutationFn: async ({ moduloId, tiempoDedicado }: { moduloId: string; tiempoDedicado: number }) => {
      if (!candidatoId) throw new Error('Candidato ID requerido');

      const { data, error } = await supabase
        .from('progreso_capacitacion')
        .upsert({
          candidato_id: candidatoId,
          modulo_id: moduloId,
          contenido_completado: true,
          fecha_completado_contenido: new Date().toISOString(),
          tiempo_dedicado_min: tiempoDedicado
        }, {
          onConflict: 'candidato_id,modulo_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progreso-capacitacion', candidatoId] });
      toast({ title: 'Contenido completado', description: 'Ahora puedes realizar el quiz' });
    }
  });

  // Enviar respuestas del quiz
  const enviarQuiz = useMutation({
    mutationFn: async ({ 
      moduloId, 
      respuestas 
    }: { 
      moduloId: string; 
      respuestas: { pregunta_id: string; opcion_seleccionada: number }[] 
    }): Promise<ResultadoQuiz> => {
      if (!candidatoId) throw new Error('Candidato ID requerido');

      // Obtener preguntas para validar respuestas
      const preguntas = await fetchPreguntas(moduloId);
      
      // Calcular resultado
      let correctas = 0;
      const respuestasEvaluadas = respuestas.map(r => {
        const pregunta = preguntas.find(p => p.id === r.pregunta_id);
        const esCorrecta = pregunta?.opciones[r.opcion_seleccionada]?.es_correcta || false;
        if (esCorrecta) correctas++;
        return {
          pregunta_id: r.pregunta_id,
          opcion_seleccionada: r.opcion_seleccionada,
          es_correcta: esCorrecta
        };
      });

      const puntaje = Math.round((correctas / preguntas.length) * 100);
      const aprobado = puntaje >= QUIZ_MIN_SCORE;

      // Obtener progreso actual para mantener mejor puntaje
      const { data: progresoActual } = await supabase
        .from('progreso_capacitacion')
        .select('quiz_intentos, quiz_mejor_puntaje')
        .eq('candidato_id', candidatoId)
        .eq('modulo_id', moduloId)
        .single();

      const intentos = (progresoActual?.quiz_intentos || 0) + 1;
      const mejorPuntaje = Math.max(puntaje, progresoActual?.quiz_mejor_puntaje || 0);

      // Actualizar progreso
      const { error } = await supabase
        .from('progreso_capacitacion')
        .upsert({
          candidato_id: candidatoId,
          modulo_id: moduloId,
          quiz_iniciado: true,
          quiz_completado: true,
          quiz_intentos: intentos,
          quiz_mejor_puntaje: mejorPuntaje,
          quiz_ultimo_puntaje: puntaje,
          quiz_aprobado: aprobado || (progresoActual?.quiz_mejor_puntaje || 0) >= QUIZ_MIN_SCORE,
          fecha_primer_quiz: progresoActual ? undefined : new Date().toISOString(),
          fecha_aprobacion_quiz: aprobado ? new Date().toISOString() : undefined,
          respuestas_ultimo_intento: respuestasEvaluadas
        }, {
          onConflict: 'candidato_id,modulo_id'
        });

      if (error) throw error;

      return {
        puntaje,
        total_preguntas: preguntas.length,
        respuestas_correctas: correctas,
        porcentaje: puntaje,
        aprobado,
        respuestas: respuestasEvaluadas
      };
    },
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ['progreso-capacitacion', candidatoId] });
      
      if (resultado.aprobado) {
        toast({ 
          title: '¡Quiz aprobado!', 
          description: `Obtuviste ${resultado.puntaje}% (mínimo ${QUIZ_MIN_SCORE}%)` 
        });
      } else {
        toast({ 
          title: 'Quiz no aprobado', 
          description: `Obtuviste ${resultado.puntaje}%. Necesitas ${QUIZ_MIN_SCORE}% para aprobar.`,
          variant: 'destructive'
        });
      }
    }
  });

  // Calcular progreso general
  const calcularProgresoGeneral = () => {
    if (!modulos || !progreso) return null;

    const modulosObligatorios = modulos.filter(m => m.es_obligatorio);
    const aprobados = progreso.filter(p => p.quiz_aprobado).length;
    const aprobadosObligatorios = progreso.filter(p => {
      const modulo = modulos.find(m => m.id === p.modulo_id);
      return p.quiz_aprobado && modulo?.es_obligatorio;
    }).length;

    return {
      total_modulos: modulos.length,
      modulos_obligatorios: modulosObligatorios.length,
      quizzes_aprobados: aprobados,
      quizzes_obligatorios_aprobados: aprobadosObligatorios,
      porcentaje: Math.round((aprobados / modulos.length) * 100),
      capacitacion_completa: aprobadosObligatorios === modulosObligatorios.length
    };
  };

  return {
    modulos,
    progreso,
    isLoading: loadingModulos || loadingProgreso,
    fetchPreguntas,
    iniciarContenido,
    completarContenido,
    enviarQuiz,
    calcularProgresoGeneral
  };
};
