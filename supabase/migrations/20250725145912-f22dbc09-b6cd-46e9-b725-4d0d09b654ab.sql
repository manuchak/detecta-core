-- Phase 3: Fix remaining 45 functions with search_path corrections
-- Being conservative to maintain existing functionality

-- Function: get_finalized_services_data_secure
CREATE OR REPLACE FUNCTION public.get_finalized_services_data_secure(start_date timestamp with time zone, end_date timestamp with time zone)
RETURNS TABLE(total_services bigint, total_gmv numeric, service_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_services,
    COALESCE(SUM(CASE WHEN cobro_cliente > 0 THEN cobro_cliente ELSE 0 END), 0) as total_gmv,
    COUNT(*)::bigint as service_count
  FROM servicios_custodia 
  WHERE fecha_hora_cita >= start_date 
    AND fecha_hora_cita <= end_date
    AND estado IN ('finalizado', 'Finalizado', 'completado', 'Completado');
END;
$function$;

-- Function: verificar_cumplimiento_referido
CREATE OR REPLACE FUNCTION public.verificar_cumplimiento_referido(p_referido_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  servicios_completados INTEGER;
  fecha_activacion TIMESTAMP WITH TIME ZONE;
  dias_permanencia INTEGER;
  config_record RECORD;
BEGIN
  -- Obtener configuración activa
  SELECT * INTO config_record 
  FROM configuracion_bonos_referidos 
  WHERE activo = true 
  LIMIT 1;
  
  IF config_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar servicios completados
  SELECT COUNT(*) INTO servicios_completados
  FROM servicios_custodia
  WHERE id_custodio = p_referido_id::text
    AND estado IN ('completado', 'Completado', 'finalizado', 'Finalizado');
  
  -- Verificar días de permanencia
  SELECT created_at INTO fecha_activacion
  FROM profiles
  WHERE id = p_referido_id;
  
  dias_permanencia := EXTRACT(DAY FROM now() - fecha_activacion);
  
  RETURN servicios_completados >= config_record.servicios_minimos_requeridos 
    AND dias_permanencia >= config_record.dias_minimos_permanencia;
END;
$function$;

-- Function: procesar_bono_referido
CREATE OR REPLACE FUNCTION public.procesar_bono_referido(p_referido_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  config_record RECORD;
  custodio_referidor_id UUID;
BEGIN
  -- Verificar si cumple requisitos
  IF NOT verificar_cumplimiento_referido(p_referido_id) THEN
    RETURN false;
  END IF;
  
  -- Obtener configuración
  SELECT * INTO config_record 
  FROM configuracion_bonos_referidos 
  WHERE activo = true 
  LIMIT 1;
  
  -- Obtener el custodio que refirió
  SELECT referido_por INTO custodio_referidor_id
  FROM referidos_custodios
  WHERE referido_id = p_referido_id
    AND bono_otorgado = false;
  
  IF custodio_referidor_id IS NOT NULL THEN
    -- Marcar bono como otorgado
    UPDATE referidos_custodios
    SET bono_otorgado = true,
        monto_bono = config_record.monto_bono,
        fecha_otorgamiento = now()
    WHERE referido_id = p_referido_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Function: get_custodio_referral_stats
CREATE OR REPLACE FUNCTION public.get_custodio_referral_stats(p_custodio_id UUID)
RETURNS TABLE(total_referidos INTEGER, referidos_activos INTEGER, bonos_ganados NUMERIC, ultimo_bono_fecha TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_referidos,
    COUNT(*) FILTER (WHERE bono_otorgado = true)::INTEGER as referidos_activos,
    COALESCE(SUM(monto_bono), 0) as bonos_ganados,
    MAX(fecha_otorgamiento) as ultimo_bono_fecha
  FROM referidos_custodios
  WHERE referido_por = p_custodio_id;
END;
$function$;

-- Function: get_custodio_referidos
CREATE OR REPLACE FUNCTION public.get_custodio_referidos(p_custodio_id UUID)
RETURNS TABLE(referido_id UUID, candidato_nombre TEXT, candidato_email TEXT, estado_referido TEXT, fecha_referencia TIMESTAMP WITH TIME ZONE, fecha_activacion TIMESTAMP WITH TIME ZONE, bono_otorgado BOOLEAN, monto_bono NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rc.referido_id,
    p.display_name as candidato_nombre,
    p.email as candidato_email,
    CASE 
      WHEN rc.bono_otorgado THEN 'activo'
      ELSE 'pendiente'
    END as estado_referido,
    rc.fecha_referencia,
    p.created_at as fecha_activacion,
    rc.bono_otorgado,
    rc.monto_bono
  FROM referidos_custodios rc
  JOIN profiles p ON rc.referido_id = p.id
  WHERE rc.referido_por = p_custodio_id
  ORDER BY rc.fecha_referencia DESC;
END;
$function$;

-- Function: check_pending_referral_bonuses
CREATE OR REPLACE FUNCTION public.check_pending_referral_bonuses()
RETURNS TABLE(custodio_id UUID, custodio_email TEXT, pending_bonuses INTEGER, total_amount NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH pending_bonuses_data AS (
    SELECT 
      rc.referido_por,
      COUNT(*) as pending_count,
      SUM(cbr.monto_bono) as total_amount
    FROM referidos_custodios rc
    JOIN configuracion_bonos_referidos cbr ON cbr.activo = true
    WHERE rc.bono_otorgado = false
      AND verificar_cumplimiento_referido(rc.referido_id) = true
    GROUP BY rc.referido_por
  )
  SELECT 
    pbd.referido_por as custodio_id,
    p.email as custodio_email,
    pbd.pending_count::INTEGER as pending_bonuses,
    pbd.total_amount
  FROM pending_bonuses_data pbd
  JOIN profiles p ON pbd.referido_por = p.id;
END;
$function$;

-- Function: transaction_crear_aprobacion_coordinador
CREATE OR REPLACE FUNCTION public.transaction_crear_aprobacion_coordinador(p_servicio_id UUID, p_coordinador_id UUID, p_estado_aprobacion TEXT, p_aprobacion_data JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  aprobacion_id UUID;
BEGIN
  -- Crear la aprobación
  INSERT INTO aprobacion_coordinador (
    servicio_id,
    coordinador_id,
    estado_aprobacion,
    observaciones,
    created_at
  ) VALUES (
    p_servicio_id,
    p_coordinador_id,
    p_estado_aprobacion,
    p_aprobacion_data->>'observaciones',
    now()
  ) RETURNING id INTO aprobacion_id;
  
  -- Actualizar estado del servicio si es necesario
  IF p_estado_aprobacion = 'aprobado' THEN
    UPDATE servicios_monitoreo
    SET estado = 'aprobado_coordinador'
    WHERE id = p_servicio_id;
  ELSIF p_estado_aprobacion = 'rechazado' THEN
    UPDATE servicios_monitoreo
    SET estado = 'rechazado_coordinador'
    WHERE id = p_servicio_id;
  END IF;
  
  RETURN aprobacion_id;
END;
$function$;

-- Function: update_role_permission_secure
CREATE OR REPLACE FUNCTION public.update_role_permission_secure(p_permission_id UUID, p_allowed BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar que el usuario es admin
  IF NOT is_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  UPDATE role_permissions
  SET allowed = p_allowed,
      updated_at = now()
  WHERE id = p_permission_id;
  
  RETURN FOUND;
END;
$function$;

-- Function: get_role_permissions_secure
CREATE OR REPLACE FUNCTION public.get_role_permissions_secure()
RETURNS TABLE(id UUID, role TEXT, permission_type TEXT, permission_id TEXT, allowed BOOLEAN, created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar permisos de admin
  IF NOT is_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    rp.id,
    rp.role,
    rp.permission_type,
    rp.permission_id,
    rp.allowed,
    rp.created_at,
    rp.updated_at
  FROM role_permissions rp
  ORDER BY rp.role, rp.permission_type, rp.permission_id;
END;
$function$;

-- Function: is_admin_bypass_rls
CREATE OR REPLACE FUNCTION public.is_admin_bypass_rls()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar email admin directamente
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'manager')
  );
END;
$function$;