-- =====================================================
-- FIX: Re-habilitar RLS seguro en programacion_instalaciones
-- Compatible con roles y funcionalidad existente
-- =====================================================

-- PASO 1: Eliminar políticas permisivas antiguas
DROP POLICY IF EXISTS "Authenticated users can read instalaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "Authenticated users can update instalaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "Authenticated users can delete instalaciones" ON public.programacion_instalaciones;
DROP POLICY IF EXISTS "instalaciones_access" ON public.programacion_instalaciones;

-- =====================================================
-- POLÍTICA 1: SELECT - Los instaladores ven solo sus asignaciones
-- =====================================================
CREATE POLICY "instaladores_ven_propias_asignaciones"
ON public.programacion_instalaciones
FOR SELECT
USING (
  -- Caso 1: Usuario es el instalador asignado
  instalador_id IN (
    SELECT id 
    FROM public.instaladores 
    WHERE user_id = auth.uid()
  )
  OR
  -- Caso 2: Usuario tiene rol de gestión/supervisión
  EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN (
      'owner',
      'admin',
      'monitoring_supervisor',
      'monitoring',
      'coordinador_operaciones',
      'supply_admin',
      'planificador'
    )
  )
);

-- =====================================================
-- POLÍTICA 2: INSERT - Solo roles autorizados pueden crear
-- =====================================================
CREATE POLICY "roles_autorizados_crean_instalaciones"
ON public.programacion_instalaciones
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN (
      'owner',
      'admin',
      'monitoring_supervisor',
      'monitoring',
      'coordinador_operaciones',
      'supply_admin',
      'planificador'
    )
  )
);

-- =====================================================
-- POLÍTICA 3: UPDATE - Instaladores actualizan sus asignaciones
--                       Roles de gestión actualizan cualquiera
-- =====================================================
CREATE POLICY "actualizar_instalaciones_autorizadas"
ON public.programacion_instalaciones
FOR UPDATE
USING (
  -- Caso 1: Instalador actualiza solo su asignación
  instalador_id IN (
    SELECT id 
    FROM public.instaladores 
    WHERE user_id = auth.uid()
  )
  OR
  -- Caso 2: Roles de gestión actualizan cualquiera
  EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN (
      'owner',
      'admin',
      'monitoring_supervisor',
      'monitoring',
      'coordinador_operaciones',
      'supply_admin',
      'planificador'
    )
  )
)
WITH CHECK (
  -- Mismas reglas para el nuevo estado
  instalador_id IN (
    SELECT id 
    FROM public.instaladores 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN (
      'owner',
      'admin',
      'monitoring_supervisor',
      'monitoring',
      'coordinador_operaciones',
      'supply_admin',
      'planificador'
    )
  )
);

-- =====================================================
-- POLÍTICA 4: DELETE - Solo administración puede eliminar
-- =====================================================
CREATE POLICY "solo_administracion_elimina_instalaciones"
ON public.programacion_instalaciones
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN (
      'owner',
      'admin',
      'coordinador_operaciones'
    )
  )
);

-- =====================================================
-- COMENTARIOS para documentación
-- =====================================================
COMMENT ON POLICY "instaladores_ven_propias_asignaciones" 
ON public.programacion_instalaciones IS 
'Instaladores ven solo sus asignaciones. Roles de gestión ven todas.';

COMMENT ON POLICY "roles_autorizados_crean_instalaciones" 
ON public.programacion_instalaciones IS 
'Solo roles de gestión y planificadores pueden crear programaciones.';

COMMENT ON POLICY "actualizar_instalaciones_autorizadas" 
ON public.programacion_instalaciones IS 
'Instaladores actualizan sus asignaciones. Gestión actualiza cualquiera.';

COMMENT ON POLICY "solo_administracion_elimina_instalaciones" 
ON public.programacion_instalaciones IS 
'Solo owner, admin y coordinador_operaciones pueden eliminar.';