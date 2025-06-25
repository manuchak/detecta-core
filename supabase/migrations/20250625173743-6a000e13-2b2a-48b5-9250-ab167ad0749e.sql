
-- Corregir política RLS para configuracion_sensores
-- Usar las funciones existentes del sistema

-- Primero, eliminar la política existente que está causando problemas
DROP POLICY IF EXISTS "Allow all configuracion_sensores" ON configuracion_sensores;

-- Crear una nueva política más permisiva para INSERT
-- Permitir INSERT cuando el usuario está autenticado (se validará en la aplicación)
CREATE POLICY "Allow authenticated insert configuracion_sensores" 
ON configuracion_sensores FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Crear política para SELECT/UPDATE/DELETE más restrictiva
CREATE POLICY "Allow owner and admin configuracion_sensores" 
ON configuracion_sensores FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM servicios_monitoreo sm 
    WHERE sm.id = configuracion_sensores.servicio_id 
    AND (sm.ejecutivo_ventas_id = auth.uid() OR public.is_super_admin())
  )
);
