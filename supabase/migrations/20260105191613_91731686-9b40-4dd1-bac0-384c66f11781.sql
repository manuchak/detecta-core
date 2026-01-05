-- Drop existing functions first to avoid return type conflict
DROP FUNCTION IF EXISTS public.archive_user_role_secure(uuid, text);
DROP FUNCTION IF EXISTS public.archive_user_role_secure(uuid);
DROP FUNCTION IF EXISTS public.reactivate_user_role_secure(uuid);

-- Recreate archive_user_role_secure with ORDER BY priority
CREATE OR REPLACE FUNCTION public.archive_user_role_secure(
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  result json;
BEGIN
  -- Get caller's role with priority ordering (most privileged first)
  SELECT role INTO caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() AND is_active = true
  ORDER BY 
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'supply_analyst' THEN 5
      WHEN 'recruiter' THEN 6
      WHEN 'custodio' THEN 7
      WHEN 'armado' THEN 8
      ELSE 99
    END
  LIMIT 1;
  
  -- Verify caller has admin permissions
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'owner', 'supply_admin') THEN
    RAISE EXCEPTION 'No tienes permisos para archivar usuarios';
  END IF;
  
  -- Prevent self-archiving
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes archivarte a ti mismo';
  END IF;
  
  -- Archive the user
  UPDATE public.user_roles
  SET 
    is_active = false,
    archived_at = now(),
    archived_by = auth.uid(),
    archive_reason = p_reason
  WHERE user_id = p_user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado o ya está archivado';
  END IF;
  
  SELECT json_build_object(
    'success', true,
    'message', 'Usuario archivado correctamente'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Recreate reactivate_user_role_secure with ORDER BY priority
CREATE OR REPLACE FUNCTION public.reactivate_user_role_secure(
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  result json;
BEGIN
  -- Get caller's role with priority ordering (most privileged first)
  SELECT role INTO caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() AND is_active = true
  ORDER BY 
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'supply_analyst' THEN 5
      WHEN 'recruiter' THEN 6
      WHEN 'custodio' THEN 7
      WHEN 'armado' THEN 8
      ELSE 99
    END
  LIMIT 1;
  
  -- Verify caller has admin permissions
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'owner', 'supply_admin') THEN
    RAISE EXCEPTION 'No tienes permisos para reactivar usuarios';
  END IF;
  
  -- Reactivate the user
  UPDATE public.user_roles
  SET 
    is_active = true,
    archived_at = NULL,
    archived_by = NULL,
    archive_reason = NULL
  WHERE user_id = p_user_id AND is_active = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado o ya está activo';
  END IF;
  
  SELECT json_build_object(
    'success', true,
    'message', 'Usuario reactivado correctamente'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.archive_user_role_secure(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_user_role_secure(uuid) TO authenticated;