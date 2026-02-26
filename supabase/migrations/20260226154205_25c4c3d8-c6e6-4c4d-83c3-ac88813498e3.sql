
CREATE OR REPLACE FUNCTION lms_delete_curso_secure(
  p_curso_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_curso_titulo text;
  v_inscripciones_count int;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Check if user is admin/owner
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = v_user_id AND is_active = true
  ORDER BY 
    CASE role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      ELSE 3 
    END
  LIMIT 1;

  IF v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sin permisos para eliminar cursos');
  END IF;

  -- Check if course exists
  SELECT titulo INTO v_curso_titulo
  FROM lms_cursos
  WHERE id = p_curso_id;

  IF v_curso_titulo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Curso no encontrado');
  END IF;

  -- Count inscriptions for info
  SELECT COUNT(*) INTO v_inscripciones_count
  FROM lms_inscripciones
  WHERE curso_id = p_curso_id;

  -- Delete related data in order (cascading manually)
  -- 1. Delete quiz answers
  DELETE FROM lms_respuestas_quiz
  WHERE pregunta_id IN (
    SELECT p.id FROM lms_preguntas_quiz p
    JOIN lms_contenidos c ON p.contenido_id = c.id
    JOIN lms_modulos m ON c.modulo_id = m.id
    WHERE m.curso_id = p_curso_id
  );

  -- 2. Delete quiz questions
  DELETE FROM lms_preguntas_quiz
  WHERE contenido_id IN (
    SELECT c.id FROM lms_contenidos c
    JOIN lms_modulos m ON c.modulo_id = m.id
    WHERE m.curso_id = p_curso_id
  );

  -- 3. Delete progress records
  DELETE FROM lms_progreso
  WHERE contenido_id IN (
    SELECT c.id FROM lms_contenidos c
    JOIN lms_modulos m ON c.modulo_id = m.id
    WHERE m.curso_id = p_curso_id
  );

  -- 4. Delete content
  DELETE FROM lms_contenidos
  WHERE modulo_id IN (
    SELECT id FROM lms_modulos WHERE curso_id = p_curso_id
  );

  -- 5. Delete modules
  DELETE FROM lms_modulos
  WHERE curso_id = p_curso_id;

  -- 6. Delete inscriptions
  DELETE FROM lms_inscripciones
  WHERE curso_id = p_curso_id;

  -- 7. Delete certificates
  DELETE FROM lms_certificados
  WHERE curso_id = p_curso_id;

  -- 8. Delete points history referencing this course
  DELETE FROM lms_puntos_historial
  WHERE referencia_id = p_curso_id::text AND referencia_tipo = 'curso';

  -- 9. Finally delete the course
  DELETE FROM lms_cursos
  WHERE id = p_curso_id;

  RETURN jsonb_build_object(
    'success', true, 
    'titulo', v_curso_titulo,
    'inscripciones_eliminadas', v_inscripciones_count
  );
END;
$$;
