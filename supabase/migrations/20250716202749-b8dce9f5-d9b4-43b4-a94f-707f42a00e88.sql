-- Crear políticas RLS para programacion_instalaciones
-- Primero verificar si RLS está habilitada
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'programacion_instalaciones';

-- Crear políticas para programacion_instalaciones
CREATE POLICY "Usuarios autenticados pueden crear programaciones"
ON public.programacion_instalaciones
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden ver programaciones"
ON public.programacion_instalaciones
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar programaciones"
ON public.programacion_instalaciones
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar programaciones"
ON public.programacion_instalaciones
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);