
-- =============================================================
-- Insert ALL missing role_permissions for admin and owner
-- to ensure full system access regardless of PermissionProtectedRoute
-- Uses ON CONFLICT DO NOTHING to be idempotent
-- =============================================================

INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed) VALUES
-- ADMIN: All pages
('admin', 'page', 'admin', true),
('admin', 'page', 'settings', true),
('admin', 'page', 'crm', true),
('admin', 'page', 'facturacion', true),
('admin', 'page', 'legal', true),
('admin', 'page', 'customer_success', true),
('admin', 'page', 'services', true),
('admin', 'page', 'planeacion', true),
('admin', 'page', 'wms', true),
('admin', 'page', 'lms', true),
('admin', 'page', 'installers', true),
('admin', 'page', 'administration', true),
('admin', 'page', 'tickets', true),
('admin', 'page', 'seguridad', true),
('admin', 'page', 'executive_dashboard', true),
('admin', 'page', 'executive-dashboard', true),
('admin', 'page', 'customer_success_panorama', true),
('admin', 'page', 'customer_success_cartera', true),
('admin', 'page', 'customer_success_operativo', true),
('admin', 'page', 'customer_success_analisis', true),
('admin', 'page', 'customer_success_staff', true),
('admin', 'page', 'customer_success_config', true),

-- ADMIN: All features
('admin', 'feature', 'cs_dashboard', true),
('admin', 'feature', 'cs_portfolio', true),
('admin', 'feature', 'cs_complaints', true),
('admin', 'feature', 'cs_touchpoints', true),
('admin', 'feature', 'cs_metrics', true),
('admin', 'feature', 'cs_analytics', true),
('admin', 'feature', 'view_scheduled_services', true),

-- ADMIN: All modules
('admin', 'module', 'customer_success', true),
('admin', 'module', 'lms_cursos', true),
('admin', 'module', 'lms_modulos', true),
('admin', 'module', 'lms_contenidos', true),
('admin', 'module', 'lms_inscripciones', true),
('admin', 'module', 'lms_preguntas', true),
('admin', 'module', 'lms_reportes', true),
('admin', 'module', 'lms_certificados', true),

-- ADMIN: All actions
('admin', 'action', 'approve_candidates', true),
('admin', 'action', 'approve_services', true),
('admin', 'action', 'assign_armed_guard', true),
('admin', 'action', 'assign_custodian', true),
('admin', 'action', 'assign_leads', true),
('admin', 'action', 'assign_roles', true),
('admin', 'action', 'cancel_service', true),
('admin', 'action', 'complete_evaluations', true),
('admin', 'action', 'convert_lead_to_service', true),
('admin', 'action', 'create_service', true),
('admin', 'action', 'delete_user', true),
('admin', 'action', 'delete_users', true),
('admin', 'action', 'edit_service', true),
('admin', 'action', 'forensic_audit', true),
('admin', 'action', 'interview_candidates', true),
('admin', 'action', 'lead_approval', true),
('admin', 'action', 'lms_certificado_generate', true),
('admin', 'action', 'lms_contenido_create', true),
('admin', 'action', 'lms_contenido_delete', true),
('admin', 'action', 'lms_contenido_edit', true),
('admin', 'action', 'lms_curso_create', true),
('admin', 'action', 'lms_curso_delete', true),
('admin', 'action', 'lms_curso_edit', true),
('admin', 'action', 'lms_curso_publish', true),
('admin', 'action', 'lms_inscripcion_create', true),
('admin', 'action', 'lms_inscripcion_masiva', true),
('admin', 'action', 'lms_modulo_create', true),
('admin', 'action', 'lms_modulo_delete', true),
('admin', 'action', 'lms_modulo_edit', true),
('admin', 'action', 'lms_reporte_export', true),
('admin', 'action', 'lms_reporte_view', true),
('admin', 'action', 'manage_installers', true),
('admin', 'action', 'manage_leads', true),
('admin', 'action', 'manage_monitoring', true),
('admin', 'action', 'manage_permissions', true),
('admin', 'action', 'manage_supply', true),
('admin', 'action', 'manage_users', true),
('admin', 'action', 'register_installation', true),
('admin', 'action', 'risk_analysis', true),
('admin', 'action', 'save_interviews', true),
('admin', 'action', 'schedule_installations', true),
('admin', 'action', 'schedule_services', true),
('admin', 'action', 'security_approval', true),
('admin', 'action', 'submit_reports', true),
('admin', 'action', 'supervise_security', true),
('admin', 'action', 'update_installation_status', true),
('admin', 'action', 'update_personal_info', true),
('admin', 'action', 'upload_documents', true),
('admin', 'action', 'upload_evidence', true),
('admin', 'action', 'view_all_data', true),
('admin', 'action', 'view_assignments', true),
('admin', 'action', 'view_installations', true),
('admin', 'action', 'view_service_details', true),
('admin', 'action', 'view_services', true),

