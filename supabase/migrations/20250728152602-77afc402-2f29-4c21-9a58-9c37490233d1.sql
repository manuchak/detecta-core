-- PHASE 1: CRITICAL DATABASE SECURITY FIXES
-- Fix missing RLS policies for inventario_gps table

-- Enable RLS on inventario_gps table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'inventario_gps' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.inventario_gps ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for inventario_gps table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inventario_gps' 
    AND policyname = 'Admin can manage inventario_gps'
  ) THEN
    CREATE POLICY "Admin can manage inventario_gps"
    ON public.inventario_gps
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
      )
      OR 
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() AND email = 'admin@admin.com'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
      )
      OR 
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() AND email = 'admin@admin.com'
      )
    );
  END IF;
END $$;

-- Fix trigger-dependent functions by dropping triggers first, then functions, then recreating
DROP TRIGGER IF EXISTS update_forecast_config_updated_at ON public.forecast_config;
DROP FUNCTION IF EXISTS public.update_forecast_config_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_forecast_config_updated_at()
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

-- Recreate the trigger
CREATE TRIGGER update_forecast_config_updated_at
  BEFORE UPDATE ON public.forecast_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forecast_config_updated_at();

-- Fix other trigger functions
DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at ON public.whatsapp_sessions;
DROP FUNCTION IF EXISTS public.update_whatsapp_sessions_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_whatsapp_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Recreate trigger if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'whatsapp_sessions') THEN
    CREATE TRIGGER update_whatsapp_sessions_updated_at
      BEFORE UPDATE ON public.whatsapp_sessions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_whatsapp_sessions_updated_at();
  END IF;
END $$;

-- Fix custodios rotation trigger
DROP TRIGGER IF EXISTS update_custodios_rotacion_timestamp ON public.custodios_rotacion_tracking;
DROP FUNCTION IF EXISTS public.update_custodios_rotacion_timestamp() CASCADE;

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

-- Recreate trigger
CREATE TRIGGER update_custodios_rotacion_timestamp
  BEFORE UPDATE ON public.custodios_rotacion_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custodios_rotacion_timestamp();

-- Create or replace secure helper functions (these don't have dependencies)
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
  
  -- Check if user is admin@admin.com
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Check user roles
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_email text;
  found_role text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if user is admin@admin.com
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN 'admin';
  END IF;
  
  -- Get user role
  SELECT role INTO found_role
  FROM public.user_roles
  WHERE user_id = current_user_id
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
$function$;

CREATE OR REPLACE FUNCTION public.user_has_role_secure(check_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
  
  -- Check if user is admin@admin.com and requested role is admin
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' AND check_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Check user roles
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role = check_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Return comprehensive list of available roles
  RETURN ARRAY[
    'admin',
    'owner', 
    'supply_admin',
    'supply_lead',
    'supply',
    'bi',
    'monitoring_supervisor',
    'monitoring',
    'analista_seguridad',
    'coordinador_operaciones',
    'jefe_seguridad',
    'soporte',
    'custodio',
    'manager',
    'pending',
    'unverified'
  ];
END;
$function$;