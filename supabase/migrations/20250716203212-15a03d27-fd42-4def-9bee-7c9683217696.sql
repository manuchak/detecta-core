-- Reactivar RLS en programacion_instalaciones
ALTER TABLE public.programacion_instalaciones ENABLE ROW LEVEL SECURITY;

-- Eliminar las políticas anteriores problemáticas
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar programaciones" ON public.programacion_instalaciones;

-- Crear políticas RLS específicas y seguras
-- Política para permitir a coordinadores y admins crear programaciones
CREATE POLICY "Coordinadores y admins pueden crear programaciones"
ON public.programacion_instalaciones
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor')
  )
  OR 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
);

-- Política para permitir ver programaciones a usuarios autorizados
CREATE POLICY "Usuarios autorizados pueden ver programaciones"
ON public.programacion_instalaciones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor', 'instalador')
  )
  OR 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
  OR
  -- Los instaladores pueden ver sus propias asignaciones
  instalador_id = auth.uid()
);

-- Política para permitir actualizar programaciones
CREATE POLICY "Usuarios autorizados pueden actualizar programaciones"
ON public.programacion_instalaciones
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor')
  )
  OR 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
  OR
  -- Los instaladores pueden actualizar sus propias asignaciones
  instalador_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor')
  )
  OR 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
  OR
  instalador_id = auth.uid()
);

-- Política para eliminar (solo admins y coordinadores)
CREATE POLICY "Solo admins y coordinadores pueden eliminar programaciones"
ON public.programacion_instalaciones
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
  OR 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
);