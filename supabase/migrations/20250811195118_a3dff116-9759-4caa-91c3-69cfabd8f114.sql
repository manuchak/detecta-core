-- Protect recruitment analytics and avoid breaking existing access
-- 1) Lock down recruitment metrics table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'metricas_reclutamiento'
  ) THEN
    -- Ensure RLS
    EXECUTE 'ALTER TABLE public.metricas_reclutamiento ENABLE ROW LEVEL SECURITY';
    -- Drop permissive policies if any common names
    EXECUTE 'DROP POLICY IF EXISTS "Todos pueden ver métricas de reclutamiento" ON public.metricas_reclutamiento';
    EXECUTE 'DROP POLICY IF EXISTS "metricas_reclutamiento_all_read" ON public.metricas_reclutamiento';

    -- Create restricted read policy for recruitment roles
    EXECUTE 'CREATE POLICY "metricas_reclutamiento_read_restricted" 
             ON public.metricas_reclutamiento FOR SELECT 
             USING (public.can_access_recruitment_data())';
  END IF;
END;
$$;

-- 2) Expand access to metricas_canales to cover recruitment roles as well (still restricted)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'metricas_canales'
  ) THEN
    -- Keep existing financial read policy; add an additional OR policy for recruitment roles
    BEGIN
      EXECUTE 'CREATE POLICY "metricas_canales_read_recruitment_roles" 
               ON public.metricas_canales FOR SELECT 
               USING (public.can_access_recruitment_data())';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END;
$$;