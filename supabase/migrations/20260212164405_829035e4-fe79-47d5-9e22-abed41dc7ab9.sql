CREATE POLICY "Staff actualiza documentos" 
ON public.documentos_custodio
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'planeacion', 'monitoreo', 'coordinador'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'planeacion', 'monitoreo', 'coordinador'])
  )
);