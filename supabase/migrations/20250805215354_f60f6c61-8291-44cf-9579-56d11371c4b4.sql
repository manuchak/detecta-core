-- Crear políticas RLS para programacion_instalaciones
-- Permitir a usuarios autenticados ver todas las programaciones de instalación
CREATE POLICY "Usuarios autenticados pueden ver programaciones"
ON public.programacion_instalaciones
FOR SELECT
TO authenticated
USING (true);

-- Permitir a usuarios autenticados insertar programaciones
CREATE POLICY "Usuarios autenticados pueden crear programaciones"
ON public.programacion_instalaciones
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir a usuarios autenticados actualizar programaciones
CREATE POLICY "Usuarios autenticados pueden actualizar programaciones"
ON public.programacion_instalaciones
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir a usuarios autenticados eliminar programaciones
CREATE POLICY "Usuarios autenticados pueden eliminar programaciones"
ON public.programacion_instalaciones
FOR DELETE
TO authenticated
USING (true);