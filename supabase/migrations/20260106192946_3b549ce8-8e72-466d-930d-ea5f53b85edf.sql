-- =====================================================
-- LMS: SISTEMA DE INSCRIPCIÓN AUTOMÁTICA Y CONTROL
-- =====================================================

-- 1. Función para inscribir usuario en cursos obligatorios de su rol
CREATE OR REPLACE FUNCTION public.lms_inscribir_usuario_cursos_obligatorios()
RETURNS TRIGGER AS $$
DECLARE
  v_curso RECORD;
  v_fecha_limite TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Solo procesar cuando se activa un rol
  IF NEW.is_active = TRUE AND (OLD IS NULL OR OLD.is_active = FALSE) THEN
    -- Buscar cursos obligatorios para este rol
    FOR v_curso IN 
      SELECT id, plazo_dias_default 
      FROM public.lms_cursos 
      WHERE es_obligatorio = TRUE 
        AND publicado = TRUE 
        AND activo = TRUE
        AND NEW.role = ANY(roles_objetivo)
    LOOP
      -- Calcular fecha límite basada en plazo_dias_default
      v_fecha_limite := NOW() + (COALESCE(v_curso.plazo_dias_default, 30) || ' days')::INTERVAL;
      
      -- Insertar inscripción (ignorar si ya existe)
      INSERT INTO public.lms_inscripciones (
        usuario_id, curso_id, tipo_inscripcion, 
        estado, fecha_limite, progreso_porcentaje
      ) VALUES (
        NEW.user_id, v_curso.id, 'obligatoria',
        'inscrito', v_fecha_limite, 0
      ) ON CONFLICT (usuario_id, curso_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Trigger en user_roles para inscripción automática
DROP TRIGGER IF EXISTS on_user_role_activated ON public.user_roles;
CREATE TRIGGER on_user_role_activated
  AFTER INSERT OR UPDATE OF is_active ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.lms_inscribir_usuario_cursos_obligatorios();

-- 3. Función RPC para inscripción masiva por roles
CREATE OR REPLACE FUNCTION public.lms_inscribir_usuarios_por_rol(
  p_curso_id UUID,
  p_roles TEXT[],
  p_tipo_inscripcion VARCHAR DEFAULT 'asignada',
  p_plazo_dias INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_curso RECORD;
  v_usuario RECORD;
  v_fecha_limite TIMESTAMP WITH TIME ZONE;
  v_inscritos INTEGER := 0;
  v_ya_inscritos INTEGER := 0;
BEGIN
  -- Obtener datos del curso
  SELECT id, plazo_dias_default INTO v_curso
  FROM public.lms_cursos
  WHERE id = p_curso_id AND activo = TRUE;
  
  IF v_curso.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Curso no encontrado o inactivo');
  END IF;
  
  -- Calcular fecha límite
  v_fecha_limite := NOW() + (COALESCE(p_plazo_dias, v_curso.plazo_dias_default, 30) || ' days')::INTERVAL;
  
  -- Buscar usuarios activos con los roles especificados
  FOR v_usuario IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = ANY(p_roles)
      AND ur.is_active = TRUE
  LOOP
    -- Intentar insertar inscripción
    INSERT INTO public.lms_inscripciones (
      usuario_id, curso_id, tipo_inscripcion,
      estado, fecha_limite, progreso_porcentaje
    ) VALUES (
      v_usuario.user_id, p_curso_id, p_tipo_inscripcion,
      'inscrito', v_fecha_limite, 0
    )
    ON CONFLICT (usuario_id, curso_id) DO NOTHING;
    
    IF FOUND THEN
      v_inscritos := v_inscritos + 1;
    ELSE
      v_ya_inscritos := v_ya_inscritos + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'inscritos', v_inscritos,
    'ya_inscritos', v_ya_inscritos,
    'total_procesados', v_inscritos + v_ya_inscritos
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Función RPC para contar usuarios por roles (preview antes de inscribir)
CREATE OR REPLACE FUNCTION public.lms_contar_usuarios_por_rol(
  p_curso_id UUID,
  p_roles TEXT[]
)
RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_ya_inscritos INTEGER;
BEGIN
  -- Contar usuarios totales con esos roles
  SELECT COUNT(DISTINCT ur.user_id) INTO v_total
  FROM public.user_roles ur
  WHERE ur.role = ANY(p_roles)
    AND ur.is_active = TRUE;
  
  -- Contar cuántos ya están inscritos en el curso
  SELECT COUNT(*) INTO v_ya_inscritos
  FROM public.lms_inscripciones li
  JOIN public.user_roles ur ON ur.user_id = li.usuario_id
  WHERE li.curso_id = p_curso_id
    AND ur.role = ANY(p_roles)
    AND ur.is_active = TRUE;
  
  RETURN json_build_object(
    'total_usuarios', v_total,
    'ya_inscritos', v_ya_inscritos,
    'pendientes_inscribir', v_total - v_ya_inscritos
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Función para marcar inscripciones vencidas (para CRON job)
CREATE OR REPLACE FUNCTION public.lms_marcar_inscripciones_vencidas()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.lms_inscripciones 
  SET estado = 'vencido', updated_at = NOW()
  WHERE estado IN ('inscrito', 'en_progreso')
    AND fecha_limite < NOW()
    AND fecha_limite IS NOT NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Función para obtener cursos obligatorios pendientes de un usuario
CREATE OR REPLACE FUNCTION public.lms_get_onboarding_status(p_usuario_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  v_user_id := COALESCE(p_usuario_id, auth.uid());
  
  SELECT json_build_object(
    'total_obligatorios', COUNT(*) FILTER (WHERE li.tipo_inscripcion = 'obligatoria'),
    'completados', COUNT(*) FILTER (WHERE li.tipo_inscripcion = 'obligatoria' AND li.estado = 'completado'),
    'en_progreso', COUNT(*) FILTER (WHERE li.tipo_inscripcion = 'obligatoria' AND li.estado = 'en_progreso'),
    'pendientes', COUNT(*) FILTER (WHERE li.tipo_inscripcion = 'obligatoria' AND li.estado = 'inscrito'),
    'vencidos', COUNT(*) FILTER (WHERE li.tipo_inscripcion = 'obligatoria' AND li.estado = 'vencido'),
    'porcentaje_completado', CASE 
      WHEN COUNT(*) FILTER (WHERE li.tipo_inscripcion = 'obligatoria') = 0 THEN 100
      ELSE ROUND((COUNT(*) FILTER (WHERE li.tipo_inscripcion = 'obligatoria' AND li.estado = 'completado')::NUMERIC / 
                  COUNT(*) FILTER (WHERE li.tipo_inscripcion = 'obligatoria')::NUMERIC) * 100)
    END,
    'cursos', (
      SELECT json_agg(json_build_object(
        'inscripcion_id', li2.id,
        'curso_id', c.id,
        'titulo', c.titulo,
        'nivel', c.nivel,
        'duracion_estimada_min', c.duracion_estimada_min,
        'estado', li2.estado,
        'progreso_porcentaje', li2.progreso_porcentaje,
        'fecha_inscripcion', li2.fecha_inscripcion,
        'fecha_limite', li2.fecha_limite,
        'dias_restantes', EXTRACT(DAY FROM (li2.fecha_limite - NOW()))::INTEGER
      ) ORDER BY 
        CASE li2.estado 
          WHEN 'vencido' THEN 1 
          WHEN 'en_progreso' THEN 2 
          WHEN 'inscrito' THEN 3 
          ELSE 4 
        END,
        li2.fecha_limite ASC NULLS LAST
      )
      FROM public.lms_inscripciones li2
      JOIN public.lms_cursos c ON c.id = li2.curso_id
      WHERE li2.usuario_id = v_user_id
        AND li2.tipo_inscripcion = 'obligatoria'
        AND c.activo = TRUE
    )
  ) INTO v_result
  FROM public.lms_inscripciones li
  WHERE li.usuario_id = v_user_id;
  
  RETURN COALESCE(v_result, json_build_object(
    'total_obligatorios', 0,
    'completados', 0,
    'en_progreso', 0,
    'pendientes', 0,
    'vencidos', 0,
    'porcentaje_completado', 100,
    'cursos', '[]'::json
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;