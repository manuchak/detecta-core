
-- Drop OLD LMS policies (coexisting with new lms_admin_* ones)
DROP POLICY IF EXISTS "lms_cursos_select_publicados" ON public.lms_cursos;
DROP POLICY IF EXISTS "lms_cursos_insert_admin" ON public.lms_cursos;
DROP POLICY IF EXISTS "lms_cursos_update_admin" ON public.lms_cursos;
DROP POLICY IF EXISTS "lms_cursos_delete_admin" ON public.lms_cursos;

DROP POLICY IF EXISTS "lms_modulos_select" ON public.lms_modulos;
DROP POLICY IF EXISTS "lms_modulos_insert_admin" ON public.lms_modulos;
DROP POLICY IF EXISTS "lms_modulos_update_admin" ON public.lms_modulos;
DROP POLICY IF EXISTS "lms_modulos_delete_admin" ON public.lms_modulos;

DROP POLICY IF EXISTS "lms_contenidos_select" ON public.lms_contenidos;
DROP POLICY IF EXISTS "lms_contenidos_insert_admin" ON public.lms_contenidos;
DROP POLICY IF EXISTS "lms_contenidos_update_admin" ON public.lms_contenidos;
DROP POLICY IF EXISTS "lms_contenidos_delete_admin" ON public.lms_contenidos;

DROP POLICY IF EXISTS "lms_preguntas_select" ON public.lms_preguntas;
DROP POLICY IF EXISTS "lms_preguntas_insert_admin" ON public.lms_preguntas;
DROP POLICY IF EXISTS "lms_preguntas_update_admin" ON public.lms_preguntas;
DROP POLICY IF EXISTS "lms_preguntas_delete_admin" ON public.lms_preguntas;

DROP POLICY IF EXISTS "lms_inscripciones_select" ON public.lms_inscripciones;
DROP POLICY IF EXISTS "lms_inscripciones_insert" ON public.lms_inscripciones;
DROP POLICY IF EXISTS "lms_inscripciones_update" ON public.lms_inscripciones;

DROP POLICY IF EXISTS "lms_progreso_select" ON public.lms_progreso;

DROP POLICY IF EXISTS "Admin gestiona plantillas certificados" ON public.lms_certificados_plantillas;

-- Fix SELECT policies to also allow published course access for students

-- lms_cursos: published+active OR admin
DROP POLICY IF EXISTS "lms_admin_select_cursos" ON public.lms_cursos;
CREATE POLICY "lms_admin_select_cursos" ON public.lms_cursos
  FOR SELECT TO authenticated
  USING (
    (publicado = true AND activo = true)
    OR public.has_lms_admin_role(auth.uid())
  );

-- lms_modulos: published parent OR admin
DROP POLICY IF EXISTS "lms_admin_select_modulos" ON public.lms_modulos;
CREATE POLICY "lms_admin_select_modulos" ON public.lms_modulos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_cursos c
      WHERE c.id = lms_modulos.curso_id AND c.publicado = true
    )
    OR public.has_lms_admin_role(auth.uid())
  );

-- lms_contenidos: published parent OR admin
DROP POLICY IF EXISTS "lms_admin_select_contenidos" ON public.lms_contenidos;
CREATE POLICY "lms_admin_select_contenidos" ON public.lms_contenidos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lms_modulos m
      JOIN public.lms_cursos c ON c.id = m.curso_id
      WHERE m.id = lms_contenidos.modulo_id AND c.publicado = true
    )
    OR public.has_lms_admin_role(auth.uid())
  );

-- lms_preguntas: active OR admin
DROP POLICY IF EXISTS "lms_admin_select_preguntas" ON public.lms_preguntas;
CREATE POLICY "lms_admin_select_preguntas" ON public.lms_preguntas
  FOR SELECT TO authenticated
  USING (
    activa = true
    OR public.has_lms_admin_role(auth.uid())
  );
