-- ============================================================================
-- FASE 1: Migración Sandbox - Funciones RPC v2 para Módulo Leads
-- ============================================================================
-- IMPORTANTE: Estas funciones NO modifican las existentes. Son versiones nuevas
-- con soporte para aislamiento Sandbox mediante el parámetro p_is_test
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. get_analyst_assigned_leads_v2
-- Nueva versión con filtro is_test para aislamiento Sandbox/Producción
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads_v2(
  p_is_test BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  lead_id text,
  lead_nombre text,
  lead_email text,
  lead_telefono text,
  lead_estado text,
  lead_fecha_creacion timestamp with time zone,
  approval_stage text,
  phone_interview_completed boolean,
  second_interview_required boolean,
  final_decision text,
  notas text,
  analista_nombre text,
  analista_email text,
  zona_preferida_id uuid,
  zona_nombre text,
  fecha_entrada_pool timestamp with time zone,
  motivo_pool text,
  interview_in_progress boolean,
  interview_started_at timestamp with time zone,
  has_successful_call boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  is_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Verificar si es admin
  is_admin := EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin')
  );
  
  RETURN QUERY
  SELECT 
    l.id::text as lead_id,
    l.nombre as lead_nombre,
    l.email as lead_email,
    l.telefono as lead_telefono,
    l.estado::text as lead_estado,
    l.fecha_creacion as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview')::text as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    l.notas::text as notas,
    p.display_name as analista_nombre,
    p.email as analista_email,
    l.zona_preferida_id,
    z.nombre as zona_nombre,
    l.fecha_entrada_pool,
    l.motivo_pool,
    COALESCE(l.interview_in_progress, false) as interview_in_progress,
    l.interview_started_at,
    EXISTS (
      SELECT 1 FROM manual_call_logs mcl
      WHERE mcl.lead_id = l.id 
        AND mcl.call_outcome = 'successful'
        AND mcl.is_test = p_is_test
    ) as has_successful_call
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  LEFT JOIN public.zonas_operacion_nacional z ON l.zona_preferida_id = z.id
  WHERE l.is_test = p_is_test  -- FILTRO CRÍTICO DE SANDBOX
    AND l.estado NOT IN ('rechazado')
    AND (
      (NOT is_admin AND l.asignado_a = current_user_id)
      OR (is_admin AND l.asignado_a IS NOT NULL)
    )
  ORDER BY l.fecha_creacion DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads_v2(BOOLEAN) TO authenticated;
COMMENT ON FUNCTION public.get_analyst_assigned_leads_v2 IS 'Versión Sandbox-aware - filtra leads por ambiente (is_test)';

