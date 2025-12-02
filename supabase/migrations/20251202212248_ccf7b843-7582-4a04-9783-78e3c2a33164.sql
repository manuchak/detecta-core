-- Eliminar políticas UPDATE antiguas
DROP POLICY IF EXISTS "matriz_precios_rutas_update_admin" ON public.matriz_precios_rutas;
DROP POLICY IF EXISTS "matriz_precios_update_restricted_secure" ON public.matriz_precios_rutas;

-- Crear política UPDATE unificada con planificador incluido
CREATE POLICY "matriz_precios_rutas_update_authorized" 
ON public.matriz_precios_rutas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'planificador']::text[])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'planificador']::text[])
  )
);