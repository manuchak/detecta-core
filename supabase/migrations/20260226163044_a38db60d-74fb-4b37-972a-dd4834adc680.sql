CREATE OR REPLACE FUNCTION lms_delete_curso_secure(p_curso_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_curso_titulo text;
  v_inscripciones_count int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = v_user_id AND is_active = true
  ORDER BY CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
  LIMIT 1;

  IF v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sin permisos');
  END IF;

  SELECT titulo INTO v_curso_titulo FROM lms_cursos WHERE id = p_curso_id;
  IF v_curso_titulo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Curso no encontrado');
  END IF;

  SELECT COUNT(*) INTO v_inscripciones_count FROM lms_inscripciones WHERE curso_id = p_curso_id;

  DELETE FROM lms_preguntas WHERE curso_id = p_curso_id;

  DELETE FROM lms_progreso WHERE contenido_id IN (
    SELECT c.id FROM lms_contenidos c
    JOIN lms_modulos m ON c.modulo_id = m.id
    WHERE m.curso_id = p_curso_id
  );

  DELETE FROM lms_contenidos WHERE modulo_id IN (
    SELECT id FROM lms_modulos WHERE curso_id = p_curso_id
  );

  DELETE FROM lms_modulos WHERE curso_id = p_curso_id;

  DELETE FROM lms_inscripciones WHERE curso_id = p_curso_id;

  DELETE FROM lms_certificados WHERE curso_id = p_curso_id;

  DELETE FROM lms_puntos_historial
  WHERE referencia_id = p_curso_id::text AND referencia_tipo = 'curso';

  DELETE FROM lms_cursos WHERE id = p_curso_id;

  RETURN jsonb_build_object(
    'success', true,
    'titulo', v_curso_titulo,
    'inscripciones_eliminadas', v_inscripciones_count
  );
END;
$$;