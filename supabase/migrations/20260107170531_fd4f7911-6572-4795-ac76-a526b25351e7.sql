-- Add archive columns to lms_cursos
ALTER TABLE lms_cursos 
ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS archived_by uuid NULL REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS archive_reason text NULL;

COMMENT ON COLUMN lms_cursos.archived_at IS 'Fecha y hora en que se archivó el curso';
COMMENT ON COLUMN lms_cursos.archived_by IS 'Usuario que archivó el curso';
COMMENT ON COLUMN lms_cursos.archive_reason IS 'Razón del archivado';

-- Create index for filtering archived courses
CREATE INDEX IF NOT EXISTS idx_lms_cursos_archived ON lms_cursos(archived_at) WHERE archived_at IS NOT NULL;

-- RPC: Archive a course securely
CREATE OR REPLACE FUNCTION lms_archive_curso_secure(
  p_curso_id uuid,
  p_reason text DEFAULT NULL
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

  -- Check if user is admin
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
    RETURN jsonb_build_object('success', false, 'error', 'Sin permisos para archivar cursos');
  END IF;

  -- Check if course exists and get title
  SELECT titulo INTO v_curso_titulo
  FROM lms_cursos
  WHERE id = p_curso_id;

  IF v_curso_titulo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Curso no encontrado');
  END IF;

  -- Check if already archived
  IF EXISTS (SELECT 1 FROM lms_cursos WHERE id = p_curso_id AND archived_at IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'El curso ya está archivado');
  END IF;

  -- Count inscriptions for info
  SELECT COUNT(*) INTO v_inscripciones_count
  FROM lms_inscripciones
  WHERE curso_id = p_curso_id;

  -- Archive the course
  UPDATE lms_cursos
  SET 
    archived_at = now(),
    archived_by = v_user_id,
    archive_reason = p_reason,
    publicado = false,
    updated_at = now()
  WHERE id = p_curso_id;

  RETURN jsonb_build_object(
    'success', true,
    'curso_id', p_curso_id,
    'titulo', v_curso_titulo,
    'inscripciones_preservadas', v_inscripciones_count
  );
END;
$$;

-- RPC: Reactivate an archived course
CREATE OR REPLACE FUNCTION lms_reactivate_curso_secure(
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
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Check if user is admin
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
    RETURN jsonb_build_object('success', false, 'error', 'Sin permisos para reactivar cursos');
  END IF;

  -- Check if course exists and is archived
  SELECT titulo INTO v_curso_titulo
  FROM lms_cursos
  WHERE id = p_curso_id AND archived_at IS NOT NULL;

  IF v_curso_titulo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Curso no encontrado o no está archivado');
  END IF;

  -- Reactivate the course (keep unpublished)
  UPDATE lms_cursos
  SET 
    archived_at = NULL,
    archived_by = NULL,
    archive_reason = NULL,
    publicado = false,
    updated_at = now()
  WHERE id = p_curso_id;

  RETURN jsonb_build_object(
    'success', true,
    'curso_id', p_curso_id,
    'titulo', v_curso_titulo,
    'message', 'Curso reactivado. Recuerda publicarlo cuando esté listo.'
  );
END;
$$;

-- RPC: Delete course (only if no inscriptions)
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

  -- Check if user is admin
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

  -- Check for inscriptions
  SELECT COUNT(*) INTO v_inscripciones_count
  FROM lms_inscripciones
  WHERE curso_id = p_curso_id;

  IF v_inscripciones_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'No se puede eliminar un curso con inscripciones. Usa "Archivar" en su lugar.',
      'inscripciones', v_inscripciones_count
    );
  END IF;

  -- Delete related data first (modules, contents, etc.)
  DELETE FROM lms_contenidos WHERE modulo_id IN (SELECT id FROM lms_modulos WHERE curso_id = p_curso_id);
  DELETE FROM lms_modulos WHERE curso_id = p_curso_id;
  DELETE FROM lms_cursos WHERE id = p_curso_id;

  RETURN jsonb_build_object(
    'success', true,
    'curso_id', p_curso_id,
    'titulo', v_curso_titulo
  );
END;
$$;