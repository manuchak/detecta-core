-- Arreglar políticas RLS para todas las tablas financieras del dashboard

-- Categorías de gastos
DROP POLICY IF EXISTS "Admins pueden gestionar categorías de gastos" ON public.categorias_gastos;
CREATE POLICY "Admins pueden gestionar categorías de gastos" ON public.categorias_gastos
FOR ALL TO authenticated
USING (can_access_recruitment_data())
WITH CHECK (can_access_recruitment_data());

-- Gastos externos
DROP POLICY IF EXISTS "Admins pueden gestionar gastos externos" ON public.gastos_externos;
CREATE POLICY "Admins pueden gestionar gastos externos" ON public.gastos_externos
FOR ALL TO authenticated
USING (can_access_recruitment_data())
WITH CHECK (can_access_recruitment_data());

-- Crear políticas para las nuevas tablas si no existen
DO $$
BEGIN
  -- Métricas canales
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'metricas_canales' 
    AND policyname = 'Admins pueden gestionar métricas canales'
  ) THEN
    CREATE POLICY "Admins pueden gestionar métricas canales" ON public.metricas_canales
    FOR ALL TO authenticated
    USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());
  END IF;

  -- Presupuestos zona
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'presupuestos_zona' 
    AND policyname = 'Admins pueden gestionar presupuestos zona'
  ) THEN
    CREATE POLICY "Admins pueden gestionar presupuestos zona" ON public.presupuestos_zona
    FOR ALL TO authenticated
    USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());
  END IF;

  -- ROI custodios
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'roi_custodios' 
    AND policyname = 'Admins pueden gestionar ROI custodios'
  ) THEN
    CREATE POLICY "Admins pueden gestionar ROI custodios" ON public.roi_custodios
    FOR ALL TO authenticated
    USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());
  END IF;
END $$;