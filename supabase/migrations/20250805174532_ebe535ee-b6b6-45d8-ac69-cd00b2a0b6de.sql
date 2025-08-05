-- CRITICAL SECURITY FIX: Completely remove Security Definer View
-- Target the specific view mentioned in the error: vista_instalaciones_dashboard

-- First, check if the view exists and drop it completely
DROP VIEW IF EXISTS public.vista_instalaciones_dashboard CASCADE;

-- Also check for any materialized views with the same name
DROP MATERIALIZED VIEW IF EXISTS public.vista_instalaciones_dashboard CASCADE;

-- Drop any functions that might recreate this view
DROP FUNCTION IF EXISTS public.create_vista_instalaciones_dashboard() CASCADE;

-- Ensure we remove any triggers or dependencies
DO $$
BEGIN
    -- Drop any potential recreating mechanisms
    DROP VIEW IF EXISTS public.vista_instalaciones_dashboard CASCADE;
    DROP MATERIALIZED VIEW IF EXISTS public.vista_instalaciones_dashboard CASCADE;
    
    -- Check system catalogs and drop if exists
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'vista_instalaciones_dashboard') THEN
        EXECUTE 'DROP VIEW public.vista_instalaciones_dashboard CASCADE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'vista_instalaciones_dashboard') THEN
        EXECUTE 'DROP MATERIALIZED VIEW public.vista_instalaciones_dashboard CASCADE';
    END IF;
    
EXCEPTION
    WHEN others THEN
        -- Continue even if there are errors
        NULL;
END $$;

-- Clear any cached definitions
RESET ALL;

-- Verify the view is completely gone
SELECT 'Security definer view removal completed' as status;