-- Corregir las políticas RLS para las nuevas tablas
-- Primero, eliminar las políticas existentes problemáticas
DROP POLICY IF EXISTS "Solo admins pueden gestionar empresas instaladoras" ON public.empresas_instaladoras;
DROP POLICY IF EXISTS "Solo admins pueden gestionar contactos de empresa" ON public.contactos_empresa;

-- Crear políticas RLS más específicas para empresas instaladoras
CREATE POLICY "Admins pueden gestionar empresas instaladoras"
  ON public.empresas_instaladoras
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  );

-- Crear políticas RLS más específicas para contactos de empresa
CREATE POLICY "Admins pueden gestionar contactos de empresa"
  ON public.contactos_empresa
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  );

-- Asegurar que las políticas de instaladores incluyan los nuevos campos
DROP POLICY IF EXISTS "Instaladores pueden ver sus propios datos" ON public.instaladores;
DROP POLICY IF EXISTS "Instaladores pueden actualizar sus propios datos" ON public.instaladores;
DROP POLICY IF EXISTS "Admins pueden gestionar todos los instaladores" ON public.instaladores;

-- Recrear políticas de instaladores con los nuevos campos
CREATE POLICY "Instaladores pueden ver sus propios datos"
  ON public.instaladores
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Instaladores pueden actualizar sus propios datos"
  ON public.instaladores
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins pueden gestionar todos los instaladores"
  ON public.instaladores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  );

CREATE POLICY "Cualquier usuario autenticado puede crear instaladores"
  ON public.instaladores
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Asegurar que las políticas de lectura general funcionen
CREATE POLICY "Usuarios autenticados pueden ver instaladores activos"
  ON public.instaladores
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND estado_afiliacion = 'activo' 
    AND documentacion_completa = true
  );

-- Función para verificar permisos admin de manera segura
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  is_admin_role boolean := false;
BEGIN
  -- Obtener usuario actual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar email admin directamente desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Si es admin@admin.com, permitir acceso
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles de manera directa (sin usar políticas RLS)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  ) INTO is_admin_role;
  
  RETURN is_admin_role;
END;
$$;

-- Actualizar las funciones con SET search_path para seguridad
ALTER FUNCTION public.update_empresas_instaladoras_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_contactos_empresa_updated_at() SET search_path TO 'public';