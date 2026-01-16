-- Fix role verification in get_custodios_activos_disponibles
-- The previous version incorrectly tried to read 'role' from profiles table
-- Roles are stored in user_roles table, accessed via get_current_user_role_secure()

DROP FUNCTION IF EXISTS public.get_custodios_activos_disponibles();

CREATE FUNCTION public.get_custodios_activos_disponibles()
RETURNS TABLE (
  id uuid,
  nombre text,
  telefono text,
  email text,
  zona_base text,
  disponibilidad text,
  estado text,
  experiencia_seguridad boolean,
  vehiculo_propio boolean,
  certificaciones text[],
  numero_servicios integer,
  rating_promedio numeric,
  tasa_aceptacion numeric,
  tasa_respuesta numeric,
  tasa_confiabilidad numeric,
  score_comunicacion numeric,
  score_aceptacion numeric,
  score_confiabilidad numeric,
  score_total numeric,
  lat numeric,
  lng numeric,
  fuente text,
  fecha_ultimo_servicio timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  pc_custodio_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Use the correct secure function to get role from user_roles table
  SELECT public.get_current_user_role_secure() INTO user_role;

  -- Expanded role list per unified planning access matrix
  IF user_role NOT IN ('admin', 'owner', 'supply_admin', 'supply_lead', 
                        'planificador', 'coordinador_operaciones', 'c4', 'monitoreo') THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to view custodians';
  END IF;

  RETURN QUERY
  SELECT 
    co.id,
    co.nombre,
    co.telefono,
    co.email,
    co.zona_base,
    co.disponibilidad,
    co.estado,
    co.experiencia_seguridad,
    co.vehiculo_propio,
    co.certificaciones,
    co.numero_servicios,
    co.rating_promedio,
    co.tasa_aceptacion,
    co.tasa_respuesta,
    co.tasa_confiabilidad,
    co.score_comunicacion,
    co.score_aceptacion,
    co.score_confiabilidad,
    co.score_total,
    co.lat,
    co.lng,
    co.fuente,
    co.fecha_ultimo_servicio,
    co.created_at,
    co.updated_at,
    co.pc_custodio_id
  FROM custodios_operativos co
  WHERE co.estado = 'activo'
    AND co.disponibilidad IN ('disponible', 'parcial');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_custodios_activos_disponibles() TO authenticated;