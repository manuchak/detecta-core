-- Centralized access control specifically for financial data
CREATE OR REPLACE FUNCTION public.can_access_financial_data()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Require authenticated user
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Seed admin override
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  ) THEN
    RETURN true;
  END IF;

  -- Finance and management roles only
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'owner',
        'admin',
        'manager',
        'bi',
        'supply_admin'
      )
  );
END;
$$;

-- Lock down gastos_externos if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'gastos_externos'
  ) THEN
    EXECUTE 'ALTER TABLE public.gastos_externos ENABLE ROW LEVEL SECURITY';
    -- Drop likely permissive read policies if they exist
    EXECUTE 'DROP POLICY IF EXISTS "Todos pueden ver gastos externos" ON public.gastos_externos';
    EXECUTE 'DROP POLICY IF EXISTS "gastos_externos_all_read" ON public.gastos_externos';
    -- Create restricted read policy
    EXECUTE 'CREATE POLICY "gastos_externos_read_restricted" 
             ON public.gastos_externos FOR SELECT 
             USING (public.can_access_financial_data())';
  END IF;
END;
$$;

-- Lock down metricas_canales if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'metricas_canales'
  ) THEN
    EXECUTE 'ALTER TABLE public.metricas_canales ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Todos pueden ver métricas de canales" ON public.metricas_canales';
    EXECUTE 'DROP POLICY IF EXISTS "metricas_canales_all_read" ON public.metricas_canales';
    EXECUTE 'CREATE POLICY "metricas_canales_read_restricted" 
             ON public.metricas_canales FOR SELECT 
             USING (public.can_access_financial_data())';
  END IF;
END;
$$;

-- Lock down roi_custodios if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'roi_custodios'
  ) THEN
    EXECUTE 'ALTER TABLE public.roi_custodios ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Todos pueden ver ROI de custodios" ON public.roi_custodios';
    EXECUTE 'DROP POLICY IF EXISTS "roi_custodios_all_read" ON public.roi_custodios';
    EXECUTE 'CREATE POLICY "roi_custodios_read_restricted" 
             ON public.roi_custodios FOR SELECT 
             USING (public.can_access_financial_data())';
  END IF;
END;
$$;