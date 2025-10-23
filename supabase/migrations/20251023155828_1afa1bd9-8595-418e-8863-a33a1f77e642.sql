-- Corregir función RPC para NO depender de tabla user_permissions
-- Simplificar has_permission para evitar errores de tabla inexistente
CREATE OR REPLACE FUNCTION public.validate_multiple_service_ids(
  p_service_ids text[],
  p_exclude_finished boolean DEFAULT true
)
RETURNS TABLE(
  id_servicio text,
  record_exists boolean,
  is_finished boolean,
  has_permission boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout TO '30s'
AS $$
BEGIN
  -- Para importaciones masivas, solo validamos existencia de IDs
  -- has_permission simplificado: true si existe el registro (no requiere tabla user_permissions)
  
  RETURN QUERY
  WITH input_ids AS (
    SELECT unnest(p_service_ids) as service_id
  )
  SELECT 
    i.service_id::text as id_servicio,
    (sc.id_servicio IS NOT NULL) as record_exists,
    CASE 
      WHEN sc.id_servicio IS NULL THEN false
      WHEN p_exclude_finished THEN (sc.estado = 'Finalizado')
      ELSE false
    END as is_finished,
    CASE 
      WHEN sc.id_servicio IS NULL THEN false
      ELSE true
    END as has_permission
  FROM input_ids i
  LEFT JOIN public.servicios_custodia sc 
    ON sc.id_servicio = i.service_id;
END;
$$;