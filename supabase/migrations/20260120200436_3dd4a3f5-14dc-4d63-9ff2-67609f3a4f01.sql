-- Agregar columna ai_report a siercp_results para almacenar el análisis de IA
ALTER TABLE public.siercp_results 
ADD COLUMN IF NOT EXISTS ai_report jsonb DEFAULT NULL;

-- Comentario para documentación
COMMENT ON COLUMN public.siercp_results.ai_report IS 
  'Análisis generado por IA (fit_custodio, factores_riesgo, recomendaciones, etc.). Se genera una sola vez al completar la evaluación.';

-- Actualizar RPC get_siercp_result_by_id para incluir ai_report
DROP FUNCTION IF EXISTS public.get_siercp_result_by_id(uuid);

CREATE OR REPLACE FUNCTION public.get_siercp_result_by_id(p_result_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  global_score numeric,
  scores jsonb,
  percentiles jsonb,
  risk_flags text[],
  clinical_interpretation text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone,
  display_name text,
  email text,
  phone text,
  ai_report jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role text;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  
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
    p.phone,
    sr.ai_report
  FROM public.siercp_results sr
  LEFT JOIN public.profiles p ON p.id = sr.user_id
  WHERE sr.id = p_result_id
    AND (
      v_role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
      OR sr.user_id = v_user_id
    );
END;
$$;

-- Actualizar RPC get_siercp_calibration_results para incluir ai_report
DROP FUNCTION IF EXISTS public.get_siercp_calibration_results();

CREATE OR REPLACE FUNCTION public.get_siercp_calibration_results()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  global_score numeric,
  scores jsonb,
  percentiles jsonb,
  risk_flags text[],
  clinical_interpretation text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone,
  display_name text,
  email text,
  ai_report jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.get_current_user_role_secure();
  
  IF v_role NOT IN ('admin', 'owner', 'supply_admin') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  
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
    sr.ai_report
  FROM public.siercp_results sr
  LEFT JOIN public.profiles p ON p.id = sr.user_id
  ORDER BY sr.completed_at DESC;
END;
$$;