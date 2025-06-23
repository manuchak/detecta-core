
-- Corrección de warnings de seguridad: Function Search Path Mutable
-- Agregar SET search_path TO 'public' a todas las funciones editables (corregido)

-- 1. Actualizar funciones en vehicleDataFunctions.sql
CREATE OR REPLACE FUNCTION public.get_marcas_vehiculos_safe()
RETURNS TABLE(
  id uuid,
  nombre text,
  pais_origen text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.id,
    mv.nombre,
    COALESCE(mv.pais_origen, 'No especificado') as pais_origen
  FROM public.marcas_vehiculos mv
  WHERE mv.activo = true
  ORDER BY mv.nombre ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_modelos_por_marca_safe(p_marca_nombre text)
RETURNS TABLE(
  id uuid,
  nombre text,
  tipo_vehiculo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mdv.id,
    mdv.nombre,
    COALESCE(mdv.tipo_vehiculo, 'No especificado') as tipo_vehiculo
  FROM public.modelos_vehiculos mdv
  JOIN public.marcas_vehiculos mv ON mdv.marca_id = mv.id
  WHERE mv.nombre = p_marca_nombre
    AND mdv.activo = true
    AND mv.activo = true
  ORDER BY mdv.nombre ASC;
END;
$$;

-- 2. Actualizar funciones críticas de forensic audit
CREATE OR REPLACE FUNCTION public.forensic_audit_servicios_enero_actual()
RETURNS TABLE(
  total_registros_raw bigint,
  registros_con_fecha_valida bigint,
  registros_enero_actual bigint,
  servicios_unicos_id bigint,
  registros_duplicados_id bigint,
  registros_sin_id bigint,
  estados_distintos bigint,
  servicios_finalizado_exact bigint,
  servicios_completado bigint,
  servicios_pendientes bigint,
  servicios_cancelados bigint,
  servicios_estado_null bigint,
  servicios_estado_vacio bigint,
  registros_con_cobro_valido bigint,
  registros_con_cobro_zero bigint,
  registros_con_cobro_null bigint,
  gmv_total_sin_filtros numeric,
  gmv_solo_finalizados numeric,
  gmv_solo_completados numeric,
  custodios_distintos bigint,
  registros_sin_custodio bigint,
  custodios_con_hash_na bigint,
  clientes_distintos bigint,
  registros_sin_cliente bigint,
  registros_con_origen bigint,
  registros_con_destino bigint,
  registros_con_ruta_completa bigint,
  fecha_mas_antigua timestamp with time zone,
  fecha_mas_reciente timestamp with time zone,
  registros_fuera_rango bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fecha_inicio DATE := '2025-01-01';
  fecha_fin DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  WITH base_analysis AS (
    SELECT 
      sc.*,
      CASE WHEN sc.fecha_hora_cita IS NOT NULL AND sc.fecha_hora_cita::date >= fecha_inicio AND sc.fecha_hora_cita::date <= fecha_fin THEN 1 ELSE 0 END as en_rango,
      CASE WHEN sc.id_servicio IS NOT NULL AND TRIM(sc.id_servicio) != '' THEN 1 ELSE 0 END as tiene_id,
      CASE WHEN sc.cobro_cliente IS NOT NULL AND sc.cobro_cliente > 0 THEN 1 ELSE 0 END as cobro_valido,
      CASE WHEN sc.nombre_custodio IS NOT NULL AND TRIM(sc.nombre_custodio) != '' AND sc.nombre_custodio != '#N/A' THEN 1 ELSE 0 END as custodio_valido,
      CASE WHEN sc.nombre_cliente IS NOT NULL AND TRIM(sc.nombre_cliente) != '' THEN 1 ELSE 0 END as cliente_valido,
      CASE WHEN sc.origen IS NOT NULL AND TRIM(sc.origen) != '' THEN 1 ELSE 0 END as origen_valido,
      CASE WHEN sc.destino IS NOT NULL AND TRIM(sc.destino) != '' THEN 1 ELSE 0 END as destino_valido
    FROM public.servicios_custodia sc
  ),
  filtered_data AS (
    SELECT * FROM base_analysis WHERE en_rango = 1
  ),
  estado_analysis AS (
    SELECT 
      estado,
      LOWER(TRIM(COALESCE(estado, ''))) as estado_clean,
      COUNT(*) as count
    FROM filtered_data
    GROUP BY estado, LOWER(TRIM(COALESCE(estado, '')))
  ),
  duplicates_analysis AS (
    SELECT 
      id_servicio,
      COUNT(*) as count
    FROM filtered_data
    WHERE tiene_id = 1
    GROUP BY id_servicio
    HAVING COUNT(*) > 1
  )
  SELECT 
    (SELECT COUNT(*) FROM public.servicios_custodia)::bigint as total_registros_raw,
    (SELECT COUNT(*) FROM base_analysis WHERE fecha_hora_cita IS NOT NULL)::bigint as registros_con_fecha_valida,
    (SELECT COUNT(*) FROM filtered_data)::bigint as registros_enero_actual,
    (SELECT COUNT(DISTINCT id_servicio) FROM filtered_data WHERE tiene_id = 1)::bigint as servicios_unicos_id,
    (SELECT COALESCE(SUM(count - 1), 0) FROM duplicates_analysis)::bigint as registros_duplicados_id,
    (SELECT COUNT(*) FROM filtered_data WHERE tiene_id = 0)::bigint as registros_sin_id,
    (SELECT COUNT(DISTINCT estado_clean) FROM estado_analysis WHERE estado_clean != '')::bigint as estados_distintos,
    (SELECT COALESCE(SUM(count), 0) FROM estado_analysis WHERE estado_clean = 'finalizado')::bigint as servicios_finalizado_exact,
    (SELECT COALESCE(SUM(count), 0) FROM estado_analysis WHERE estado_clean IN ('completado', 'finalizado'))::bigint as servicios_completado,
    (SELECT COALESCE(SUM(count), 0) FROM estado_analysis WHERE estado_clean LIKE '%pendiente%' OR estado_clean LIKE '%programado%')::bigint as servicios_pendientes,
    (SELECT COALESCE(SUM(count), 0) FROM estado_analysis WHERE estado_clean LIKE '%cancelado%')::bigint as servicios_cancelados,
    (SELECT COALESCE(SUM(count), 0) FROM estado_analysis WHERE estado IS NULL)::bigint as servicios_estado_null,
    (SELECT COALESCE(SUM(count), 0) FROM estado_analysis WHERE estado_clean = '')::bigint as servicios_estado_vacio,
    (SELECT COUNT(*) FROM filtered_data WHERE cobro_valido = 1)::bigint as registros_con_cobro_valido,
    (SELECT COUNT(*) FROM filtered_data WHERE cobro_cliente = 0)::bigint as registros_con_cobro_zero,
    (SELECT COUNT(*) FROM filtered_data WHERE cobro_cliente IS NULL)::bigint as registros_con_cobro_null,
    (SELECT COALESCE(SUM(DISTINCT_cobro.cobro_cliente), 0) 
     FROM (
       SELECT DISTINCT ON (id_servicio) id_servicio, cobro_cliente 
       FROM filtered_data 
       WHERE tiene_id = 1 AND cobro_valido = 1
     ) as DISTINCT_cobro)::numeric as gmv_total_sin_filtros,
    (SELECT COALESCE(SUM(DISTINCT_cobro.cobro_cliente), 0) 
     FROM (
       SELECT DISTINCT ON (id_servicio) id_servicio, cobro_cliente 
       FROM filtered_data 
       WHERE tiene_id = 1 AND cobro_valido = 1 AND LOWER(TRIM(COALESCE(estado, ''))) = 'finalizado'
     ) as DISTINCT_cobro)::numeric as gmv_solo_finalizados,
    (SELECT COALESCE(SUM(DISTINCT_cobro.cobro_cliente), 0) 
     FROM (
       SELECT DISTINCT ON (id_servicio) id_servicio, cobro_cliente 
       FROM filtered_data 
       WHERE tiene_id = 1 AND cobro_valido = 1 AND LOWER(TRIM(COALESCE(estado, ''))) IN ('completado', 'finalizado')
     ) as DISTINCT_cobro)::numeric as gmv_solo_completados,
    (SELECT COUNT(DISTINCT nombre_custodio) FROM filtered_data WHERE custodio_valido = 1)::bigint as custodios_distintos,
    (SELECT COUNT(*) FROM filtered_data WHERE custodio_valido = 0)::bigint as registros_sin_custodio,
    (SELECT COUNT(*) FROM filtered_data WHERE nombre_custodio = '#N/A')::bigint as custodios_con_hash_na,
    (SELECT COUNT(DISTINCT nombre_cliente) FROM filtered_data WHERE cliente_valido = 1)::bigint as clientes_distintos,
    (SELECT COUNT(*) FROM filtered_data WHERE cliente_valido = 0)::bigint as registros_sin_cliente,
    (SELECT COUNT(*) FROM filtered_data WHERE origen_valido = 1)::bigint as registros_con_origen,
    (SELECT COUNT(*) FROM filtered_data WHERE destino_valido = 1)::bigint as registros_con_destino,
    (SELECT COUNT(*) FROM filtered_data WHERE origen_valido = 1 AND destino_valido = 1)::bigint as registros_con_ruta_completa,
    (SELECT MIN(fecha_hora_cita) FROM filtered_data)::timestamp with time zone as fecha_mas_antigua,
    (SELECT MAX(fecha_hora_cita) FROM filtered_data)::timestamp with time zone as fecha_mas_reciente,
    (SELECT COUNT(*) FROM base_analysis WHERE fecha_hora_cita IS NOT NULL AND en_rango = 0)::bigint as registros_fuera_rango;
END;
$$;

-- 3. Actualizar funciones de comparación forense
CREATE OR REPLACE FUNCTION public.compare_dashboard_vs_forensic()
RETURNS TABLE(
  metric_name text,
  dashboard_value numeric,
  forensic_value numeric,
  discrepancy numeric,
  discrepancy_percent numeric,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  forensic_data RECORD;
  dashboard_gmv numeric;
  dashboard_services bigint;
BEGIN
  SELECT * INTO forensic_data FROM public.forensic_audit_servicios_enero_actual() LIMIT 1;
  
  SELECT total_gmv, total_services INTO dashboard_gmv, dashboard_services 
  FROM public.get_finalized_services_data_secure('2025-01-01'::timestamp with time zone, CURRENT_DATE::timestamp with time zone) 
  LIMIT 1;
  
  RETURN QUERY
  SELECT 
    'Total Servicios'::text as metric_name,
    dashboard_services::numeric as dashboard_value,
    forensic_data.registros_enero_actual::numeric as forensic_value,
    (forensic_data.registros_enero_actual - dashboard_services)::numeric as discrepancy,
    CASE WHEN dashboard_services > 0 THEN 
      ROUND(((forensic_data.registros_enero_actual - dashboard_services)::numeric / dashboard_services::numeric) * 100, 2)
    ELSE 0 END as discrepancy_percent,
    CASE WHEN ABS(forensic_data.registros_enero_actual - dashboard_services) > 100 THEN 'CRÍTICA' 
         WHEN ABS(forensic_data.registros_enero_actual - dashboard_services) > 10 THEN 'MEDIA'
         ELSE 'OK' END as status
         
  UNION ALL
  
  SELECT 
    'GMV Total'::text as metric_name,
    dashboard_gmv as dashboard_value,
    forensic_data.gmv_total_sin_filtros as forensic_value,
    (forensic_data.gmv_total_sin_filtros - dashboard_gmv)::numeric as discrepancy,
    CASE WHEN dashboard_gmv > 0 THEN 
      ROUND(((forensic_data.gmv_total_sin_filtros - dashboard_gmv) / dashboard_gmv) * 100, 2)
    ELSE 0 END as discrepancy_percent,
    CASE WHEN ABS(forensic_data.gmv_total_sin_filtros - dashboard_gmv) > 1000000 THEN 'CRÍTICA' 
         WHEN ABS(forensic_data.gmv_total_sin_filtros - dashboard_gmv) > 100000 THEN 'MEDIA'
         ELSE 'OK' END as status
         
  UNION ALL
  
  SELECT 
    'Servicios Únicos'::text as metric_name,
    dashboard_services::numeric as dashboard_value,
    forensic_data.servicios_unicos_id::numeric as forensic_value,
    (forensic_data.servicios_unicos_id - dashboard_services)::numeric as discrepancy,
    CASE WHEN dashboard_services > 0 THEN 
      ROUND(((forensic_data.servicios_unicos_id - dashboard_services)::numeric / dashboard_services::numeric) * 100, 2)
    ELSE 0 END as discrepancy_percent,
    CASE WHEN ABS(forensic_data.servicios_unicos_id - dashboard_services) > 50 THEN 'CRÍTICA' 
         WHEN ABS(forensic_data.servicios_unicos_id - dashboard_services) > 10 THEN 'MEDIA'
         ELSE 'OK' END as status;
END;
$$;

-- 4. Actualizar función de detección de patrones sospechosos (corregida)
CREATE OR REPLACE FUNCTION public.detect_suspicious_patterns()
RETURNS TABLE(
  pattern_type text,
  pattern_description text,
  count_found bigint,
  severity text,
  sample_data text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  -- Detectar servicios con cobros anómalos
  SELECT 
    'Cobros Anómalos'::text as pattern_type,
    'Servicios con cobros extremadamente altos (>100k)'::text as pattern_description,
    COUNT(*)::bigint as count_found,
    CASE WHEN COUNT(*) > 10 THEN 'ALTA' WHEN COUNT(*) > 0 THEN 'MEDIA' ELSE 'BAJA' END as severity,
    (SELECT STRING_AGG(id_servicio || ' ($' || cobro_cliente::text || ')', ', ')
     FROM (SELECT id_servicio, cobro_cliente 
           FROM public.servicios_custodia 
           WHERE cobro_cliente > 100000 AND fecha_hora_cita >= '2025-01-01'::timestamp with time zone 
           LIMIT 5) as limited_data) as sample_data
  FROM public.servicios_custodia
  WHERE cobro_cliente > 100000 
    AND fecha_hora_cita >= '2025-01-01'::timestamp with time zone
    
  UNION ALL
  
  -- Detectar duplicados exactos sospechosos
  SELECT 
    'Duplicados Exactos'::text as pattern_type,
    'Registros con ID duplicado exacto'::text as pattern_description,
    COUNT(*)::bigint as count_found,
    CASE WHEN COUNT(*) > 50 THEN 'ALTA' WHEN COUNT(*) > 10 THEN 'MEDIA' ELSE 'BAJA' END as severity,
    (SELECT STRING_AGG(id_servicio, ', ')
     FROM (SELECT DISTINCT id_servicio
           FROM public.servicios_custodia
           WHERE id_servicio IN (
             SELECT id_servicio 
             FROM public.servicios_custodia 
             WHERE fecha_hora_cita >= '2025-01-01'::timestamp with time zone
               AND id_servicio IS NOT NULL
             GROUP BY id_servicio 
             HAVING COUNT(*) > 1
           )
           LIMIT 5) as limited_data) as sample_data
  FROM public.servicios_custodia
  WHERE id_servicio IN (
    SELECT id_servicio 
    FROM public.servicios_custodia 
    WHERE fecha_hora_cita >= '2025-01-01'::timestamp with time zone
      AND id_servicio IS NOT NULL
    GROUP BY id_servicio 
    HAVING COUNT(*) > 1
  )
  
  UNION ALL
  
  -- Detectar custodios con actividad anómala
  SELECT 
    'Custodios Hiperactivos'::text as pattern_type,
    'Custodios con más de 200 servicios en el período'::text as pattern_description,
    COUNT(*)::bigint as count_found,
    CASE WHEN COUNT(*) > 5 THEN 'ALTA' WHEN COUNT(*) > 0 THEN 'MEDIA' ELSE 'BAJA' END as severity,
    (SELECT STRING_AGG(nombre_custodio || ' (' || service_count::text || ')', ', ')
     FROM (SELECT nombre_custodio, COUNT(*) as service_count
           FROM public.servicios_custodia
           WHERE fecha_hora_cita >= '2025-01-01'::timestamp with time zone
             AND nombre_custodio IS NOT NULL
             AND TRIM(nombre_custodio) != ''
             AND nombre_custodio != '#N/A'
           GROUP BY nombre_custodio
           HAVING COUNT(*) > 200
           LIMIT 3) as limited_data) as sample_data
  FROM (
    SELECT nombre_custodio
    FROM public.servicios_custodia
    WHERE fecha_hora_cita >= '2025-01-01'::timestamp with time zone
      AND nombre_custodio IS NOT NULL
      AND TRIM(nombre_custodio) != ''
      AND nombre_custodio != '#N/A'
    GROUP BY nombre_custodio
    HAVING COUNT(*) > 200
  ) custodio_stats
  
  UNION ALL
  
  -- Detectar fechas futuras sospechosas
  SELECT 
    'Fechas Futuras'::text as pattern_type,
    'Servicios programados en fechas muy lejanas'::text as pattern_description,
    COUNT(*)::bigint as count_found,
    CASE WHEN COUNT(*) > 100 THEN 'ALTA' WHEN COUNT(*) > 10 THEN 'MEDIA' ELSE 'BAJA' END as severity,
    (SELECT STRING_AGG(fecha_hora_cita::date::text, ', ')
     FROM (SELECT DISTINCT fecha_hora_cita
           FROM public.servicios_custodia
           WHERE fecha_hora_cita > CURRENT_DATE + INTERVAL '6 months'
           LIMIT 5) as limited_data) as sample_data
  FROM public.servicios_custodia
  WHERE fecha_hora_cita > CURRENT_DATE + INTERVAL '6 months';
END;
$$;

-- 5. Actualizar funciones críticas restantes
CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_uid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  found_role TEXT;
BEGIN
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

CREATE OR REPLACE FUNCTION public.is_admin_bypass_rls()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  user_email TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_role_permission_secure(
  p_permission_id UUID,
  p_allowed BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  user_email TEXT;
  is_admin_user BOOLEAN := false;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    is_admin_user := true;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = current_user_id AND role IN ('admin', 'owner')
    ) INTO is_admin_user;
  END IF;
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Sin permisos para actualizar permisos de roles';
  END IF;
  
  UPDATE public.role_permissions
  SET allowed = p_allowed,
      updated_at = now()
  WHERE id = p_permission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permiso no encontrado con ID: %', p_permission_id;
  END IF;
  
  RETURN true;
END;
$$;
