
-- Fix contactos_empresa security: revoke anon access and enable FORCE RLS

-- Revoke all permissions from anon role
REVOKE ALL ON public.contactos_empresa FROM anon;

-- Enable FORCE ROW LEVEL SECURITY to ensure even table owners are subject to RLS
ALTER TABLE public.contactos_empresa FORCE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON TABLE public.contactos_empresa IS 'Business contacts - RLS enforced, anon access revoked. Access restricted to authorized roles only.';
