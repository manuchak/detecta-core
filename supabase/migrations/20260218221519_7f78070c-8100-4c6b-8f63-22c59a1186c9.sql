
-- Actualizar politica de UPDATE
DROP POLICY IF EXISTS "Staff actualiza documentos" ON public.documentos_custodio;
CREATE POLICY "Staff actualiza documentos" 
ON public.documentos_custodio FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY[
      'admin', 'owner', 'planeacion', 'monitoreo', 'coordinador',
      'supply', 'supply_lead', 'supply_admin'
    ])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY[
      'admin', 'owner', 'planeacion', 'monitoreo', 'coordinador',
      'supply', 'supply_lead', 'supply_admin'
    ])
  )
);

-- Actualizar politica de SELECT
DROP POLICY IF EXISTS "Staff ve todos los documentos" ON public.documentos_custodio;
CREATE POLICY "Staff ve todos los documentos"
ON public.documentos_custodio FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN (
      'admin', 'owner', 'planeacion', 'monitoreo', 'coordinador',
      'supply', 'supply_lead', 'supply_admin'
    )
  )
);
