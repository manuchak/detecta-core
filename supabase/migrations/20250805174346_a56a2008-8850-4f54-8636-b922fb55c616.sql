-- Find and fix any remaining SECURITY DEFINER views
-- Query to find all security definer views in the database

-- Check for any remaining security definer views
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%SECURITY DEFINER%';

-- Drop any remaining security definer views found
-- Based on the error, let's be more thorough

-- Check if there are any other views we missed
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Find all views that might have SECURITY DEFINER
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || view_record.schemaname || '.' || view_record.viewname || ' CASCADE';
        RAISE NOTICE 'Dropped security definer view: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
END $$;