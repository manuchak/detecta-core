
-- Create a new role
CREATE OR REPLACE FUNCTION public.create_new_role(new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin or owner
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can create new roles';
  END IF;
  
  -- Check if the role already exists
  IF EXISTS (
    SELECT 1 FROM (
      SELECT DISTINCT role FROM user_roles
    ) AS roles
    WHERE role = new_role
  ) THEN
    RAISE EXCEPTION 'Role already exists';
  END IF;
  
  -- Insert a placeholder user_role entry to register the role
  -- We'll use a placeholder UUID that won't match any real user
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES ('00000000-0000-0000-0000-000000000000', new_role, auth.uid());
  
  -- Grant default permissions for the new role
  -- This could be customized based on your needs
  INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
  VALUES 
    (new_role, 'page', 'dashboard', true),
    (new_role, 'page', 'profile', true);
END;
$$;

-- Update a role name
CREATE OR REPLACE FUNCTION public.update_role_name(old_role TEXT, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin or owner
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can update role names';
  END IF;
  
  -- Prevent changes to system roles
  IF old_role IN ('owner', 'admin', 'unverified', 'pending') THEN
    RAISE EXCEPTION 'Cannot modify system roles';
  END IF;
  
  -- Check if the new role name already exists
  IF EXISTS (
    SELECT 1 FROM (
      SELECT DISTINCT role FROM user_roles
      WHERE role != old_role
    ) AS roles
    WHERE role = new_role
  ) THEN
    RAISE EXCEPTION 'Role name already exists';
  END IF;
  
  -- Update user_roles table
  UPDATE public.user_roles
  SET role = new_role
  WHERE role = old_role;
  
  -- Update role_permissions table
  UPDATE public.role_permissions
  SET role = new_role
  WHERE role = old_role;
END;
$$;

-- Delete a role
CREATE OR REPLACE FUNCTION public.delete_role(target_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin or owner
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can delete roles';
  END IF;
  
  -- Prevent deletion of system roles
  IF target_role IN ('owner', 'admin', 'unverified', 'pending') THEN
    RAISE EXCEPTION 'Cannot delete system roles';
  END IF;
  
  -- Check if there are users with this role
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE role = target_role
    AND user_id != '00000000-0000-0000-0000-000000000000'
  ) THEN
    RAISE EXCEPTION 'Cannot delete a role that is assigned to users';
  END IF;
  
  -- Delete the role from user_roles table (including placeholder entry)
  DELETE FROM public.user_roles
  WHERE role = target_role;
  
  -- Delete the role from role_permissions table
  DELETE FROM public.role_permissions
  WHERE role = target_role;
END;
$$;

-- Fixed get_user_role_safe function to resolve infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_uid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_role TEXT;
BEGIN
  -- Directly query user_roles without going through RLS
  SELECT role INTO found_role 
  FROM public.user_roles 
  WHERE user_id = user_uid
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'bi' THEN 4
      WHEN 'monitoring_supervisor' THEN 5
      WHEN 'monitoring' THEN 6
      WHEN 'supply' THEN 7
      WHEN 'soporte' THEN 8
      WHEN 'pending' THEN 9
      WHEN 'unverified' THEN 10
      ELSE 11
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;

-- Fixed get_user_roles_safe function to include all roles
CREATE OR REPLACE FUNCTION public.get_user_roles_safe()
RETURNS TABLE(role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
    SELECT DISTINCT ur.role
    FROM public.user_roles ur
    ORDER BY
      CASE ur.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'supply_admin' THEN 3
        WHEN 'bi' THEN 4
        WHEN 'monitoring_supervisor' THEN 5
        WHEN 'monitoring' THEN 6
        WHEN 'supply' THEN 7
        WHEN 'soporte' THEN 8
        WHEN 'pending' THEN 9
        WHEN 'unverified' THEN 10
        ELSE 11
      END;
END;
$$;

-- Create a secure function to get finalized services data avoiding RLS recursion
CREATE OR REPLACE FUNCTION public.get_finalized_services_data_secure(
  start_date timestamp with time zone,
  end_date timestamp with time zone
)
RETURNS TABLE(
  total_services bigint,
  total_gmv numeric,
  service_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH finalized_services AS (
    SELECT 
      sc.id_servicio,
      sc.cobro_cliente
    FROM public.servicios_custodia sc
    WHERE sc.estado = 'Finalizado'
      AND sc.fecha_hora_cita >= start_date
      AND sc.fecha_hora_cita <= end_date
      AND sc.id_servicio IS NOT NULL
      AND sc.cobro_cliente IS NOT NULL
  ),
  aggregated_data AS (
    SELECT 
      COUNT(DISTINCT fs.id_servicio) as unique_services,
      SUM(COALESCE(fs.cobro_cliente, 0)) as total_gmv,
      COUNT(*) as total_records
    FROM finalized_services fs
  )
  SELECT 
    ad.unique_services::bigint as total_services,
    ad.total_gmv::numeric as total_gmv,
    ad.total_records::bigint as service_count
  FROM aggregated_data ad;
END;
$$;

-- Función para verificar si un referido cumple los requisitos para bono
CREATE OR REPLACE FUNCTION public.verificar_cumplimiento_referido(p_referido_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referido RECORD;
  v_config RECORD;
  v_servicios_completados INTEGER;
  v_dias_activo INTEGER;
  v_fecha_activacion DATE;
BEGIN
  -- Obtener datos del referido
  SELECT * INTO v_referido FROM public.referidos WHERE id = p_referido_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Obtener configuración activa
  SELECT * INTO v_config 
  FROM public.configuracion_bonos_referidos 
  WHERE activo = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Si no está activado, no cumple
  IF v_referido.estado_referido != 'activado' THEN
    RETURN FALSE;
  END IF;

  -- Si ya tiene bono otorgado, no verificar de nuevo
  IF v_referido.bono_otorgado THEN
    RETURN TRUE;
  END IF;

  -- Calcular días desde activación
  v_fecha_activacion := v_referido.fecha_activacion::date;
  IF v_fecha_activacion IS NULL THEN
    RETURN FALSE;
  END IF;
  
  v_dias_activo := CURRENT_DATE - v_fecha_activacion;

  -- Verificar días mínimos
  IF v_dias_activo < v_config.dias_minimos_permanencia THEN
    RETURN FALSE;
  END IF;

  -- Contar servicios completados del custodio referido
  -- Buscar por nombre ya que el custodio_referente_id se usa como nombre
  SELECT COUNT(*) INTO v_servicios_completados
  FROM public.servicios_custodia sc
  WHERE sc.nombre_custodio = v_referido.custodio_referente_id
    AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('finalizado', 'completado')
    AND sc.fecha_hora_cita >= v_fecha_activacion::timestamp with time zone;

  -- Verificar servicios mínimos
  IF v_servicios_completados < v_config.servicios_minimos_requeridos THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- Función para procesar un bono de referido
CREATE OR REPLACE FUNCTION public.procesar_bono_referido(p_referido_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_config RECORD;
  v_referido RECORD;
BEGIN
  -- Verificar que cumple requisitos
  IF NOT public.verificar_cumplimiento_referido(p_referido_id) THEN
    RETURN FALSE;
  END IF;

  -- Obtener configuración y referido
  SELECT * INTO v_config 
  FROM public.configuracion_bonos_referidos 
  WHERE activo = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  SELECT * INTO v_referido FROM public.referidos WHERE id = p_referido_id;

  -- Actualizar el referido con el bono
  UPDATE public.referidos
  SET 
    bono_otorgado = true,
    monto_bono = v_config.monto_bono,
    fecha_pago_bono = now(),
    fecha_cumplimiento_requisitos = now(),
    updated_at = now()
  WHERE id = p_referido_id;

  RETURN TRUE;
END;
$$;

-- Función para obtener estadísticas de referidos para un custodio
CREATE OR REPLACE FUNCTION public.get_custodio_referral_stats(p_custodio_id UUID)
RETURNS TABLE(
  total_referidos INTEGER,
  referidos_activos INTEGER,
  bonos_ganados NUMERIC,
  ultimo_bono_fecha TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_referidos,
    COUNT(CASE WHEN r.estado_referido = 'activado' THEN 1 END)::INTEGER as referidos_activos,
    COALESCE(SUM(CASE WHEN r.bono_otorgado THEN r.monto_bono ELSE 0 END), 0) as bonos_ganados,
    MAX(r.fecha_pago_bono) as ultimo_bono_fecha
  FROM public.referidos r
  WHERE r.custodio_referente_id = p_custodio_id;
END;
$$;

-- Función para obtener lista de referidos de un custodio
CREATE OR REPLACE FUNCTION public.get_custodio_referidos(p_custodio_id UUID)
RETURNS TABLE(
  referido_id UUID,
  candidato_nombre TEXT,
  candidato_email TEXT,
  estado_referido TEXT,
  fecha_referencia TIMESTAMP WITH TIME ZONE,
  fecha_activacion TIMESTAMP WITH TIME ZONE,
  bono_otorgado BOOLEAN,
  monto_bono NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as referido_id,
    l.nombre as candidato_nombre,
    l.email as candidato_email,
    r.estado_referido,
    r.fecha_referencia,
    r.fecha_activacion,
    r.bono_otorgado,
    r.monto_bono
  FROM public.referidos r
  JOIN public.leads l ON l.id = r.candidato_referido_id
  WHERE r.custodio_referente_id = p_custodio_id
  ORDER BY r.fecha_referencia DESC;
END;
$$;

-- Función para notificar custodios sobre bonos disponibles
CREATE OR REPLACE FUNCTION public.check_pending_referral_bonuses()
RETURNS TABLE(
  custodio_id UUID,
  custodio_email TEXT,
  pending_bonuses INTEGER,
  total_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.custodio_referente_id as custodio_id,
    p.email as custodio_email,
    COUNT(*)::INTEGER as pending_bonuses,
    COALESCE(SUM(cb.monto_bono), 0) as total_amount
  FROM public.referidos r
  JOIN public.profiles p ON p.id = r.custodio_referente_id
  JOIN public.configuracion_bonos_referidos cb ON cb.activo = true
  WHERE r.estado_referido = 'activado' 
    AND NOT r.bono_otorgado
    AND public.verificar_cumplimiento_referido(r.id) = true
  GROUP BY r.custodio_referente_id, p.email;
END;
$$;
