-- Corregir políticas RLS para tablas de stock
-- Eliminar políticas problemáticas existentes
DROP POLICY IF EXISTS "admin_and_supply_access_stock" ON public.stock_productos;
DROP POLICY IF EXISTS "admin_and_supply_access_movimientos_stock" ON public.movimientos_stock;
DROP POLICY IF EXISTS "admin_and_supply_access_productos" ON public.productos_inventario;

-- Crear políticas más simples y seguras
CREATE POLICY "usuarios_autenticados_stock_productos" ON public.stock_productos
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

CREATE POLICY "usuarios_autenticados_movimientos_stock" ON public.movimientos_stock
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

-- Crear política para productos_inventario también
CREATE POLICY "usuarios_autenticados_productos_inventario" ON public.productos_inventario
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