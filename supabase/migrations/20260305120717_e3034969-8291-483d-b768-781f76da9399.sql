
-- 1. Actualizar has_monitoring_write_role() para incluir monitoring y monitoring_supervisor
CREATE OR REPLACE FUNCTION public.has_monitoring_write_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'monitoring', 'monitoring_supervisor')
      AND is_active = true
  )
$$;

-- 2. Recrear policy UPDATE en servicios_planificados incluyendo monitoring roles
DROP POLICY IF EXISTS "Authorized users can update planned services" ON public.servicios_planificados;

CREATE POLICY "Authorized users can update planned services"
ON public.servicios_planificados
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin', 'monitoring', 'monitoring_supervisor')
      AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin', 'monitoring', 'monitoring_supervisor')
      AND is_active = true
  )
);
