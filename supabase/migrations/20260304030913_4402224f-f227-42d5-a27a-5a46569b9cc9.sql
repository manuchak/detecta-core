
-- Recreate 3 RPCs with expanded role access (these were in the failed first migration)
CREATE OR REPLACE FUNCTION public.lms_archive_curso_secure(p_curso_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_has_role boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id
      AND role IN ('owner', 'admin', 'supply_admin', 'capacitacion_admin')
      AND is_active = true
  ) INTO v_has_role;

  IF NOT v_has_role THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permisos para archivar cursos');
  END IF;

  UPDATE public.lms_cursos
  SET estado = 'archivado', updated_at = now()
  WHERE id = p_curso_id AND estado != 'archivado';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Curso no encontrado o ya archivado');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_delete_curso_secure(p_curso_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_has_role boolean;
  v_estado text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id
      AND role IN ('owner', 'admin', 'supply_admin', 'capacitacion_admin')
      AND is_active = true
  ) INTO v_has_role;

  IF NOT v_has_role THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permisos para eliminar cursos');
  END IF;

  SELECT estado INTO v_estado FROM public.lms_cursos WHERE id = p_curso_id;
  IF v_estado IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Curso no encontrado');
  END IF;
  IF v_estado != 'borrador' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo se pueden eliminar cursos en borrador');
  END IF;

  DELETE FROM public.lms_cursos WHERE id = p_curso_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_reactivate_curso_secure(p_curso_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_has_role boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id
      AND role IN ('owner', 'admin', 'supply_admin', 'capacitacion_admin')
      AND is_active = true
  ) INTO v_has_role;

  IF NOT v_has_role THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes permisos para reactivar cursos');
  END IF;

  UPDATE public.lms_cursos
  SET estado = 'borrador', updated_at = now()
  WHERE id = p_curso_id AND estado = 'archivado';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Curso no encontrado o no está archivado');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
