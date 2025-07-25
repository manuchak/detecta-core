-- FASE 1: CORRECCIÓN DE ERRORES ESTRUCTURALES EN FUNCIONES SQL
-- Corrigiendo las 54 funciones con problemas de search_path mutable

-- 1. Corregir funciones críticas de autenticación y roles
CREATE OR REPLACE FUNCTION public.update_stock_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.ultima_actualizacion = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_recepcion_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    next_number INTEGER;
    new_number TEXT;
BEGIN
    -- Obtener el siguiente número secuencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_recepcion FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.recepciones_mercancia
    WHERE numero_recepcion ~ '^REC[0-9]+$';
    
    -- Formatear con ceros a la izquierda
    new_number := 'REC' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN new_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_recepcion_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.numero_recepcion IS NULL THEN
        NEW.numero_recepcion := public.generate_recepcion_number();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_role_secure(check_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = check_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_configuracion_wms_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_metricas_operacionales_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_wms()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'monitoring_supervisor', 'monitoring', 'coordinador_operaciones')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_admin_for_rewards()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificación directa para admin@admin.com (bypass completo)
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  ) THEN
    RETURN true;
  END IF;
  
  -- Verificación directa en user_roles sin usar otras políticas RLS
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'manager')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND au.email = 'admin@admin.com'
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_user_role_secure(user_id uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = $2
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_secure(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND (role = 'admin' OR role = 'owner')
  );
END;
$function$;

-- 2. Corregir funciones de servicios y monitoreo
CREATE OR REPLACE FUNCTION public.is_service_owner(user_id uuid, service_custodio_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN service_custodio_id = user_id::text OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND (role = 'admin' OR role = 'owner' OR role = 'manager')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_reward_image_url(image_path text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN image_path IS NULL OR image_path = '' THEN NULL
      ELSE 'https://yydzzeljaewsfhmilnhm.supabase.co/storage/v1/object/public/reward-images/' || image_path
    END;
$function$;

CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.current_user_is_coordinator_or_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar si el usuario está autenticado
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si tiene rol de coordinador, admin u owner
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_ml_config_timestamp_simple()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_custodios_rotacion_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. Corregir funciones de recompensas y puntos
CREATE OR REPLACE FUNCTION public.redeem_points(p_user_id uuid, p_reward_id uuid, p_quantity integer DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_reward RECORD;
    v_user_points INTEGER;
    v_total_cost INTEGER;
    v_new_redemption_id UUID;
BEGIN
    -- Obtener datos de la recompensa
    SELECT * INTO v_reward FROM public.rewards WHERE id = p_reward_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recompensa no encontrada';
    END IF;

    -- Verificar disponibilidad
    IF v_reward.availability < p_quantity THEN
        RAISE EXCEPTION 'Disponibilidad insuficiente';
    END IF;

    -- Obtener puntos actuales del usuario
    SELECT points INTO v_user_points FROM public.custodio_points WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado en sistema de puntos';
    END IF;

    -- Calcular costo total
    v_total_cost := v_reward.point_cost * p_quantity;

    -- Verificar si el usuario tiene suficientes puntos
    IF v_user_points < v_total_cost THEN
        RAISE EXCEPTION 'Puntos insuficientes';
    END IF;

    -- Comenzar transacción
    -- Restar puntos
    UPDATE public.custodio_points
    SET points = points - v_total_cost
    WHERE user_id = p_user_id;

    -- Actualizar disponibilidad
    UPDATE public.rewards
    SET availability = availability - p_quantity
    WHERE id = p_reward_id;

    -- Crear registro de redención
    INSERT INTO public.redemptions (
        user_id,
        reward_id,
        points_spent,
        status
    ) VALUES (
        p_user_id,
        p_reward_id,
        v_total_cost,
        'pending'
    ) RETURNING id INTO v_new_redemption_id;

    -- Registrar en el historial de puntos
    INSERT INTO public.points_history (
        user_id,
        points_earned,
        points_type,
        description
    ) VALUES (
        p_user_id,
        -v_total_cost,
        'redemption',
        'Canje de ' || p_quantity || 'x ' || v_reward.name
    );

    RETURN v_new_redemption_id;
END;
$function$;