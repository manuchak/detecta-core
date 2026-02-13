CREATE OR REPLACE FUNCTION public.get_leads_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  cutoff timestamptz := now() - interval '30 days';
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'approved', COUNT(*) FILTER (WHERE estado = 'aprobado'),
    'pending', COUNT(*) FILTER (WHERE estado NOT IN ('aprobado', 'rechazado', 'inactivo', 'custodio_activo') OR estado IS NULL),
    'rejected', COUNT(*) FILTER (WHERE estado = 'rechazado'),
    'uncontacted', COUNT(*) FILTER (WHERE asignado_a IS NULL AND estado NOT IN ('rechazado', 'inactivo', 'custodio_activo'))
  ) INTO result
  FROM leads
  WHERE updated_at >= cutoff;

  RETURN result;
END;
$$;