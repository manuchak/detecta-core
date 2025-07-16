-- Actualizar políticas RLS para permitir acceso a administradores
-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "supply_admin_full_access_stock" ON public.stock_productos;
DROP POLICY IF EXISTS "supply_admin_full_access_movimientos" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "supply_admin_full_access_productos" ON public.productos_inventario;

-- Crear políticas más inclusivas para stock_productos
CREATE POLICY "admin_and_supply_access_stock" ON public.stock_productos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
);

-- Crear políticas más inclusivas para movimientos_stock
CREATE POLICY "admin_and_supply_access_movimientos_stock" ON public.movimientos_stock
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
);

-- Crear políticas más inclusivas para productos_inventario
CREATE POLICY "admin_and_supply_access_productos" ON public.productos_inventario
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
);