-- Crear función para verificar si el usuario puede gestionar WMS
CREATE OR REPLACE FUNCTION public.can_manage_wms()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'monitoring_supervisor', 'monitoring', 'coordinador_operaciones')
  );
END;
$function$;

-- Eliminar política restrictiva de productos_inventario
DROP POLICY IF EXISTS "admin_access_productos_inventario" ON productos_inventario;

-- Crear nueva política para permitir acceso WMS a productos_inventario
CREATE POLICY "wms_access_productos_inventario" ON productos_inventario
  FOR ALL USING (can_manage_wms())
  WITH CHECK (can_manage_wms());

-- Actualizar política de stock_productos para usar la misma función
DROP POLICY IF EXISTS "admin_access_stock_productos" ON stock_productos;

CREATE POLICY "wms_access_stock_productos" ON stock_productos
  FOR ALL USING (can_manage_wms())
  WITH CHECK (can_manage_wms());