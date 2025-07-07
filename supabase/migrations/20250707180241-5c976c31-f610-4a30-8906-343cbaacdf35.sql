
-- CORRECCIÓN ADICIONAL DE ADVERTENCIAS DE SEGURIDAD SUPABASE
-- Parte 2: Funciones restantes que requieren search_path seguro

-- Función: validate_service_distance
CREATE OR REPLACE FUNCTION public.validate_service_distance(service_km numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que la distancia esté en un rango razonable (0-5000 km)
  RETURN service_km >= 0 AND service_km <= 5000;
END;
$$;

-- Función: calculate_points_with_validation
CREATE OR REPLACE FUNCTION public.calculate_points_with_validation(km_viaje numeric, estado_viaje text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  puntos_calculados integer := 0;
BEGIN
  -- Validar entrada
  IF NOT public.validate_service_distance(km_viaje) THEN
    RETURN 0;
  END IF;
  
  -- Usar función existente para calcular puntos
  RETURN public.calcular_puntos_viaje(km_viaje, estado_viaje);
END;
$$;

-- Función: flag_service_for_review
CREATE OR REPLACE FUNCTION public.flag_service_for_review(
  p_service_id text,
  p_flag_reason text,
  p_original_km numeric DEFAULT NULL,
  p_original_points integer DEFAULT NULL,
  p_suggested_km numeric DEFAULT NULL,
  p_suggested_points integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_flag_id uuid;
BEGIN
  INSERT INTO public.flagged_services (
    service_id,
    flag_reason,
    original_km,
    original_points,
    suggested_km,
    suggested_points,
    status
  ) VALUES (
    p_service_id,
    p_flag_reason,
    p_original_km,
    p_original_points,
    p_suggested_km,
    p_suggested_points,
    'pending'
  ) RETURNING id INTO new_flag_id;
  
  RETURN new_flag_id;
END;
$$;

-- Función: review_flagged_service
CREATE OR REPLACE FUNCTION public.review_flagged_service(
  p_flag_id uuid,
  p_decision text,
  p_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.flagged_services
  SET 
    status = p_decision,
    admin_notes = p_admin_notes,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_flag_id;
  
  RETURN FOUND;
END;
$$;

-- Función: check_user_role
CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = $2
  );
END;
$$;

-- Función: validar_horario_instalacion
CREATE OR REPLACE FUNCTION public.validar_horario_instalacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que la fecha de instalación no sea en el pasado
  IF NEW.fecha_programada < now() THEN
    RAISE EXCEPTION 'La fecha de instalación no puede ser en el pasado';
  END IF;
  
  -- Validar horario laboral (8 AM a 6 PM)
  IF EXTRACT(hour FROM NEW.fecha_programada) < 8 OR EXTRACT(hour FROM NEW.fecha_programada) > 18 THEN
    RAISE EXCEPTION 'Las instalaciones solo pueden programarse entre 8 AM y 6 PM';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Función: trigger_validar_fecha_instalacion
CREATE OR REPLACE FUNCTION public.trigger_validar_fecha_instalacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que la fecha no sea anterior a hoy
  IF NEW.fecha_programada::date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se puede programar una instalación en una fecha pasada';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Función: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role IN ('admin', 'owner')
  );
END;
$$;

-- Función: get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = $1
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'unverified');
END;
$$;

-- Función: user_has_role
CREATE OR REPLACE FUNCTION public.user_has_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = $2
  );
END;
$$;

-- Función: update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
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

-- Función: validate_image_url
CREATE OR REPLACE FUNCTION public.validate_image_url(url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que la URL sea válida y termine en extensión de imagen
  RETURN url IS NOT NULL 
    AND url != ''
    AND (url LIKE '%.jpg' OR url LIKE '%.jpeg' OR url LIKE '%.png' OR url LIKE '%.gif' OR url LIKE '%.webp');
END;
$$;

-- Función: migrate_existing_categories
CREATE OR REPLACE FUNCTION public.migrate_existing_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Función de migración para categorías existentes
  -- Implementar lógica de migración si es necesaria
  RAISE NOTICE 'Migration function executed';
END;
$$;

-- Función: get_reward_categories_with_stats
CREATE OR REPLACE FUNCTION public.get_reward_categories_with_stats()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  reward_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.id,
    rc.name,
    rc.description,
    COUNT(r.id) as reward_count
  FROM public.reward_categories rc
  LEFT JOIN public.rewards r ON rc.id = r.category_id
  GROUP BY rc.id, rc.name, rc.description
  ORDER BY rc.name;
END;
$$;

-- Función: award_points
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_service_id text,
  p_points integer,
  p_type text DEFAULT 'trip',
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Actualizar puntos del usuario
  INSERT INTO public.custodio_points (user_id, points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = custodio_points.points + p_points,
    updated_at = now();
    
  -- Registrar en historial
  INSERT INTO public.points_history (
    user_id,
    points_earned,
    points_type,
    description,
    service_id
  ) VALUES (
    p_user_id,
    p_points,
    p_type,
    COALESCE(p_description, 'Puntos por servicio: ' || p_service_id),
    p_service_id
  );
END;
$$;

-- Función: update_trip_points
CREATE OR REPLACE FUNCTION public.update_trip_points(
  p_service_id text,
  p_new_km numeric,
  p_new_points integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Actualizar puntos en el servicio
  UPDATE public.servicios_custodia
  SET km_recorridos = p_new_km
  WHERE id_servicio = p_service_id;
  
  RETURN FOUND;
END;
$$;

-- Función: get_custodian_full_stats
CREATE OR REPLACE FUNCTION public.get_custodian_full_stats(custodian_id text)
RETURNS TABLE(
  total_services integer,
  completed_services integer,
  total_points integer,
  total_km numeric,
  average_rating numeric,
  current_level integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer as total_services,
    COUNT(*) FILTER (WHERE estado = 'completado' OR estado = 'Completado')::integer as completed_services,
    COALESCE(SUM(public.calcular_puntos_viaje(km_recorridos, estado)), 0)::integer as total_points,
    COALESCE(SUM(km_recorridos), 0) as total_km,
    0::numeric as average_rating, -- Placeholder
    1::integer as current_level -- Placeholder
  FROM public.servicios_custodia
  WHERE id_custodio = custodian_id;
END;
$$;

-- Función: add_admin_role
CREATE OR REPLACE FUNCTION public.add_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Función: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  -- Asignar rol por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'custodio');
  
  RETURN NEW;
END;
$$;

-- Función: get_rewards_with_category
CREATE OR REPLACE FUNCTION public.get_rewards_with_category()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  point_cost integer,
  category_name text,
  availability integer,
  featured boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.point_cost,
    COALESCE(rc.name, 'Sin categoría') as category_name,
    r.availability,
    r.featured
  FROM public.rewards r
  LEFT JOIN public.reward_categories rc ON r.category_id = rc.id
  ORDER BY r.featured DESC, r.point_cost ASC;
END;
$$;
