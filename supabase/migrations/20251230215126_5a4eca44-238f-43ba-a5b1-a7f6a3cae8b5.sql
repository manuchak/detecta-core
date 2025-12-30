
-- Secure leads table - enable FORCE ROW LEVEL SECURITY
-- Existing policies already restrict to authorized sales/operational roles

-- Ensure anon role has no access (defensive)
REVOKE ALL ON public.leads FROM anon;

-- Enable FORCE ROW LEVEL SECURITY to prevent bypass by table owner/service role
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
