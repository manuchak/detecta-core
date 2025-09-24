-- Clean up duplicate validate_service_id_globally functions
-- Remove the old function with 3 parameters specifically
DROP FUNCTION IF EXISTS public.validate_service_id_globally(TEXT, TEXT, UUID);

-- Verify only the correct function with 2 parameters remains
-- (The correct function should already exist from previous migration)