-- Corregir RPC check_duplicate_service_ids: cast TEXT → TIMESTAMPTZ
CREATE OR REPLACE FUNCTION check_duplicate_service_ids()
RETURNS TABLE(
  id_servicio TEXT,
  duplicate_count BIGINT,
  service_ids BIGINT[],
  latest_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id_servicio::TEXT,
    COUNT(*)::BIGINT as duplicate_count,
    array_agg(sc.id ORDER BY sc.created_at DESC)::BIGINT[] as service_ids,
    MAX(sc.created_at::TIMESTAMP WITH TIME ZONE) as latest_date
  FROM public.servicios_custodia sc
  WHERE sc.id_servicio IS NOT NULL
  GROUP BY sc.id_servicio
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, MAX(sc.created_at::TIMESTAMP WITH TIME ZONE) DESC;
END;
$$;

-- Refrescar caché de PostgREST
NOTIFY pgrst, 'reload schema';