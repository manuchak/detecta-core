-- Security Fix: Resolve materialized view API exposure warning  
-- Fixing WARN 5: Materialized View in API

-- Secure the custodios_operativos_activos materialized view
-- by restricting direct access and creating a secure function

-- Revoke direct API access to the materialized view
REVOKE ALL ON public.custodios_operativos_activos FROM anon;
REVOKE ALL ON public.custodios_operativos_activos FROM authenticated;

-- Grant access only to specific roles through the existing secure function
-- The function get_custodios_operativos_activos already exists and has proper access control

-- Ensure the materialized view refresh function has proper search_path
ALTER FUNCTION public.refresh_custodios_operativos_activos() SET search_path TO 'public';