-- ----------------------------------------------------------------------------
-- 2. Actualizar update_approval_process para validar ambiente
-- Agrega validación de que el lead pertenece al ambiente correcto
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_approval_process(
  p_lead_id text,
  p_stage text,
  p_interview_method text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_decision text DEFAULT NULL,
  p_decision_reason text DEFAULT NULL,
  p_is_test BOOLEAN DEFAULT FALSE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  lead_is_test boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- VALIDACIÓN DE AMBIENTE: Verificar que el lead pertenece al ambiente correcto
  SELECT is_test INTO lead_is_test
  FROM public.leads
  WHERE id = p_lead_id;
  
  IF lead_is_test IS NULL THEN
    RAISE EXCEPTION 'Lead no encontrado: %', p_lead_id;
  END IF;
  
  IF lead_is_test != p_is_test THEN
    RAISE EXCEPTION 'Intento de modificar lead de % desde ambiente %', 
      CASE WHEN lead_is_test THEN 'SANDBOX' ELSE 'PRODUCCIÓN' END,
      CASE WHEN p_is_test THEN 'SANDBOX' ELSE 'PRODUCCIÓN' END;
  END IF;
  
  -- Insertar o actualizar el registro del proceso de aprobación
  INSERT INTO public.lead_approval_process (
    lead_id,
    analyst_id,
    current_stage,
    interview_method,
    phone_interview_notes,
    final_decision,
    decision_reason,
    phone_interview_completed,
    second_interview_required,
    updated_at
  )
  VALUES (
    p_lead_id,
    current_user_id,
    p_stage,
    p_interview_method,
    p_notes,
    p_decision,
    p_decision_reason,
    CASE WHEN p_stage IN ('approved', 'rejected', 'second_interview') THEN true ELSE false END,
    CASE WHEN p_stage = 'second_interview' THEN true ELSE false END,
    now()
  )
  ON CONFLICT (lead_id)
  DO UPDATE SET
    analyst_id = current_user_id,
    current_stage = EXCLUDED.current_stage,
    interview_method = COALESCE(EXCLUDED.interview_method, lead_approval_process.interview_method),
    phone_interview_notes = COALESCE(EXCLUDED.phone_interview_notes, lead_approval_process.phone_interview_notes),
    final_decision = EXCLUDED.final_decision,
    decision_reason = COALESCE(EXCLUDED.decision_reason, lead_approval_process.decision_reason),
    phone_interview_completed = EXCLUDED.phone_interview_completed,
    second_interview_required = EXCLUDED.second_interview_required,
    updated_at = now();
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. check_zone_capacity_v2
-- Verifica capacidad de zona filtrando por ambiente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_zone_capacity_v2(
  p_zona_id uuid,
  p_is_test BOOLEAN DEFAULT FALSE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  capacidad_info jsonb;
  custodios_activos integer;
  capacidad_max integer;
  umbral integer;
BEGIN
  -- Obtener configuración de capacidad
  SELECT 
    capacidad_maxima,
    umbral_saturacion
  INTO capacidad_max, umbral
  FROM zona_capacity_management
  WHERE zona_id = p_zona_id AND activo = true
  LIMIT 1;
  
  IF capacidad_max IS NULL THEN
    capacidad_max := 10;
    umbral := 8;
  END IF;
  
  -- Contar custodios activos en esa zona (FILTRADO POR is_test)
  SELECT COUNT(DISTINCT l.id)::integer
  INTO custodios_activos
  FROM leads l
  WHERE l.zona_preferida_id = p_zona_id
    AND l.estado = 'aprobado'
    AND l.fecha_entrada_pool IS NULL
    AND l.is_test = p_is_test;
  
  -- Construir resultado
  capacidad_info := jsonb_build_object(
    'zona_id', p_zona_id,
    'capacidad_actual', custodios_activos,
    'capacidad_maxima', capacidad_max,
    'umbral_saturacion', umbral,
    'zona_saturada', custodios_activos >= umbral,
    'espacios_disponibles', capacidad_max - custodios_activos,
    'ambiente', CASE WHEN p_is_test THEN 'sandbox' ELSE 'produccion' END
  );
  
  RETURN capacidad_info;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_zone_capacity_v2(uuid, BOOLEAN) TO authenticated;
COMMENT ON FUNCTION public.check_zone_capacity_v2 IS 'Versión Sandbox-aware - verifica capacidad por ambiente';

-- ----------------------------------------------------------------------------
-- 4. move_lead_to_pool_v2
-- Mueve lead al pool con validación de ambiente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.move_lead_to_pool_v2(
  p_lead_id text,
  p_zona_id uuid,
  p_motivo text,
  p_is_test BOOLEAN DEFAULT FALSE
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lead_is_test boolean;
  affected_rows integer;
BEGIN
  -- VALIDAR que el lead pertenece al ambiente correcto
  SELECT is_test INTO lead_is_test
  FROM leads
  WHERE id = p_lead_id;
  
  IF lead_is_test IS NULL THEN
    RAISE EXCEPTION 'Lead no encontrado: %', p_lead_id;
  END IF;
  
  IF lead_is_test != p_is_test THEN
    RAISE EXCEPTION 'Intento de mover lead de % desde ambiente %',
      CASE WHEN lead_is_test THEN 'SANDBOX' ELSE 'PRODUCCIÓN' END,
      CASE WHEN p_is_test THEN 'SANDBOX' ELSE 'PRODUCCIÓN' END;
  END IF;
  
  -- Actualizar lead
  UPDATE leads
  SET 
    fecha_entrada_pool = now(),
    zona_preferida_id = p_zona_id,
    motivo_pool = p_motivo,
    updated_at = now()
  WHERE id = p_lead_id
    AND is_test = p_is_test;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN affected_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.move_lead_to_pool_v2(text, uuid, text, BOOLEAN) TO authenticated;
COMMENT ON FUNCTION public.move_lead_to_pool_v2 IS 'Versión Sandbox-aware - mueve lead al pool con validación de ambiente';

-- ----------------------------------------------------------------------------
-- 5. reactivate_lead_from_pool_v2
-- Reactiva lead desde pool con validación de ambiente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reactivate_lead_from_pool_v2(
  p_lead_id text,
  p_nuevo_estado text,
  p_is_test BOOLEAN DEFAULT FALSE
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lead_is_test boolean;
  affected_rows integer;
BEGIN
  -- VALIDAR que el lead pertenece al ambiente correcto
  SELECT is_test INTO lead_is_test
  FROM leads
  WHERE id = p_lead_id;
  
  IF lead_is_test IS NULL THEN
    RAISE EXCEPTION 'Lead no encontrado: %', p_lead_id;
  END IF;
  
  IF lead_is_test != p_is_test THEN
    RAISE EXCEPTION 'Intento de reactivar lead de % desde ambiente %',
      CASE WHEN lead_is_test THEN 'SANDBOX' ELSE 'PRODUCCIÓN' END,
      CASE WHEN p_is_test THEN 'SANDBOX' ELSE 'PRODUCCIÓN' END;
  END IF;
  
  -- Reactivar lead
  UPDATE leads
  SET 
    fecha_entrada_pool = NULL,
    motivo_pool = NULL,
    estado = p_nuevo_estado,
    updated_at = now()
  WHERE id = p_lead_id
    AND is_test = p_is_test;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN affected_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reactivate_lead_from_pool_v2(text, text, BOOLEAN) TO authenticated;
COMMENT ON FUNCTION public.reactivate_lead_from_pool_v2 IS 'Versión Sandbox-aware - reactiva lead desde pool con validación de ambiente';

-- ============================================================================
-- FIN DE MIGRACIÓN FASE 1
-- ============================================================================
-- Próximos pasos:
-- 1. Actualizar useSandboxAwareSupabase para mapear funciones _v2
-- 2. Migrar hooks de React (useLeadApprovals, usePoolReserva)
-- 3. Crear datos de prueba en Sandbox
-- 4. Testing exhaustivo
-- ============================================================================