-- OWNER: All same as admin plus owner-specific
('owner', 'page', 'customer_success', true),
('owner', 'page', 'customer_success_panorama', true),
('owner', 'page', 'customer_success_cartera', true),
('owner', 'page', 'customer_success_operativo', true),
('owner', 'page', 'customer_success_analisis', true),
('owner', 'page', 'customer_success_staff', true),
('owner', 'page', 'customer_success_config', true),
('owner', 'page', 'crm', true),
('owner', 'page', 'facturacion', true),
('owner', 'page', 'legal', true),
('owner', 'page', 'services', true),
('owner', 'page', 'planeacion', true),
('owner', 'page', 'wms', true),
('owner', 'page', 'lms', true),
('owner', 'page', 'installers', true),
('owner', 'page', 'administration', true),
('owner', 'page', 'tickets', true),
('owner', 'page', 'seguridad', true),
('owner', 'page', 'executive_dashboard', true),
('owner', 'page', 'executive-dashboard', true),
('owner', 'feature', 'cs_dashboard', true),
('owner', 'feature', 'cs_portfolio', true),
('owner', 'feature', 'cs_complaints', true),
('owner', 'feature', 'cs_touchpoints', true),
('owner', 'feature', 'cs_metrics', true),
('owner', 'feature', 'cs_analytics', true),
('owner', 'feature', 'view_scheduled_services', true),
('owner', 'module', 'customer_success', true),
('owner', 'module', 'lms_cursos', true),
('owner', 'module', 'lms_modulos', true),
('owner', 'module', 'lms_contenidos', true),
('owner', 'module', 'lms_inscripciones', true),
('owner', 'module', 'lms_preguntas', true),
('owner', 'module', 'lms_reportes', true),
('owner', 'module', 'lms_certificados', true),
('owner', 'action', 'approve_candidates', true),
('owner', 'action', 'approve_services', true),
('owner', 'action', 'assign_armed_guard', true),
('owner', 'action', 'assign_custodian', true),
('owner', 'action', 'assign_leads', true),
('owner', 'action', 'cancel_service', true),
('owner', 'action', 'complete_evaluations', true),
('owner', 'action', 'convert_lead_to_service', true),
('owner', 'action', 'create_service', true),
('owner', 'action', 'edit_service', true),
('owner', 'action', 'forensic_audit', true),
('owner', 'action', 'interview_candidates', true),
('owner', 'action', 'lead_approval', true),
('owner', 'action', 'lms_certificado_generate', true),
('owner', 'action', 'lms_contenido_create', true),
('owner', 'action', 'lms_contenido_delete', true),
('owner', 'action', 'lms_contenido_edit', true),
('owner', 'action', 'lms_curso_create', true),
('owner', 'action', 'lms_curso_delete', true),
('owner', 'action', 'lms_curso_edit', true),
('owner', 'action', 'lms_curso_publish', true),
('owner', 'action', 'lms_inscripcion_create', true),
('owner', 'action', 'lms_inscripcion_masiva', true),
('owner', 'action', 'lms_modulo_create', true),
('owner', 'action', 'lms_modulo_delete', true),
('owner', 'action', 'lms_modulo_edit', true),
('owner', 'action', 'lms_reporte_export', true),
('owner', 'action', 'lms_reporte_view', true),
('owner', 'action', 'manage_installers', true),
('owner', 'action', 'manage_leads', true),
('owner', 'action', 'manage_monitoring', true),
('owner', 'action', 'manage_supply', true),
('owner', 'action', 'register_installation', true),
('owner', 'action', 'risk_analysis', true),
('owner', 'action', 'save_interviews', true),
('owner', 'action', 'schedule_installations', true),
('owner', 'action', 'schedule_services', true),
('owner', 'action', 'security_approval', true),
('owner', 'action', 'submit_reports', true),
('owner', 'action', 'supervise_security', true),
('owner', 'action', 'update_installation_status', true),
('owner', 'action', 'update_personal_info', true),
('owner', 'action', 'upload_documents', true),
('owner', 'action', 'upload_evidence', true),
('owner', 'action', 'view_assignments', true),
('owner', 'action', 'view_installations', true),
('owner', 'action', 'view_service_details', true),
('owner', 'action', 'view_services', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET allowed = EXCLUDED.allowed;

-- =============================================================
-- Fix get_current_user_role_secure: add customer_success with explicit priority
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND (is_active IS NULL OR is_active = true)
  ORDER BY
    CASE role::text
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'capacitacion_admin' THEN 4
      WHEN 'coordinador_operaciones' THEN 5
      WHEN 'jefe_seguridad' THEN 6
      WHEN 'analista_seguridad' THEN 7
      WHEN 'supply_lead' THEN 8
      WHEN 'ejecutivo_ventas' THEN 9
      WHEN 'custodio' THEN 10
      WHEN 'armado' THEN 11
      WHEN 'bi' THEN 12
      WHEN 'monitoring_supervisor' THEN 13
      WHEN 'monitoring' THEN 14
      WHEN 'supply' THEN 15
      WHEN 'instalador' THEN 16
      WHEN 'soporte' THEN 17
      WHEN 'planificador' THEN 18
      WHEN 'facturacion_admin' THEN 19
      WHEN 'facturacion' THEN 20
      WHEN 'finanzas_admin' THEN 21
      WHEN 'finanzas' THEN 22
      WHEN 'customer_success' THEN 23
      WHEN 'pending' THEN 98
      WHEN 'unverified' THEN 99
      ELSE 50
    END
  LIMIT 1;
$$;
