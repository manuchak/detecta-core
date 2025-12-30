
-- Ensure anon role has no access (defensive)
REVOKE ALL ON public.profiles FROM anon;

-- Enable FORCE ROW LEVEL SECURITY to prevent bypass by table owner/service role
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
