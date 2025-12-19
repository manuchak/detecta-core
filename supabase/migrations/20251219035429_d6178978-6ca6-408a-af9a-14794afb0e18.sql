-- ================================================================
-- Fix: Remove duplicate/legacy RLS policies on servicios_custodia
-- Keep only the properly secured _admin_ops policies
-- ================================================================

-- Drop the older, less comprehensive policies
DROP POLICY IF EXISTS "Servicios custodia borrado restringido" ON public.servicios_custodia;
DROP POLICY IF EXISTS "Servicios custodia insercion restringida" ON public.servicios_custodia;
DROP POLICY IF EXISTS "Servicios custodia modificacion restringida" ON public.servicios_custodia;

-- Add explicit deny for anon role to ensure no public access
-- (This is a safety net - RLS already requires authenticated)
REVOKE ALL ON public.servicios_custodia FROM anon;

-- Grant only to authenticated users (RLS will further restrict)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicios_custodia TO authenticated;

-- Verify RLS is enforced (should already be true)
ALTER TABLE public.servicios_custodia FORCE ROW LEVEL SECURITY;