
-- Corregir política RLS para configuracion_reportes
-- Mismo problema que configuracion_sensores

-- Primero, eliminar cualquier política existente problemática
DROP POLICY IF EXISTS "Allow all configuracion_reportes" ON configuracion_reportes;

-- Crear una nueva política más permisiva para INSERT
-- Permitir INSERT cuando el usuario está autenticado
CREATE POLICY "Allow authenticated insert configuracion_reportes" 
ON configuracion_reportes FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Crear política para SELECT/UPDATE/DELETE más restrictiva
CREATE POLICY "Allow owner and admin configuracion_reportes" 
ON configuracion_reportes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM servicios_monitoreo sm 
    WHERE sm.id = configuracion_reportes.servicio_id 
    AND (sm.ejecutivo_ventas_id = auth.uid() OR public.is_super_admin())
  )
);
