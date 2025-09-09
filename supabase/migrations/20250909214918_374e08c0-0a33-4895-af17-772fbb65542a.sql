-- Security Fix: Resolve function search_path and materialized view warnings
-- Fixing WARN 1-4: Function Search Path Mutable
-- Fixing WARN 5: Materialized View in API

-- First, let's identify and fix functions without proper search_path
-- Update functions to have secure search_path settings

-- Fix functions that don't have search_path set to 'public'
ALTER FUNCTION public.calcular_puntos_viaje(numeric, text) SET search_path TO 'public';
ALTER FUNCTION public.award_points(uuid, text, integer, text, text) SET search_path TO 'public';
ALTER FUNCTION public.get_current_user_custodio_points() SET search_path TO 'public';
ALTER FUNCTION public.update_custodio_points() SET search_path TO 'public';

-- Secure materialized views by revoking API access
-- Remove materialized views from public schema API exposure
REVOKE SELECT ON public.custodios_operativos_activos FROM anon;
REVOKE SELECT ON public.custodios_operativos_activos FROM authenticated;

-- Create a secure function to access materialized view data instead
CREATE OR REPLACE FUNCTION public.get_custodios_operativos_secure()
RETURNS SETOF public.custodios_operativos_activos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow access to authorized roles
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'monitoring_supervisor')
  ) THEN
    RAISE EXCEPTION 'Access denied. Insufficient permissions.';
  END IF;
  
  RETURN QUERY SELECT * FROM public.custodios_operativos_activos;
END;
$$;