-- Función RPC segura para obtener resultados de calibración SIERCP
-- Solo usuarios admin/owner/supply_admin pueden invocarla

CREATE OR REPLACE FUNCTION public.get_siercp_calibration_results()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  global_score integer,
  dimension_scores jsonb,
  dimension_percentiles jsonb,
  risk_flags text[],
  clinical_interpretation text,
  recommendations text[],
  raw_responses jsonb,
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
  -- Obtener el rol del usuario actual
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Verificar permisos
  IF user_role IS NULL OR user_role NOT IN ('admin', 'owner', 'supply_admin') THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol admin, owner o supply_admin';
  END IF;

  -- Retornar resultados con información del perfil
  RETURN QUERY
  SELECT 
    sr.id,
    sr.user_id,
    sr.global_score,
    sr.dimension_scores,
    sr.dimension_percentiles,
    sr.risk_flags,
    sr.clinical_interpretation,
    sr.recommendations,
    sr.raw_responses,
    sr.completed_at,
    sr.created_at,
    p.display_name,
    p.email
  FROM siercp_results sr
  LEFT JOIN profiles p ON p.id = sr.user_id
  ORDER BY sr.completed_at DESC;
END;
$$;

-- Revocar acceso público y otorgar solo a authenticated
REVOKE ALL ON FUNCTION public.get_siercp_calibration_results() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_siercp_calibration_results() TO authenticated;

COMMENT ON FUNCTION public.get_siercp_calibration_results() IS 'Obtiene resultados SIERCP para calibración interna. Solo admin/owner/supply_admin.';