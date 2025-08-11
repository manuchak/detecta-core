-- Idempotent migration to set a fixed search_path for SECURITY DEFINER functions in the public schema
-- This addresses "Function search_path mutable" warnings by ensuring functions do not inherit caller search_path

DO $$
DECLARE
  r record;
  stmt text;
BEGIN
  FOR r IN
    SELECT 
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args,
      p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      -- Only target functions that don't already set search_path
      AND (
        p.proconfig IS NULL OR NOT EXISTS (
          SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg ILIKE 'search_path=%'
        )
      )
  LOOP
    -- Build and execute ALTER to set a fixed search_path
    stmt := format('ALTER FUNCTION %I.%I(%s) SET search_path TO public;', r.nspname, r.proname, r.args);
    EXECUTE stmt;
  END LOOP;
END $$;
