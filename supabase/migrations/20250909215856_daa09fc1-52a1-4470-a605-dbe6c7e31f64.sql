-- Security Fix: Final comprehensive fix for all remaining function search_path issues
-- Use a more thorough approach to identify and fix ALL functions with mutable search_path

DO $$
DECLARE
    func_record RECORD;
    func_signature TEXT;
BEGIN
    -- Get all functions in public schema with their full signatures
    FOR func_record IN 
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args,
            p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE '%_trigger'
    LOOP
        BEGIN
            -- Build function signature with arguments
            func_signature := func_record.function_name || '(' || func_record.args || ')';
            
            -- Try to set search_path for each function with its specific signature
            EXECUTE format('ALTER FUNCTION public.%s SET search_path TO ''public''', func_signature);
            
            RAISE NOTICE 'Fixed search_path for function: %', func_signature;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log which functions we couldn't fix and continue
                RAISE NOTICE 'Could not fix function: % - Error: %', func_signature, SQLERRM;
                CONTINUE;
        END;
    END LOOP;
    
    -- Also fix any remaining trigger functions specifically
    FOR func_record IN 
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname LIKE '%_trigger'
    LOOP
        BEGIN
            func_signature := func_record.function_name || '(' || func_record.args || ')';
            EXECUTE format('ALTER FUNCTION public.%s SET search_path TO ''public''', func_signature);
            RAISE NOTICE 'Fixed trigger function: %', func_signature;
        EXCEPTION
            WHEN OTHERS THEN
                CONTINUE;
        END;
    END LOOP;
END
$$;