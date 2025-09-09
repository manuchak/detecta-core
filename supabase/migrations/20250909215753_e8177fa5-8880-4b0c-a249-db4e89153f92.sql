-- Security Fix: Identify and fix remaining functions with mutable search_path
-- Target specific functions that commonly have search_path issues

-- Fix additional common functions that may still have mutable search_path
ALTER FUNCTION public.generar_folio_servicio() SET search_path TO 'public';
ALTER FUNCTION public.calcular_distancia_km(numeric, numeric, numeric, numeric) SET search_path TO 'public';
ALTER FUNCTION public.es_planificador() SET search_path TO 'public';
ALTER FUNCTION public.es_c4_monitoreo() SET search_path TO 'public';
ALTER FUNCTION public.puede_acceder_planeacion() SET search_path TO 'public';

-- Fix any trigger functions that might be missing search_path
ALTER FUNCTION public.set_created_by_trigger() SET search_path TO 'public';
ALTER FUNCTION public.update_custodios_rotacion_timestamp() SET search_path TO 'public';
ALTER FUNCTION public.update_comodatos_gps_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_forecast_config_updated_at() SET search_path TO 'public';

-- Fix user role and permission functions
ALTER FUNCTION public.has_role(uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.get_user_role_safe(uuid) SET search_path TO 'public';

-- Fix search functions if they exist
ALTER FUNCTION public.update_pc_custodios_search() SET search_path TO 'public';
ALTER FUNCTION public.update_pc_clientes_search() SET search_path TO 'public';