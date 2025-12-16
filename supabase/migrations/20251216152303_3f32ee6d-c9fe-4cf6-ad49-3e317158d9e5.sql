-- RPC para obtener contadores de leads por estado de forma eficiente
CREATE OR REPLACE FUNCTION get_leads_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'approved', COUNT(*) FILTER (WHERE estado = 'aprobado'),
    'pending', COUNT(*) FILTER (WHERE estado NOT IN ('aprobado', 'rechazado') OR estado IS NULL),
    'rejected', COUNT(*) FILTER (WHERE estado = 'rechazado'),
    'uncontacted', COUNT(*) FILTER (WHERE fecha_contacto IS NULL)
  ) INTO result
  FROM leads;
  
  RETURN result;
END;
$$;