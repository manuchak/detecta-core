import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();

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

      const preguntas = await fetchPreguntas(moduloId);
      
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

      const { data: progresoActual } = await supabase
        .from('progreso_capacitacion')
        .select('quiz_intentos, quiz_mejor_puntaje')
        .eq('candidato_id', candidatoId)
        .eq('modulo_id', moduloId)
        .single();

      const intentos = (progresoActual?.quiz_intentos || 0) + 1;
      const mejorPuntaje = Math.max(puntaje, progresoActual?.quiz_mejor_puntaje || 0);

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

  // Marcar capacitación como completada manualmente (presencial)
  const marcarCapacitacionManual = useMutation({
    mutationFn: async ({ notas, archivo }: { notas?: string; archivo?: File }) => {
      if (!candidatoId || !modulos) throw new Error('Datos requeridos');

      // 1. Si hay archivo, subirlo a storage y crear registro en documentos_candidato
      if (archivo) {
        const timestamp = Date.now();
        const ext = archivo.name.split('.').pop() || 'jpg';
        const sanitizedPath = `${candidatoId}/constancia_capacitacion_${timestamp}.${ext}`.replace(/[^a-zA-Z0-9_\-\/\.]/g, '_');

        // Comprimir si es imagen
        let fileToUpload: Blob = archivo;
        if (archivo.type.startsWith('image/') && archivo.type !== 'image/svg+xml') {
          try {
            const { compressImage } = await import('@/lib/imageUtils');
            const result = await compressImage(archivo, { maxWidth: 1920, maxHeight: 1080, quality: 0.7 });
            fileToUpload = result.blob;
          } catch {
            // Fallback al original
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('candidato-documentos')
          .upload(sanitizedPath, fileToUpload, { contentType: archivo.type, upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('candidato-documentos')
          .getPublicUrl(sanitizedPath);

        // Insertar registro en documentos_candidato
        const { error: docError } = await supabase
          .from('documentos_candidato')
          .insert({
            candidato_id: candidatoId,
            tipo_documento: 'constancia_capacitacion',
            archivo_url: urlData.publicUrl,
            archivo_nombre: archivo.name,
            archivo_tipo: archivo.type,
            archivo_tamaño: archivo.size,
            estado_validacion: 'pendiente',
            documento_vigente: true,
            subido_por: user?.id,
            notas: notas || null,
          });
        if (docError) throw docError;
      }

      // 2. Upsert all modules as manually completed
      const upserts = modulos.map(modulo => ({
        candidato_id: candidatoId,
        modulo_id: modulo.id,
        completado_manual: true,
        completado_manual_por: user?.id,
        completado_manual_fecha: new Date().toISOString(),
        completado_manual_notas: notas || null,
        contenido_completado: true,
        quiz_aprobado: true,
        fecha_completado_contenido: new Date().toISOString(),
        fecha_aprobacion_quiz: new Date().toISOString(),
      }));

      for (const upsert of upserts) {
        const { error } = await supabase
          .from('progreso_capacitacion')
          .upsert(upsert, { onConflict: 'candidato_id,modulo_id' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progreso-capacitacion', candidatoId] });
      queryClient.invalidateQueries({ queryKey: ['profile-documents', candidatoId] });
      toast({ title: 'Capacitación completada', description: 'Todos los módulos fueron marcados como completados (presencial)' });
    },
    onError: (error) => {
      console.error('Error in marcarCapacitacionManual:', error);
    }
  });

  // Calcular progreso general
  const calcularProgresoGeneral = () => {
    if (!modulos || !progreso) return null;

    const modulosObligatorios = modulos.filter(m => m.es_obligatorio);
    const aprobados = progreso.filter(p => p.quiz_aprobado || (p as any).completado_manual).length;
    const aprobadosObligatorios = progreso.filter(p => {
      const modulo = modulos.find(m => m.id === p.modulo_id);
      return (p.quiz_aprobado || (p as any).completado_manual) && modulo?.es_obligatorio;
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
    marcarCapacitacionManual,
    calcularProgresoGeneral
  };
};
