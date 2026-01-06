-- =====================================================
-- Crear permisos para rol capacitacion_admin (gestión LMS)
-- El rol se define en role_permissions, no requiere user_roles placeholder
-- =====================================================

INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed) VALUES
  -- Páginas base
  ('capacitacion_admin', 'page', 'dashboard', true),
  ('capacitacion_admin', 'page', 'profile', true),
  ('capacitacion_admin', 'page', 'home', true),
  -- Páginas LMS
  ('capacitacion_admin', 'page', 'lms', true),
  ('capacitacion_admin', 'page', 'lms_admin', true),
  ('capacitacion_admin', 'page', 'lms_reportes', true),
  -- Módulos LMS
  ('capacitacion_admin', 'module', 'lms_cursos', true),
  ('capacitacion_admin', 'module', 'lms_modulos', true),
  ('capacitacion_admin', 'module', 'lms_contenidos', true),
  ('capacitacion_admin', 'module', 'lms_inscripciones', true),
  ('capacitacion_admin', 'module', 'lms_reportes', true),
  ('capacitacion_admin', 'module', 'lms_certificados', true),
  ('capacitacion_admin', 'module', 'lms_preguntas', true),
  -- Acciones LMS
  ('capacitacion_admin', 'action', 'lms_curso_create', true),
  ('capacitacion_admin', 'action', 'lms_curso_edit', true),
  ('capacitacion_admin', 'action', 'lms_curso_delete', true),
  ('capacitacion_admin', 'action', 'lms_curso_publish', true),
  ('capacitacion_admin', 'action', 'lms_modulo_create', true),
  ('capacitacion_admin', 'action', 'lms_modulo_edit', true),
  ('capacitacion_admin', 'action', 'lms_modulo_delete', true),
  ('capacitacion_admin', 'action', 'lms_contenido_create', true),
  ('capacitacion_admin', 'action', 'lms_contenido_edit', true),
  ('capacitacion_admin', 'action', 'lms_contenido_delete', true),
  ('capacitacion_admin', 'action', 'lms_inscripcion_create', true),
  ('capacitacion_admin', 'action', 'lms_inscripcion_masiva', true),
  ('capacitacion_admin', 'action', 'lms_certificado_generate', true),
  ('capacitacion_admin', 'action', 'lms_reporte_view', true),
  ('capacitacion_admin', 'action', 'lms_reporte_export', true)
ON CONFLICT DO NOTHING;