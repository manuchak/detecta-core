-- Crear función segura para verificar roles sin recursión RLS
CREATE OR REPLACE FUNCTION public.get_user_role_for_recruitment()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'unverified'
  );
$$;

-- Crear función para verificar si el usuario puede acceder a datos de reclutamiento
CREATE OR REPLACE FUNCTION public.can_access_recruitment_data()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'admin@admin.com'
  );
$$;

-- Actualizar políticas RLS para usar las nuevas funciones
DROP POLICY IF EXISTS "Admins pueden gestionar alertas" ON public.alertas_sistema_nacional;
CREATE POLICY "Admins pueden gestionar alertas" ON public.alertas_sistema_nacional
FOR ALL TO authenticated
USING (can_access_recruitment_data())
WITH CHECK (can_access_recruitment_data());

DROP POLICY IF EXISTS "Admins pueden gestionar candidatos" ON public.candidatos_custodios;
CREATE POLICY "Admins pueden gestionar candidatos" ON public.candidatos_custodios
FOR ALL TO authenticated
USING (can_access_recruitment_data())
WITH CHECK (can_access_recruitment_data());

-- Simplificar política para métricas de demanda (crear si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'metricas_demanda_zona' 
    AND policyname = 'Admins pueden gestionar métricas demanda'
  ) THEN
    CREATE POLICY "Admins pueden gestionar métricas demanda" ON public.metricas_demanda_zona
    FOR ALL TO authenticated
    USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());
  END IF;
END $$;

-- Simplificar política para métricas de reclutamiento (crear si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'metricas_reclutamiento' 
    AND policyname = 'Admins pueden gestionar métricas reclutamiento'
  ) THEN
    CREATE POLICY "Admins pueden gestionar métricas reclutamiento" ON public.metricas_reclutamiento
    FOR ALL TO authenticated
    USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());
  END IF;
END $$;

-- Simplificar política para zonas operativas (crear si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'zonas_operacion_nacional' 
    AND policyname = 'Admins pueden gestionar zonas'
  ) THEN
    CREATE POLICY "Admins pueden gestionar zonas" ON public.zonas_operacion_nacional
    FOR ALL TO authenticated
    USING (can_access_recruitment_data())
    WITH CHECK (can_access_recruitment_data());
  END IF;
END $$;