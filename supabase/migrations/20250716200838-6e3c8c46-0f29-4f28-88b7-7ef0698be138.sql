-- Corregir el error de permisos en analisis_riesgo_seguridad
-- El problema parece estar en las políticas RLS que intentan acceder a la tabla users

-- Primero, verificar y actualizar la función que verifica roles de seguridad
CREATE OR REPLACE FUNCTION public.is_security_analyst_or_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si es admin@admin.com directamente desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles directamente (sin usar RLS policies)
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'analista_seguridad', 'jefe_seguridad')
  );
END;
$$;

-- Eliminar y recrear las políticas de analisis_riesgo_seguridad para evitar problemas de RLS
DROP POLICY IF EXISTS "Analistas y admins pueden ver y editar análisis de riesgo" ON public.analisis_riesgo_seguridad;

-- Política para SELECT
CREATE POLICY "Analistas pueden ver análisis de riesgo" 
ON public.analisis_riesgo_seguridad
FOR SELECT 
USING (public.is_security_analyst_or_admin());

-- Política para INSERT
CREATE POLICY "Analistas pueden crear análisis de riesgo" 
ON public.analisis_riesgo_seguridad
FOR INSERT 
WITH CHECK (
  public.is_security_analyst_or_admin() AND
  analista_id = auth.uid()
);

-- Política para UPDATE
CREATE POLICY "Analistas pueden actualizar análisis de riesgo" 
ON public.analisis_riesgo_seguridad
FOR UPDATE 
USING (
  public.is_security_analyst_or_admin() AND
  (analista_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'jefe_seguridad')
  ))
)
WITH CHECK (
  public.is_security_analyst_or_admin() AND
  (analista_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'jefe_seguridad')
  ))
);

-- Política para DELETE
CREATE POLICY "Solo admins pueden eliminar análisis de riesgo" 
ON public.analisis_riesgo_seguridad
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);