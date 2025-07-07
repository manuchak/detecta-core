
-- CORRECCIÓN ESPECÍFICA DE FUNCIONES CON SEARCH_PATH MUTABLE
-- Migración enfocada solo en las funciones que aparecen en los warnings

-- Eliminar y recrear funciones problemáticas con search_path correcto
DROP FUNCTION IF EXISTS public.validate_service_distance CASCADE;
CREATE OR REPLACE FUNCTION public.validate_service_distance(service_km numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN service_km >= 0 AND service_km <= 5000;
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_points_with_validation CASCADE;
CREATE OR REPLACE FUNCTION public.calculate_points_with_validation(km_viaje numeric, estado_viaje text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  puntos_calculados integer := 0;
BEGIN
  IF NOT public.validate_service_distance(km_viaje) THEN
    RETURN 0;
  END IF;
  RETURN public.calcular_puntos_viaje(km_viaje, estado_viaje);
END;
$$;

DROP FUNCTION IF EXISTS public.flag_service_for_review CASCADE;
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
SET search_path TO 'public'
AS $$
DECLARE
  new_flag_id uuid;
BEGIN
  INSERT INTO public.flagged_services (
    service_id, flag_reason, original_km, original_points, 
    suggested_km, suggested_points, status
  ) VALUES (
    p_service_id, p_flag_reason, p_original_km, p_original_points,
    p_suggested_km, p_suggested_points, 'pending'
  ) RETURNING id INTO new_flag_id;
  RETURN new_flag_id;
END;
$$;

DROP FUNCTION IF EXISTS public.review_flagged_service CASCADE;
CREATE OR REPLACE FUNCTION public.review_flagged_service(
  p_flag_id uuid,
  p_decision text,
  p_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.flagged_services
  SET status = p_decision, admin_notes = p_admin_notes,
      reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_flag_id;
  RETURN FOUND;
END;
$$;

DROP FUNCTION IF EXISTS public.check_user_role CASCADE;
CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = $2
  );
END;
$$;

DROP FUNCTION IF EXISTS public.validar_horario_instalacion CASCADE;
CREATE OR REPLACE FUNCTION public.validar_horario_instalacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.fecha_programada < now() THEN
    RAISE EXCEPTION 'La fecha de instalación no puede ser en el pasado';
  END IF;
  IF EXTRACT(hour FROM NEW.fecha_programada) < 8 OR EXTRACT(hour FROM NEW.fecha_programada) > 18 THEN
    RAISE EXCEPTION 'Las instalaciones solo pueden programarse entre 8 AM y 6 PM';
  END IF;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.trigger_validar_fecha_instalacion CASCADE;
CREATE OR REPLACE FUNCTION public.trigger_validar_fecha_instalacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.fecha_programada::date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se puede programar una instalación en una fecha pasada';
  END IF;
  RETURN NEW;
END;
$$;

-- Continuar con las funciones más críticas de roles y seguridad
DROP FUNCTION IF EXISTS public.is_admin CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role IN ('admin', 'owner')
  );
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_role CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.user_roles
  WHERE user_id = $1
  ORDER BY CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
  LIMIT 1;
  RETURN COALESCE(user_role, 'unverified');
END;
$$;

DROP FUNCTION IF EXISTS public.user_has_role CASCADE;
CREATE OR REPLACE FUNCTION public.user_has_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = $2
  );
END;
$$;
