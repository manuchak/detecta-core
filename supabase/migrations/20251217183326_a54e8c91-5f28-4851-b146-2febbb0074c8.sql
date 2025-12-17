-- Fix matriz_precios_rutas UPDATE policy to only apply to authenticated users
-- Current policy applies to 'public' role which is not ideal

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "matriz_precios_rutas_update_authorized" ON public.matriz_precios_rutas;

-- Recreate with proper role restriction (authenticated only)
CREATE POLICY "matriz_precios_rutas_update_authorized" 
ON public.matriz_precios_rutas 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'planificador'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'planificador'])
  )
);