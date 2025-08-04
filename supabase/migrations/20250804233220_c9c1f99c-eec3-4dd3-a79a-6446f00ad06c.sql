-- Crear políticas RLS para la tabla movimientos_inventario
-- para permitir que usuarios con permisos WMS puedan registrar movimientos

-- Política para SELECT - permitir ver movimientos a usuarios con acceso WMS
CREATE POLICY "wms_access_movimientos_read" 
ON movimientos_inventario 
FOR SELECT 
USING (can_manage_wms());

-- Política para INSERT - permitir crear movimientos a usuarios con acceso WMS  
CREATE POLICY "wms_access_movimientos_insert" 
ON movimientos_inventario 
FOR INSERT 
WITH CHECK (can_manage_wms());

-- Política para UPDATE - permitir actualizar movimientos a usuarios con acceso WMS
CREATE POLICY "wms_access_movimientos_update" 
ON movimientos_inventario 
FOR UPDATE 
USING (can_manage_wms());

-- Política para DELETE - solo admins pueden eliminar movimientos
CREATE POLICY "admin_only_movimientos_delete" 
ON movimientos_inventario 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);