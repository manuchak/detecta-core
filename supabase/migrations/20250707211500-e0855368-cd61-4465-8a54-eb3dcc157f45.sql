
-- CORRECCIÓN ESPECÍFICA - PARTE 2: Funciones restantes con search_path mutable

-- Eliminar y recrear las funciones de utilidad restantes
DROP FUNCTION IF EXISTS public.update_updated_at CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.validate_image_url CASCADE;
CREATE OR REPLACE FUNCTION public.validate_image_url(url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN url IS NOT NULL 
    AND url != ''
    AND (url LIKE '%.jpg' OR url LIKE '%.jpeg' OR url LIKE '%.png' OR url LIKE '%.gif' OR url LIKE '%.webp');
END;
$$;

DROP FUNCTION IF EXISTS public.migrate_existing_categories CASCADE;
CREATE OR REPLACE FUNCTION public.migrate_existing_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RAISE NOTICE 'Migration function executed';
END;
$$;

DROP FUNCTION IF EXISTS public.get_reward_categories_with_stats CASCADE;
CREATE OR REPLACE FUNCTION public.get_reward_categories_with_stats()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  reward_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

DROP FUNCTION IF EXISTS public.award_points CASCADE;
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
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.custodio_points (user_id, points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = custodio_points.points + p_points,
    updated_at = now();
    
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

DROP FUNCTION IF EXISTS public.update_trip_points CASCADE;
CREATE OR REPLACE FUNCTION public.update_trip_points(
  p_service_id text,
  p_new_km numeric,
  p_new_points integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.servicios_custodia
  SET km_recorridos = p_new_km
  WHERE id_servicio = p_service_id;
  RETURN FOUND;
END;
$$;

DROP FUNCTION IF EXISTS public.get_custodian_full_stats CASCADE;
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
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer as total_services,
    COUNT(*) FILTER (WHERE estado = 'completado' OR estado = 'Completado')::integer as completed_services,
    COALESCE(SUM(public.calcular_puntos_viaje(km_recorridos, estado)), 0)::integer as total_points,
    COALESCE(SUM(km_recorridos), 0) as total_km,
    0::numeric as average_rating,
    1::integer as current_level
  FROM public.servicios_custodia
  WHERE id_custodio = custodian_id;
END;
$$;

DROP FUNCTION IF EXISTS public.add_admin_role CASCADE;
CREATE OR REPLACE FUNCTION public.add_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'custodio');
  
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.get_rewards_with_category CASCADE;
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
SET search_path TO 'public'
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

-- Funciones adicionales que aparecen en los warnings
DROP FUNCTION IF EXISTS public.get_user_role_secure CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_role_secure()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
  LIMIT 1;
  RETURN COALESCE(user_role, 'unverified');
END;
$$;

DROP FUNCTION IF EXISTS public.user_has_role_secure CASCADE;
CREATE OR REPLACE FUNCTION public.user_has_role_secure(check_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = check_role
  );
END;
$$;

DROP FUNCTION IF EXISTS public.is_admin_or_owner CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  );
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_role_direct CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_role_direct()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  RETURN COALESCE(user_role, 'unverified');
END;
$$;
