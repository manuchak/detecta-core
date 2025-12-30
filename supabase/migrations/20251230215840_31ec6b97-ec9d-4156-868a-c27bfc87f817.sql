
-- Secure candidatos_custodios table - enable FORCE ROW LEVEL SECURITY
-- Existing policies already restrict to authorized HR/supply/admin roles

-- Ensure anon role has no access (defensive)
REVOKE ALL ON public.candidatos_custodios FROM anon;

-- Enable FORCE ROW LEVEL SECURITY to prevent bypass by table owner/service role
ALTER TABLE public.candidatos_custodios FORCE ROW LEVEL SECURITY;
