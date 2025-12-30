-- Remove FORCE ROW LEVEL SECURITY to allow SECURITY DEFINER functions to work
-- RLS policies remain active and protect the tables for normal users
-- anon role still has no access (REVOKE already applied)

ALTER TABLE public.leads NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.candidatos_custodios NO FORCE ROW LEVEL SECURITY;