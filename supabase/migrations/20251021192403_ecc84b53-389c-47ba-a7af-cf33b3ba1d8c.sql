-- Grant EXECUTE permissions on validation RPC functions to authenticated users
-- This fixes "permission denied" errors when validating service IDs

-- Grant permissions for validate_multiple_service_ids
GRANT EXECUTE ON FUNCTION public.validate_multiple_service_ids(text[], boolean) 
TO anon, authenticated, service_role;

-- Grant permissions for validate_unique_service_id
GRANT EXECUTE ON FUNCTION public.validate_unique_service_id(text, boolean) 
TO anon, authenticated, service_role;

-- Grant permissions for validate_service_id_globally
GRANT EXECUTE ON FUNCTION public.validate_service_id_globally(text, uuid) 
TO anon, authenticated, service_role;

-- Ensure all validation functions have proper security settings
-- (These should already be set, but we're being explicit)
ALTER FUNCTION public.validate_multiple_service_ids(text[], boolean) SECURITY DEFINER;
ALTER FUNCTION public.validate_unique_service_id(text, boolean) SECURITY DEFINER;
ALTER FUNCTION public.validate_service_id_globally(text, uuid) SECURITY DEFINER;

-- Set search_path for safety
ALTER FUNCTION public.validate_multiple_service_ids(text[], boolean) SET search_path = public;
ALTER FUNCTION public.validate_unique_service_id(text, boolean) SET search_path = public;
ALTER FUNCTION public.validate_service_id_globally(text, uuid) SET search_path = public;