-- =============================================
-- Add 'capacitacion_admin' to ALL LMS RLS policies
-- =============================================

-- 1. lms_cursos: SELECT
DROP POLICY IF EXISTS "lms_cursos_select_publicados" ON public.lms_cursos;
CREATE POLICY "lms_cursos_select_publicados" ON public.lms_cursos
FOR SELECT TO authenticated
USING (
  (publicado = true AND activo = true)
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY(ARRAY['admin','owner','supply_admin','capacitacion_admin'])
    AND ur.is_active = true
  )
);

-- 2. lms_cursos: INSERT
DROP POLICY IF EXISTS "lms_cursos_insert_admin" ON public.lms_cursos;
CREATE POLICY "lms_cursos_insert_admin" ON public.lms_cursos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY(ARRAY['admin','owner','supply_admin','capacitacion_admin'])
    AND ur.is_active = true
  )
);

-- 3. lms_cursos: UPDATE
DROP POLICY IF EXISTS "lms_cursos_update_admin" ON public.lms_cursos;
CREATE POLICY "lms_cursos_update_admin" ON public.lms_cursos
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY(ARRAY['admin','owner','supply_admin','capacitacion_admin'])
    AND ur.is_active = true
  )
);

-- 4. lms_cursos: DELETE
DROP POLICY IF EXISTS "lms_cursos_delete_admin" ON public.lms_cursos;
CREATE POLICY "lms_cursos_delete_admin" ON public.lms_cursos
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY(ARRAY['admin','owner','supply_admin','capacitacion_admin'])
    AND ur.is_active = true
  )
);

-- 5. lms_inscripciones: SELECT
DROP POLICY IF EXISTS "lms_inscripciones_select" ON public.lms_inscripciones;
CREATE POLICY "lms_inscripciones_select" ON public.lms_inscripciones
FOR SELECT TO authenticated
USING (
  usuario_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY(ARRAY['admin','owner','supply_admin','capacitacion_admin','coordinador_operaciones','bi'])
    AND ur.is_active = true
  )
);

-- 6. lms_inscripciones: INSERT
DROP POLICY IF EXISTS "lms_inscripciones_insert" ON public.lms_inscripciones;
CREATE POLICY "lms_inscripciones_insert" ON public.lms_inscripciones
FOR INSERT TO authenticated
WITH CHECK (
  usuario_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY(ARRAY['admin','owner','supply_admin','capacitacion_admin'])
    AND ur.is_active = true
  )
);

-- 7. lms_inscripciones: UPDATE
DROP POLICY IF EXISTS "lms_inscripciones_update" ON public.lms_inscripciones;
CREATE POLICY "lms_inscripciones_update" ON public.lms_inscripciones
FOR UPDATE TO authenticated
USING (
  usuario_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY(ARRAY['admin','owner','supply_admin','capacitacion_admin'])
    AND ur.is_active = true
  )
);

-- 8. lms_progreso: SELECT
DROP POLICY IF EXISTS "lms_progreso_select" ON public.lms_progreso;
CREATE POLICY "lms_progreso_select" ON public.lms_progreso
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lms_inscripciones i
    WHERE i.id = lms_progreso.inscripcion_id
    AND (
      i.usuario_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = ANY(ARRAY['admin','owner','supply_admin','capacitacion_admin','bi'])
        AND ur.is_active = true
      )
    )
  )
);

-- 9. profiles: Add capacitacion_admin to existing view policy
DROP POLICY IF EXISTS "customer_success_view_profiles" ON public.profiles;
CREATE POLICY "customer_success_view_profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['admin','owner','customer_success','ejecutivo_ventas','coordinador_operaciones','capacitacion_admin','supply_admin'])
    AND (user_roles.is_active IS NULL OR user_roles.is_active = true)
  )
);
