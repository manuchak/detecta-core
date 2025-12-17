-- Consolidate SELECT policies for matriz_precios_rutas
-- Drop existing SELECT policies (there are two with slightly different role lists)
DROP POLICY IF EXISTS "Precios visibles solo para roles autorizados" ON public.matriz_precios_rutas;
DROP POLICY IF EXISTS "matriz_precios_select_role_based" ON public.matriz_precios_rutas;

-- Create single consolidated SELECT policy with correct roles
CREATE POLICY "matriz_precios_select_authorized_roles" 
ON public.matriz_precios_rutas 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin', 'bi'])
    AND (user_roles.is_active IS NULL OR user_roles.is_active = true)
  )
);