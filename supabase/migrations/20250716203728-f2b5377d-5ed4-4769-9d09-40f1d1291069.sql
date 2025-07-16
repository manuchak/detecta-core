-- Verificar que el usuario admin tenga rol asignado
DO $$
DECLARE 
    admin_user_id uuid;
BEGIN
    -- Buscar admin@admin.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@admin.com';
    
    -- Si existe, asegurarse de que tenga rol de administrador
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin user role ensured for: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found';
    END IF;
END $$;

-- Simplificar las políticas de programacion_instalaciones temporalmente para debugging
DROP POLICY IF EXISTS "Coordinadores y admins pueden crear programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "Solo admins y coordinadores pueden eliminar programaciones" ON public.programacion_instalaciones;

-- Crear políticas más simples para debugging
CREATE POLICY "debug_crear_programaciones"
ON public.programacion_instalaciones
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permitir a admin@admin.com siempre
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
  OR
  -- Permitir a usuarios con roles específicos
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor')
  )
);

CREATE POLICY "debug_ver_programaciones"
ON public.programacion_instalaciones
FOR SELECT
TO authenticated
USING (
  -- Permitir a admin@admin.com siempre
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
  OR
  -- Permitir a usuarios con roles específicos
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor', 'instalador')
  )
  OR
  -- Los instaladores pueden ver sus propias asignaciones
  instalador_id = auth.uid()
);

CREATE POLICY "debug_actualizar_programaciones"
ON public.programacion_instalaciones
FOR UPDATE
TO authenticated
USING (
  -- Permitir a admin@admin.com siempre
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
  OR
  -- Permitir a usuarios con roles específicos
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor')
  )
  OR
  -- Los instaladores pueden actualizar sus propias asignaciones
  instalador_id = auth.uid()
);

CREATE POLICY "debug_eliminar_programaciones"
ON public.programacion_instalaciones
FOR DELETE
TO authenticated
USING (
  -- Permitir a admin@admin.com siempre
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
  OR
  -- Solo admins y coordinadores pueden eliminar
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);