-- Corregir políticas RLS para programacion_instalaciones
-- Permitir que usuarios autenticados puedan ver instalaciones para el dashboard

-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "Ver instalaciones asignadas" ON programacion_instalaciones;
DROP POLICY IF EXISTS "instalaciones_access" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Crear instalaciones - solo supervisores" ON programacion_instalaciones;

-- Crear nuevas políticas más permisivas para el dashboard
CREATE POLICY "Usuarios autenticados pueden ver instalaciones"
ON programacion_instalaciones
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Coordinadores y admins pueden gestionar instalaciones"
ON programacion_instalaciones
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'monitoring_supervisor', 'monitoring')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'monitoring_supervisor', 'monitoring')
  )
);

CREATE POLICY "Instaladores pueden ver y actualizar sus instalaciones"
ON programacion_instalaciones
FOR ALL
TO authenticated
USING (
  instalador_id IN (
    SELECT id FROM instaladores 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  instalador_id IN (
    SELECT id FROM instaladores 
    WHERE user_id = auth.uid()
  )
);