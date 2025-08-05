-- Primero, eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver instalaciones" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear instalaciones" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar instalaciones" ON programacion_instalaciones;

-- Crear políticas RLS simples y seguras para programacion_instalaciones
CREATE POLICY "Enable read for authenticated users" 
ON programacion_instalaciones 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON programacion_instalaciones 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON programacion_instalaciones 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Enable delete for admins only" 
ON programacion_instalaciones 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);