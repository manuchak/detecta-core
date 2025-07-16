-- Crear políticas más simples que funcionen con admin@admin.com
-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "usuarios_autenticados_stock_productos" ON public.stock_productos;
DROP POLICY IF EXISTS "usuarios_autenticados_movimientos_inventario" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "usuarios_autenticados_productos_inventario" ON public.productos_inventario;

-- Crear políticas usando la función segura existente
CREATE POLICY "admin_access_stock_productos" ON public.stock_productos
FOR ALL
USING (is_admin_user_secure())
WITH CHECK (is_admin_user_secure());

CREATE POLICY "admin_access_movimientos_inventario" ON public.movimientos_inventario
FOR ALL
USING (is_admin_user_secure())
WITH CHECK (is_admin_user_secure());

CREATE POLICY "admin_access_productos_inventario" ON public.productos_inventario
FOR ALL
USING (is_admin_user_secure())
WITH CHECK (is_admin_user_secure());