-- Phase 1 (Final Batch 5/5): Completing structural fixes for remaining functions
-- Adding SECURITY DEFINER and SET search_path TO 'public' for security compliance

-- Fix get_weekly_leaderboard function
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
 RETURNS TABLE(custodio_id text, nombre_custodio text, total_viajes integer, km_totales numeric, puntos integer, posicion integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH leaderboard AS (
        SELECT
            s.id_custodio,
            s.nombre_custodio,
            COUNT(*)::integer AS total_viajes,
            COALESCE(SUM(s.km_recorridos), 0) AS km_totales,
            COALESCE(SUM(public.calcular_puntos_viaje(s.km_recorridos, s.estado)), 0)::integer AS puntos
        FROM
            public.servicios_custodia s
        WHERE
            s.estado IN ('Finalizado', 'Completado', 'finalizado', 'completado') 
            AND s.fecha_hora_cita >= (CURRENT_DATE - INTERVAL '7 days')
            AND s.id_custodio IS NOT NULL
            AND s.nombre_custodio IS NOT NULL
        GROUP BY
            s.id_custodio, s.nombre_custodio
        ORDER BY
            puntos DESC
    )
    SELECT
        l.id_custodio,
        l.nombre_custodio,
        l.total_viajes,
        l.km_totales,
        l.puntos,
        ROW_NUMBER() OVER (ORDER BY l.puntos DESC)::integer AS posicion
    FROM
        leaderboard l
    WHERE
        l.puntos > 0;
END;
$function$;

-- Fix calcular_puntos_viaje function
CREATE OR REPLACE FUNCTION public.calcular_puntos_viaje(km_viaje numeric, estado_viaje text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  puntos_calculados integer := 0;
BEGIN
  -- Solo calcular puntos para viajes completados
  IF estado_viaje = 'completado' OR estado_viaje = 'Completado' THEN
    -- Base: 1 punto por cada 20 km
    puntos_calculados := COALESCE(FLOOR(km_viaje / 20), 0)::integer;
    
    -- Garantizar un mínimo de 5 puntos por viaje completado
    IF puntos_calculados < 5 THEN
      puntos_calculados := 5;
    END IF;
  END IF;
  
  RETURN puntos_calculados;
END;
$function$;

-- Fix calculate_custodian_level function
CREATE OR REPLACE FUNCTION public.calculate_custodian_level(total_points integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Escala de niveles basada en puntos
  IF total_points >= 2000 THEN
    RETURN 5; -- Diamante
  ELSIF total_points >= 1000 THEN
    RETURN 4; -- Platino
  ELSIF total_points >= 500 THEN
    RETURN 3; -- Oro
  ELSIF total_points >= 250 THEN
    RETURN 2; -- Plata
  ELSE
    RETURN 1; -- Bronce
  END IF;
END;
$function$;

-- Fix ensure_admin_privileges function
CREATE OR REPLACE FUNCTION public.ensure_admin_privileges()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Buscar admin@admin.com
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  -- Si existe, asegurarse de que tenga rol de administrador
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- También asegurarse de que exista su perfil
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (admin_user_id, 'admin@admin.com', 'Administrador')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END;
$function$;

-- Fix update_last_login function
CREATE OR REPLACE FUNCTION public.update_last_login()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = current_user_id;
  
  RETURN true;
END;
$function$;

-- Fix self_verify_admin function
CREATE OR REPLACE FUNCTION public.self_verify_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_email text;
  is_admin_user boolean := false;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario esté autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Obtener el email del usuario desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Verificar si es admin@admin.com (caso especial)
  IF user_email = 'admin@admin.com' THEN
    is_admin_user := true;
  ELSE
    -- Verificar si tiene rol de admin
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = current_user_id AND role = 'admin'
    ) INTO is_admin_user;
  END IF;
  
  -- Solo permitir auto-verificación a administradores
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Solo los administradores pueden auto-verificarse';
  END IF;
  
  -- Actualizar el estado de verificación y último login
  UPDATE public.profiles
  SET 
    is_verified = true,
    last_login = now(),
    updated_at = now()
  WHERE id = current_user_id;
  
  -- Verificar que se actualizó
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo actualizar el perfil del usuario';
  END IF;
  
  RETURN true;
END;
$function$;