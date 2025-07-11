-- Verificar y actualizar políticas RLS para tablas de inventario
-- Eliminar políticas existentes restrictivas si las hay
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.stock_productos;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.productos_inventario;

-- Crear políticas específicas para roles de supply
CREATE POLICY "supply_admin_full_access_stock" ON public.stock_productos
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

CREATE POLICY "supply_admin_full_access_movimientos" ON public.movimientos_inventario
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

CREATE POLICY "supply_admin_full_access_productos" ON public.productos_inventario
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