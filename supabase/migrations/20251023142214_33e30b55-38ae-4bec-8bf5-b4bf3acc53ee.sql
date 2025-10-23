-- Limpiar funciones RPC duplicadas de validate_multiple_service_ids
-- Esta migración resuelve el error "column sc.is_test does not exist"

-- Eliminar TODAS las versiones existentes de la función
DROP FUNCTION IF EXISTS public.validate_multiple_service_ids(text[], boolean, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.validate_multiple_service_ids(text[], boolean) CASCADE;

-- Recrear SOLO la versión correcta (sin parámetro p_is_test)
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
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuario autenticado';
  END IF;

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
      ELSE EXISTS (
        SELECT 1 
        FROM public.user_permissions up
        WHERE up.user_id = v_user_id
          AND up.entity_type = 'servicio'
          AND up.entity_id = sc.id
          AND up.can_edit = true
      )
    END as has_permission
  FROM input_ids i
  LEFT JOIN public.servicios_custodia sc 
    ON sc.id_servicio = i.service_id;
END;
$$;

-- Asegurar permisos correctos
GRANT EXECUTE ON FUNCTION public.validate_multiple_service_ids(text[], boolean) 
TO anon, authenticated, service_role;

-- Comentario de documentación
COMMENT ON FUNCTION public.validate_multiple_service_ids IS 
'Valida múltiples IDs de servicio de forma masiva. Retorna información sobre existencia, estado finalizado y permisos del usuario.';
