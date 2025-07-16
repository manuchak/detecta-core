-- Corregir política para movimientos_inventario
DROP POLICY IF EXISTS "usuarios_autenticados_movimientos_stock" ON public.movimientos_stock;

CREATE POLICY "usuarios_autenticados_movimientos_inventario" ON public.movimientos_inventario
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  )
);