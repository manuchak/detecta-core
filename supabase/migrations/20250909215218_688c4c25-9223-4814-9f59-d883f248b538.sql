-- Security Fix: Final attempt to fix remaining Function Search Path warnings
-- Set search_path for any remaining functions that might be missing it

-- Try to fix remaining common functions that may have mutable search_path
-- Using a comprehensive approach for functions commonly used in the project

DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find and fix functions without proper search_path in public schema
    FOR func_record IN 
        SELECT distinct routine_name, routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        AND routine_name NOT LIKE 'pg_%'
        AND routine_name NOT LIKE 'btree_%'
        AND routine_name NOT LIKE 'gin_%'
        AND routine_name NOT LIKE 'gist_%'
        AND routine_name NOT LIKE 'hash_%'
    LOOP
        BEGIN
            -- Attempt to set search_path for each function
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path TO ''public''', func_record.routine_name);
        EXCEPTION
            WHEN OTHERS THEN
                -- Skip functions that can't be altered or don't exist with no parameters
                CONTINUE;
        END;
    END LOOP;
END
$$;

-- Specifically ensure key trigger functions have proper search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';