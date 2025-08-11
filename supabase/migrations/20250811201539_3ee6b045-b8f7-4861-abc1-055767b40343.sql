-- Secure BI-sensitive tables by enforcing restrictive RLS for authorized roles only
-- This migration is idempotent and will only act on existing tables

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['metricas_canales','metricas_reclutamiento','gastos_externos','roi_custodios']
  LOOP
    -- Ensure the table exists before applying changes
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      -- Enable and force RLS to ensure all policies must pass
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', t);

      -- Create a restrictive SELECT policy to limit access to authorized roles
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies p
        JOIN pg_class c ON c.oid = p.polrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = t AND p.polname = 'restrict_bi_sensitive_read'
      ) THEN
        EXECUTE format($sql$
          CREATE POLICY restrict_bi_sensitive_read
          ON public.%I
          AS RESTRICTIVE
          FOR SELECT
          TO authenticated
          USING (
            public.is_admin_user_secure()
            OR public.user_has_role_direct('owner')
            OR public.user_has_role_direct('bi')
            OR public.user_has_role_direct('supply_admin')
            OR public.user_has_role_direct('supply_lead')
          );
        $sql$, t);
      END IF;
    END IF;
  END LOOP;
END $$;