-- Actualizar política de SELECT para incluir planificador
DROP POLICY IF EXISTS "matriz_precios_select_senior_management" ON public.matriz_precios_rutas;

CREATE POLICY "matriz_precios_select_authorized"
ON public.matriz_precios_rutas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'planificador')
    AND (is_active IS NULL OR is_active = true)
  )
);

-- Actualizar política de INSERT para incluir planificador
DROP POLICY IF EXISTS "matriz_precios_insert_senior_management" ON public.matriz_precios_rutas;

CREATE POLICY "matriz_precios_insert_authorized"
ON public.matriz_precios_rutas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'planificador')
    AND (is_active IS NULL OR is_active = true)
  )
);