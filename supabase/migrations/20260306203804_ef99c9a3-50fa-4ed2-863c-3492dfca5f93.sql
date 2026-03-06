-- Fix Bug 4: Protect fecha_completado from being overwritten on re-visits
-- Fix Bug 3: Protect quiz_intentos from being reset to 0 by lms_marcar_contenido_completado

CREATE OR REPLACE FUNCTION public.lms_marcar_contenido_completado(
  p_contenido_id UUID,
  p_datos_extra JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_inscripcion_id UUID;
  v_progreso_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Obtener inscripción del usuario para este contenido
  SELECT i.id INTO v_inscripcion_id
  FROM public.lms_inscripciones i
  JOIN public.lms_cursos c ON c.id = i.curso_id
  JOIN public.lms_modulos m ON m.curso_id = c.id
  JOIN public.lms_contenidos cont ON cont.modulo_id = m.id
  WHERE cont.id = p_contenido_id
    AND i.usuario_id = v_user_id;
  
  IF v_inscripcion_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No inscrito en este curso');
  END IF;
  
  -- Actualizar o crear registro de progreso
  INSERT INTO public.lms_progreso (
    inscripcion_id,
    contenido_id,
    iniciado,
    completado,
    fecha_inicio,
    fecha_completado,
    tiempo_dedicado_seg,
    video_porcentaje_visto,
    quiz_ultimo_puntaje,
    quiz_mejor_puntaje,
    quiz_intentos,
    quiz_respuestas
  )
  VALUES (
    v_inscripcion_id,
    p_contenido_id,
    true,
    true,
    COALESCE((p_datos_extra->>'fecha_inicio')::TIMESTAMPTZ, NOW()),
    NOW(),
    COALESCE((p_datos_extra->>'tiempo_dedicado_seg')::INTEGER, 0),
    COALESCE((p_datos_extra->>'video_porcentaje_visto')::DECIMAL, 100),
    (p_datos_extra->>'quiz_puntaje')::DECIMAL,
    (p_datos_extra->>'quiz_puntaje')::DECIMAL,
    COALESCE((p_datos_extra->>'quiz_intentos')::INTEGER, 0),
    p_datos_extra->'quiz_respuestas'
  )
  ON CONFLICT (inscripcion_id, contenido_id) DO UPDATE
    SET completado = true,
        -- BUG 4 FIX: Only set fecha_completado if it was never set before
        fecha_completado = CASE 
          WHEN lms_progreso.fecha_completado IS NULL THEN NOW()
          ELSE lms_progreso.fecha_completado
        END,
        tiempo_dedicado_seg = EXCLUDED.tiempo_dedicado_seg + lms_progreso.tiempo_dedicado_seg,
        veces_visto = lms_progreso.veces_visto + 1,
        video_porcentaje_visto = GREATEST(lms_progreso.video_porcentaje_visto, EXCLUDED.video_porcentaje_visto),
        -- BUG 3 FIX: Preserve existing quiz data, never overwrite with defaults
        quiz_ultimo_puntaje = COALESCE(EXCLUDED.quiz_ultimo_puntaje, lms_progreso.quiz_ultimo_puntaje),
        quiz_mejor_puntaje = GREATEST(COALESCE(EXCLUDED.quiz_mejor_puntaje, 0), COALESCE(lms_progreso.quiz_mejor_puntaje, 0)),
        quiz_intentos = GREATEST(COALESCE(EXCLUDED.quiz_intentos, 0), COALESCE(lms_progreso.quiz_intentos, 0)),
        quiz_respuestas = COALESCE(EXCLUDED.quiz_respuestas, lms_progreso.quiz_respuestas),
        updated_at = NOW()
  RETURNING id INTO v_progreso_id;
  
  -- Actualizar fecha_inicio de inscripción si es la primera actividad
  UPDATE public.lms_inscripciones
  SET fecha_inicio = COALESCE(fecha_inicio, NOW()),
      estado = CASE WHEN estado = 'inscrito' THEN 'en_progreso' ELSE estado END
  WHERE id = v_inscripcion_id;
  
  -- Recalcular progreso
  PERFORM public.lms_calcular_progreso(v_inscripcion_id);
  
  RETURN json_build_object(
    'success', true,
    'progreso_id', v_progreso_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;