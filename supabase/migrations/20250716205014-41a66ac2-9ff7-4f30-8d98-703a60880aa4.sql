-- Crear función segura que no acceda a auth.users directamente
CREATE OR REPLACE FUNCTION public.is_admin_email_secure()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar directamente en user_roles si tiene rol admin
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- Eliminar políticas debug anteriores
DROP POLICY IF EXISTS "debug_crear_programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "debug_ver_programaciones" ON public.programacion_instalaciones;  
DROP POLICY IF EXISTS "debug_actualizar_programaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "debug_eliminar_programaciones" ON public.programacion_instalaciones;

-- Crear políticas simples sin acceso a auth.users
CREATE POLICY "simple_insert_programaciones"
ON public.programacion_instalaciones
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor')
  )
);

CREATE POLICY "simple_select_programaciones"
ON public.programacion_instalaciones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor', 'instalador')
  )
  OR instalador_id = auth.uid()
);

CREATE POLICY "simple_update_programaciones"
ON public.programacion_instalaciones
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'monitoring_supervisor')
  )
  OR instalador_id = auth.uid()
);

CREATE POLICY "simple_delete_programaciones"
ON public.programacion_instalaciones
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);