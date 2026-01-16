-- Primero eliminar la función existente porque cambia la firma de retorno
DROP FUNCTION IF EXISTS public.get_siercp_calibration_results();

-- Crear función con columnas CORRECTAS que existen en siercp_results
CREATE OR REPLACE FUNCTION public.get_siercp_calibration_results()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  global_score numeric,
  scores jsonb,
  percentiles jsonb,
  risk_flags text[],
  clinical_interpretation text,
  completed_at timestamptz,
  created_at timestamptz,
  display_name text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Usar la función segura existente para obtener el rol
  SELECT public.get_current_user_role_secure() INTO user_role;

  -- Verificar permisos
  IF user_role IS NULL OR user_role NOT IN ('admin', 'owner', 'supply_admin') THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol admin, owner o supply_admin';
  END IF;

  -- Retornar resultados con información del perfil (columnas correctas)
  RETURN QUERY
  SELECT 
    sr.id,
    sr.user_id,
    sr.global_score,
    sr.scores,
    sr.percentiles,
    sr.risk_flags,
    sr.clinical_interpretation,
    sr.completed_at,
    sr.created_at,
    p.display_name,
    p.email
  FROM siercp_results sr
  LEFT JOIN profiles p ON p.id = sr.user_id
  ORDER BY sr.completed_at DESC;
END;
$$;

-- Mantener permisos
REVOKE ALL ON FUNCTION public.get_siercp_calibration_results() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_siercp_calibration_results() TO authenticated;