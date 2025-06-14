
-- Migración para corregir políticas RLS y función de verificación de roles
-- Archivo: supabase/migrations/20250614141000-fix-coordinator-approval-rls.sql

-- Crear función para verificar si el usuario actual es coordinador o admin
CREATE OR REPLACE FUNCTION public.current_user_is_coordinator_or_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar si el usuario está autenticado
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si tiene rol de coordinador, admin u owner
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  );
END;
$$;

-- Actualizar política para aprobacion_coordinador
DROP POLICY IF EXISTS "Coordinadores y admins pueden ver y editar aprobaciones" ON public.aprobacion_coordinador;

CREATE POLICY "Coordinadores pueden crear aprobaciones" 
ON public.aprobacion_coordinador
FOR INSERT 
TO authenticated
WITH CHECK (public.current_user_is_coordinator_or_admin());

CREATE POLICY "Coordinadores pueden ver aprobaciones" 
ON public.aprobacion_coordinador
FOR SELECT 
TO authenticated
USING (public.current_user_is_coordinator_or_admin());

CREATE POLICY "Coordinadores pueden actualizar aprobaciones" 
ON public.aprobacion_coordinador
FOR UPDATE 
TO authenticated
USING (public.current_user_is_coordinator_or_admin())
WITH CHECK (public.current_user_is_coordinator_or_admin());

-- Asegurar que la política para servicios_monitoreo permita actualizaciones
DROP POLICY IF EXISTS "Admins y coordinadores pueden actualizar servicios" ON public.servicios_monitoreo;

CREATE POLICY "Coordinadores pueden actualizar estado de servicios" 
ON public.servicios_monitoreo
FOR UPDATE 
TO authenticated
USING (public.current_user_is_coordinator_or_admin())
WITH CHECK (public.current_user_is_coordinator_or_admin());

-- Otorgar permisos necesarios
GRANT EXECUTE ON FUNCTION public.current_user_is_coordinator_or_admin TO authenticated;
