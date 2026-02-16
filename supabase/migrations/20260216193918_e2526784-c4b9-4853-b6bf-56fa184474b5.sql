
-- Create a security definer function for incident module access
CREATE OR REPLACE FUNCTION public.es_staff_incidentes()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'planificador', 'monitoring', 'coordinador_operaciones', 'gerente_operaciones')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- Drop and recreate policies for incidentes_operativos
DROP POLICY IF EXISTS "Authenticated users can view incidents" ON public.incidentes_operativos;
DROP POLICY IF EXISTS "Authenticated users can create incidents" ON public.incidentes_operativos;
DROP POLICY IF EXISTS "Authenticated users can update incidents" ON public.incidentes_operativos;

CREATE POLICY "Staff can view incidents"
ON public.incidentes_operativos FOR SELECT
USING (public.es_staff_incidentes());

CREATE POLICY "Staff can create incidents"
ON public.incidentes_operativos FOR INSERT
WITH CHECK (public.es_staff_incidentes());

CREATE POLICY "Staff can update incidents"
ON public.incidentes_operativos FOR UPDATE
USING (public.es_staff_incidentes());

CREATE POLICY "Staff can delete incidents"
ON public.incidentes_operativos FOR DELETE
USING (public.es_staff_incidentes());

-- Drop and recreate policies for incidente_cronologia
DROP POLICY IF EXISTS "Authenticated users can view cronologia" ON public.incidente_cronologia;
DROP POLICY IF EXISTS "Authenticated users can insert cronologia" ON public.incidente_cronologia;
DROP POLICY IF EXISTS "Authors can update their cronologia entries" ON public.incidente_cronologia;
DROP POLICY IF EXISTS "Authors can delete their cronologia entries" ON public.incidente_cronologia;

CREATE POLICY "Staff can view cronologia"
ON public.incidente_cronologia FOR SELECT
USING (public.es_staff_incidentes());

CREATE POLICY "Staff can insert cronologia"
ON public.incidente_cronologia FOR INSERT
WITH CHECK (public.es_staff_incidentes());

CREATE POLICY "Staff can update cronologia"
ON public.incidente_cronologia FOR UPDATE
USING (public.es_staff_incidentes());

CREATE POLICY "Staff can delete cronologia"
ON public.incidente_cronologia FOR DELETE
USING (public.es_staff_incidentes());
