-- Centralized, strict access control for recruitment/financial data
CREATE OR REPLACE FUNCTION public.can_access_recruitment_data()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Must be authenticated
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

  -- Authorized roles only
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN (
        'owner',
        'admin',
        'manager',
        'bi',
        'supply_admin',
        'supply_lead',
        'supply',
        'coordinador_operaciones',
        'ejecutivo_ventas'
      )
  );
END;
$$;

-- Lock down canales_reclutamiento: remove public read, require authorized roles
ALTER TABLE public.canales_reclutamiento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden ver canales de reclutamiento" ON public.canales_reclutamiento;
CREATE POLICY "canales_read_restricted"
ON public.canales_reclutamiento
FOR SELECT
USING (public.can_access_recruitment_data());

-- Ensure categorias_gastos requires authorization for reads as well
ALTER TABLE public.categorias_gastos ENABLE ROW LEVEL SECURITY;
-- In case an overly permissive read policy exists
DROP POLICY IF EXISTS "categorias_gastos_all_read" ON public.categorias_gastos;
CREATE POLICY "categorias_gastos_read_restricted"
ON public.categorias_gastos
FOR SELECT
USING (public.can_access_recruitment_data());

-- Apply same protections to subcategorias_gastos if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'subcategorias_gastos'
  ) THEN
    EXECUTE 'ALTER TABLE public.subcategorias_gastos ENABLE ROW LEVEL SECURITY';
    -- Drop possible permissive read policies by common names if present
    EXECUTE 'DROP POLICY IF EXISTS "Todos pueden ver subcategorias de gastos" ON public.subcategorias_gastos';
    EXECUTE 'DROP POLICY IF EXISTS "Todos pueden ver subcategorías de gastos" ON public.subcategorias_gastos';
    EXECUTE 'DROP POLICY IF EXISTS "subcategorias_gastos_all_read" ON public.subcategorias_gastos';
    -- Create restricted read policy
    EXECUTE 'CREATE POLICY "subcategorias_gastos_read_restricted" 
             ON public.subcategorias_gastos FOR SELECT 
             USING (public.can_access_recruitment_data())';
    -- Ensure manage policy uses strict function too if not present
    -- Note: CREATE POLICY will fail if name exists, so wrap in BEGIN/EXCEPTION
    BEGIN
      EXECUTE 'CREATE POLICY "subcategorias_gastos_manage" 
               ON public.subcategorias_gastos FOR ALL 
               USING (public.can_access_recruitment_data()) 
               WITH CHECK (public.can_access_recruitment_data())';
    EXCEPTION WHEN duplicate_object THEN
      -- Do nothing if already defined
      NULL;
    END;
  END IF;
END;
$$;