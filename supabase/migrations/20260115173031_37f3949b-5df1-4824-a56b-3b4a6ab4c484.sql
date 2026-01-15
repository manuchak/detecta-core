-- =====================================================
-- TAREA 1: Homologar Roles entre RPC y Políticas RLS
-- =====================================================

-- 1.1 Actualizar puede_acceder_planeacion con roles unificados
CREATE OR REPLACE FUNCTION public.puede_acceder_planeacion()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN (
      'admin', 
      'owner', 
      'planificador', 
      'coordinador_operaciones',  -- AGREGADO: Coordinador debe ver planeación
      'supply_admin',             -- AGREGADO: Supply admin supervisa flujo
      'c4',                       -- Mantener: Centro de control
      'monitoreo'                 -- Mantener: Monitoreo operativo
    )
    AND is_active = true  -- Solo roles activos
  );
END;
$$;

-- 1.2 Actualizar get_custodios_activos_disponibles con roles unificados
CREATE OR REPLACE FUNCTION public.get_custodios_activos_disponibles()
RETURNS TABLE (
  id uuid,
  nombre text,
  telefono text,
  zona_base text,
  disponibilidad text,
  estado text,
  experiencia_seguridad boolean,
  vehiculo_propio boolean,
  numero_servicios integer,
  rating_promedio numeric,
  tasa_aceptacion numeric,
  tasa_respuesta numeric,
  tasa_confiabilidad numeric,
  score_comunicacion numeric,
  score_aceptacion numeric,
  score_confiabilidad numeric,
  score_total numeric,
  fuente text,
  fecha_ultimo_servicio timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- HOMOLOGADO: Mismos roles que puede_acceder_planeacion()
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN (
      'admin', 
      'owner', 
      'planificador',
      'coordinador_operaciones',
      'supply_admin',
      'c4',       -- AGREGADO: Centro de control puede consultar
      'monitoreo' -- AGREGADO: Monitoreo puede consultar
    )
    AND is_active = true  -- Solo roles activos
  ) THEN
    RAISE EXCEPTION 'Sin permisos para acceder a datos de custodios. Rol no autorizado.';
  END IF;

  -- Retornar custodios activos disponibles
  RETURN QUERY
  SELECT 
    co.id,
    co.nombre,
    co.telefono,
    co.zona_base,
    co.disponibilidad,
    co.estado,
    co.experiencia_seguridad,
    co.vehiculo_propio,
    co.numero_servicios,
    co.rating_promedio,
    co.tasa_aceptacion,
    co.tasa_respuesta,
    co.tasa_confiabilidad,
    co.score_comunicacion,
    co.score_aceptacion,
    co.score_confiabilidad,
    co.score_total,
    co.fuente,
    co.fecha_ultimo_servicio,
    co.created_at,
    co.updated_at
  FROM custodios_operativos co
  WHERE co.estado = 'activo'
    AND co.disponibilidad IN ('disponible', 'parcial');
END;
$$;

-- =====================================================
-- TAREA 2: Agregar Logging de Auditoría
-- =====================================================

-- 2.1 Función segura para registrar accesos a custodios desde frontend
CREATE OR REPLACE FUNCTION public.log_custodio_access_secure(
  p_accion text,
  p_entidad text DEFAULT 'custodios_operativos',
  p_entidad_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN; -- Silent fail for unauthenticated (shouldn't happen but safe)
  END IF;

  -- Get user's primary role for context
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = v_user_id AND is_active = true
  ORDER BY 
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'planificador' THEN 4
      WHEN 'coordinador_operaciones' THEN 5
      ELSE 10
    END
  LIMIT 1;

  -- Insert audit log with enriched payload
  INSERT INTO pc_audit_log (
    id,
    usuario_id,
    accion,
    entidad,
    entidad_id,
    timestamp,
    payload
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    p_accion,
    p_entidad,
    p_entidad_id,
    NOW(),
    p_payload || jsonb_build_object(
      'user_role', v_user_role,
      'source', 'frontend',
      'logged_at', NOW()
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Log to console but don't fail the operation
  RAISE WARNING 'Error logging custodio access: %', SQLERRM;
END;
$$;

-- 2.2 Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_custodio_access_secure(text, text, uuid, jsonb) TO authenticated;

-- 2.3 Add comment for documentation
COMMENT ON FUNCTION public.log_custodio_access_secure IS 
'Función segura para registrar accesos a custodios en pc_audit_log. 
Usada por frontend para auditar consultas de planeación.
Parámetros:
- p_accion: Tipo de acción (ej: CUSTODIO_CONSULTA, CUSTODIO_ASIGNACION)
- p_entidad: Tabla/recurso accedido
- p_entidad_id: ID del recurso (opcional)
- p_payload: Datos adicionales en JSON';