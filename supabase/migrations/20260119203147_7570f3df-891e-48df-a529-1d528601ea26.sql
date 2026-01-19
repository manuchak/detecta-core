-- RPC segura para obtener un resultado SIERCP por ID
-- Permite a admins ver cualquier resultado y a usuarios ver sus propios resultados

CREATE OR REPLACE FUNCTION public.get_siercp_result_by_id(p_result_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  global_score integer,
  scores jsonb,
  percentiles jsonb,
  risk_flags text[],
  clinical_interpretation text,
  completed_at timestamptz,
  created_at timestamptz,
  display_name text,
  email text,
  phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_user_id uuid;
BEGIN
  -- Obtener el usuario actual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  
  -- Obtener rol del usuario usando función segura
  v_role := public.get_current_user_role_secure();
  
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
    p.email,
    p.phone
  FROM public.siercp_results sr
  LEFT JOIN public.profiles p ON p.id = sr.user_id
  WHERE sr.id = p_result_id
    AND (
      -- Admins pueden ver cualquier resultado
      v_role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
      OR
      -- Usuarios pueden ver sus propios resultados
      sr.user_id = v_user_id
    );
END;
$$;

-- Revocar acceso público y dar solo a autenticados
REVOKE ALL ON FUNCTION public.get_siercp_result_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_siercp_result_by_id(uuid) TO authenticated;