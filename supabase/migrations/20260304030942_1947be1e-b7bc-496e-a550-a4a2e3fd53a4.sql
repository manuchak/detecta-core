
-- Recreate missing INSERT/UPDATE/DELETE policies for LMS tables
-- These were lost when first migration failed and old ones got dropped

-- lms_cursos
CREATE POLICY "lms_admin_insert_cursos" ON public.lms_cursos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_admin_update_cursos" ON public.lms_cursos
  FOR UPDATE TO authenticated
  USING (public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_admin_delete_cursos" ON public.lms_cursos
  FOR DELETE TO authenticated
  USING (public.has_lms_admin_role(auth.uid()));

-- lms_modulos
CREATE POLICY "lms_admin_insert_modulos" ON public.lms_modulos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_admin_update_modulos" ON public.lms_modulos
  FOR UPDATE TO authenticated
  USING (public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_admin_delete_modulos" ON public.lms_modulos
  FOR DELETE TO authenticated
  USING (public.has_lms_admin_role(auth.uid()));

-- lms_contenidos
CREATE POLICY "lms_admin_insert_contenidos" ON public.lms_contenidos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_admin_update_contenidos" ON public.lms_contenidos
  FOR UPDATE TO authenticated
  USING (public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_admin_delete_contenidos" ON public.lms_contenidos
  FOR DELETE TO authenticated
  USING (public.has_lms_admin_role(auth.uid()));

-- lms_preguntas
CREATE POLICY "lms_admin_insert_preguntas" ON public.lms_preguntas
  FOR INSERT TO authenticated
  WITH CHECK (public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_admin_update_preguntas" ON public.lms_preguntas
  FOR UPDATE TO authenticated
  USING (public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_admin_delete_preguntas" ON public.lms_preguntas
  FOR DELETE TO authenticated
  USING (public.has_lms_admin_role(auth.uid()));

-- lms_inscripciones
CREATE POLICY "lms_select_inscripciones" ON public.lms_inscripciones
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_insert_inscripciones" ON public.lms_inscripciones
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid() OR public.has_lms_admin_role(auth.uid()));
CREATE POLICY "lms_update_inscripciones" ON public.lms_inscripciones
  FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid() OR public.has_lms_admin_role(auth.uid()));

-- lms_progreso SELECT (admin + own)
CREATE POLICY "lms_select_progreso" ON public.lms_progreso
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_inscripciones i
      WHERE i.id = lms_progreso.inscripcion_id AND i.usuario_id = auth.uid()
    )
    OR public.has_lms_admin_role(auth.uid())
  );

-- lms_certificados_plantillas
CREATE POLICY "lms_admin_all_certificados_plantillas" ON public.lms_certificados_plantillas
  FOR ALL TO authenticated
  USING (public.has_lms_admin_role(auth.uid()))
  WITH CHECK (public.has_lms_admin_role(auth.uid()));
