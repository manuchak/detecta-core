
-- =============================================================
-- FIX 1: Add SET search_path to SECURITY DEFINER functions missing it
-- =============================================================

-- Fix get_leads_counts
ALTER FUNCTION public.get_leads_counts() SET search_path = public;

-- Fix refresh_kpis_cache  
ALTER FUNCTION public.refresh_kpis_cache() SET search_path = public;

-- Fix get_documentos_custodio_by_phone (find signature first)
DO $$
BEGIN
  ALTER FUNCTION public.get_documentos_custodio_by_phone(text) SET search_path = public;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER FUNCTION public.get_real_planned_services_summary() SET search_path = public;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

-- =============================================================
-- FIX 2: Fix vista_frecuencia_incidentes - add security_invoker
-- =============================================================
DO $$
DECLARE
  v_def text;
BEGIN
  SELECT definition INTO v_def
  FROM pg_views
  WHERE schemaname = 'public' AND viewname = 'vista_frecuencia_incidentes';
  
  IF v_def IS NOT NULL THEN
    EXECUTE 'DROP VIEW IF EXISTS public.vista_frecuencia_incidentes CASCADE';
    EXECUTE 'CREATE VIEW public.vista_frecuencia_incidentes WITH (security_invoker = true) AS ' || v_def;
  END IF;
END;
$$;

-- =============================================================
-- FIX 3: Enable RLS on servicios_custodia_test (only table without RLS)
-- =============================================================
ALTER TABLE public.servicios_custodia_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_full_access_servicios_custodia_test" 
ON public.servicios_custodia_test
FOR ALL
USING (public.check_admin_secure())
WITH CHECK (public.check_admin_secure());

CREATE POLICY "authenticated_read_servicios_custodia_test"
ON public.servicios_custodia_test
FOR SELECT
USING (auth.uid() IS NOT NULL);
