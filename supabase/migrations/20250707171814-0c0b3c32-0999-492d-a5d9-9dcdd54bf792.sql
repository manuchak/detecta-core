
-- CORRECCIÓN DE ADVERTENCIAS DE SEGURIDAD SUPABASE
-- Establecer search_path seguro para todas las funciones que lo requieren

-- Función: get_reward_image_url
CREATE OR REPLACE FUNCTION public.get_reward_image_url(image_path text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN image_path IS NULL OR image_path = '' THEN NULL
      ELSE 'https://yydzzeljaewsfhmilnhm.supabase.co/storage/v1/object/public/reward-images/' || image_path
    END;
$$;

-- Función: update_timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Función: upsert_user_profile
CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  user_id uuid, 
  user_email text, 
  user_display_name text, 
  user_phone text DEFAULT NULL::text, 
  user_photo_url text DEFAULT NULL::text, 
  user_role text DEFAULT 'custodio'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Insert or update profile
  INSERT INTO public.profiles (id, email, display_name, phone, photo_url)
  VALUES (user_id, user_email, user_display_name, user_phone, user_photo_url)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    photo_url = COALESCE(EXCLUDED.photo_url, profiles.photo_url),
    updated_at = now()
  RETURNING id INTO profile_id;
  
  -- Ensure role is set
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Ensure points record exists
  INSERT INTO public.custodio_points (user_id)
  VALUES (user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN profile_id;
END;
$$;

-- Función: get_weekly_leaderboard
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE(
  custodio_id text, 
  nombre_custodio text, 
  total_viajes integer, 
  km_totales numeric, 
  puntos integer, 
  posicion integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Función: update_points_on_user_link
CREATE OR REPLACE FUNCTION public.update_points_on_user_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    trip_points integer;
    trip_type text := 'historical_trip';
    trip_description text;
BEGIN
    -- Solo procesar cuando se actualiza id_custodio
    IF NEW.id_custodio IS NOT NULL AND OLD.id_custodio IS NULL THEN
        -- Si el viaje está completado, calcular y otorgar puntos
        IF (NEW.estado = 'completado' OR NEW.estado = 'Completado') AND 
           NEW.km_recorridos IS NOT NULL THEN
            
            -- Calcular puntos basados en kilómetros
            trip_points := public.calcular_puntos_viaje(NEW.km_recorridos, NEW.estado);
            
            -- Construir descripción
            trip_description := 'Vinculación automática: ' || NEW.origen || ' a ' || NEW.destino;
            
            -- Otorgar puntos si hay un custodio válido
            IF trip_points > 0 THEN
                PERFORM public.award_points(
                    NEW.id_custodio::uuid,
                    NEW.id_servicio,
                    trip_points,
                    trip_type,
                    trip_description
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Función: verify_admin_email
CREATE OR REPLACE FUNCTION public.verify_admin_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the admin@admin.com user ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  -- If the user exists, mark their email as confirmed
  IF admin_user_id IS NOT NULL THEN
    -- Update the email_confirmed_at timestamp to mark as verified
    UPDATE auth.users 
    SET email_confirmed_at = now(),
        is_sso_user = FALSE
    WHERE id = admin_user_id;

    -- Ensure the user has admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin user email verified successfully';
  ELSE
    RAISE NOTICE 'Admin user not found';
  END IF;
END;
$$;

-- Función: ensure_admin_privileges
CREATE OR REPLACE FUNCTION public.ensure_admin_privileges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Función: calculate_custodian_level
CREATE OR REPLACE FUNCTION public.calculate_custodian_level(total_points integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Función: calcular_puntos_viaje
CREATE OR REPLACE FUNCTION public.calcular_puntos_viaje(km_viaje numeric, estado_viaje text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Función: obtener_estadisticas_custodio
CREATE OR REPLACE FUNCTION public.obtener_estadisticas_custodio(custodio_id text)
RETURNS TABLE(
  total_viajes integer, 
  puntos_totales integer, 
  km_totales numeric, 
  viajes_completados integer, 
  viajes_pendientes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer as total_viajes,
    SUM(public.calcular_puntos_viaje(km_recorridos, estado))::integer as puntos_totales,
    SUM(km_recorridos) as km_totales,
    COUNT(*) FILTER (WHERE estado = 'completado' OR estado = 'Completado')::integer as viajes_completados,
    COUNT(*) FILTER (WHERE estado = 'pendiente' OR estado = 'en proceso')::integer as viajes_pendientes
  FROM
    public.servicios_custodia
  WHERE
    id_custodio = custodio_id;
END;
$$;

-- Función: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
