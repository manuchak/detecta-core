-- Corregir función validate_multiple_service_ids para usar solo servicios_custodia
-- La tabla servicios_finalizados no existe, los finalizados tienen estado = 'Finalizado'
-- Usar comillas para palabras reservadas SQL

CREATE OR REPLACE FUNCTION public.validate_multiple_service_ids(
  p_service_ids text[],
  p_exclude_finished boolean DEFAULT true,
  p_is_test boolean DEFAULT false
)
RETURNS TABLE(
  id_servicio text,
  "exists" boolean,
  is_finished boolean,
  has_permission boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
SET statement_timeout = '10s'
AS $$
BEGIN
  -- Validación batch optimizada usando LEFT JOIN en lugar de FOREACH
  RETURN QUERY
  WITH input_ids AS (
    SELECT DISTINCT unnest(p_service_ids) as service_id
  ),
  service_check AS (
    SELECT 
      i.service_id,
      sc.id_servicio,
      sc.estado,
      CASE 
        WHEN sc.id_servicio IS NULL THEN false
        ELSE true
      END as exists_check,
      CASE 
        WHEN sc.estado = 'Finalizado' THEN true
        ELSE false
      END as finished_check
    FROM input_ids i
    LEFT JOIN public.servicios_custodia sc 
      ON sc.id_servicio = i.service_id 
      AND sc.is_test = p_is_test
  )
  SELECT 
    service_id::text as id_servicio,
    exists_check as "exists",
    finished_check as is_finished,
    true as has_permission
  FROM service_check
  ORDER BY service_id;
END;
$$;