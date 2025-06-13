
-- Corregir políticas RLS para permitir que admins puedan realizar todas las operaciones
-- en las tablas de aprobación y análisis de riesgo

-- Actualizar política para aprobacion_coordinador
DROP POLICY IF EXISTS "Coordinadores pueden ver y editar aprobaciones" ON public.aprobacion_coordinador;

CREATE POLICY "Coordinadores y admins pueden ver y editar aprobaciones" 
ON public.aprobacion_coordinador
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

-- Actualizar política para analisis_riesgo_seguridad
DROP POLICY IF EXISTS "Analistas pueden ver y editar análisis de riesgo" ON public.analisis_riesgo_seguridad;

CREATE POLICY "Analistas y admins pueden ver y editar análisis de riesgo" 
ON public.analisis_riesgo_seguridad
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'analista_seguridad', 'jefe_seguridad')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'analista_seguridad', 'jefe_seguridad')
  )
);

-- Política para servicios_monitoreo para permitir actualizaciones de estado
DROP POLICY IF EXISTS "Admins y coordinadores pueden actualizar servicios" ON public.servicios_monitoreo;

CREATE POLICY "Admins y coordinadores pueden actualizar servicios" 
ON public.servicios_monitoreo
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'analista_seguridad', 'jefe_seguridad')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'analista_seguridad', 'jefe_seguridad')
  )
);

-- Función auxiliar para verificar permisos de coordinador de forma segura
CREATE OR REPLACE FUNCTION public.is_coordinator_or_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  );
END;
$$;

-- Función auxiliar para verificar permisos de analista de seguridad de forma segura
CREATE OR REPLACE FUNCTION public.is_security_analyst_or_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'analista_seguridad', 'jefe_seguridad')
  );
END;
$$;
