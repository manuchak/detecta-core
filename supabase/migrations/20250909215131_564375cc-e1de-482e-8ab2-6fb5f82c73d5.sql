-- Security Fix: Set secure search_path for functions with mutable paths
-- Fixing remaining Function Search Path Mutable warnings

-- Fix search_path for key security and utility functions
-- These are functions that appear in the project and need secure search_path

-- Core authentication and role functions
ALTER FUNCTION public.is_admin_user_secure() SET search_path TO 'public';
ALTER FUNCTION public.check_admin_secure() SET search_path TO 'public';
ALTER FUNCTION public.user_has_role_direct(text) SET search_path TO 'public';
ALTER FUNCTION public.get_current_user_role_secure() SET search_path TO 'public';

-- Financial and business functions  
ALTER FUNCTION public.calcular_costo_promedio_ponderado(uuid) SET search_path TO 'public';
ALTER FUNCTION public.calcular_valor_inventario(uuid) SET search_path TO 'public';

-- Analytics and data functions
ALTER FUNCTION public.get_historical_monthly_data() SET search_path TO 'public';
ALTER FUNCTION public.calculate_unified_points(numeric, text) SET search_path TO 'public';
ALTER FUNCTION public.get_custodian_performance_unified() SET search_path TO 'public';

-- Service and operational functions
ALTER FUNCTION public.get_user_servicios_secure(integer) SET search_path TO 'public';
ALTER FUNCTION public.get_all_recent_trips(integer) SET search_path TO 'public';