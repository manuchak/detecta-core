
-- =============================================
-- v2.1.0 - Security Hardening (RLS Overhaul)
-- =============================================

-- Insert new version
INSERT INTO system_versions (
  id, version_number, version_name, release_date, version_type, status, 
  description, release_notes, created_at, updated_at
) VALUES (
  gen_random_uuid(), 
  '2.1.0', 
  'Security Hardening', 
  '2026-03-04', 
  'minor', 
  'released',
  'Corrección integral de políticas RLS en 5 módulos: Monitoreo, WMS, Facturación, CRM y Tickets. Creación de funciones SECURITY DEFINER centralizadas, eliminación de policies abiertas y roles obsoletos.',
  E'## Seguridad\n- Creadas 11 funciones SECURITY DEFINER centralizadas (has_monitoring_role, has_ticket_role, has_crm_role, has_facturacion_role, etc.)\n- Eliminadas policies abiertas en facturas, servicios_monitoreo, ordenes_compra, recepciones_mercancia, proveedores, stock_productos\n- Consolidadas 15 policies duplicadas en zonas_operacion_nacional → 2\n- Eliminado rol obsoleto "manager" de is_admin_bypass_rls y es_staff_incidentes\n\n## Módulos actualizados\n- **Monitoreo**: Restringido a roles autorizados (monitoring, monitoring_supervisor, coordinador_ops, jefe_seguridad, analista_seguridad, planificador)\n- **WMS**: Eliminadas ALL policies abiertas, mantenida estructura granular con user_has_wms_access/can_manage_wms actualizadas\n- **Facturación**: Endurecida tabla facturas (antes abierta a todos), migradas subqueries a funciones DEFINER\n- **CRM**: Migradas policies de deals, activities, stage_history a has_crm_role()\n- **Tickets**: Migradas 7 tablas a has_ticket_role/has_ticket_admin_role, eliminado rol "manager"\n\n## Frontend\n- Sidebar: Agregados roles a módulos Monitoreo y Tickets\n- Eliminado rol obsoleto "manager" de recruitment',
  now(), 
  now()
);

-- Register individual changes for the new version
DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM system_versions WHERE version_number = '2.1.0';

  -- Security changes
  INSERT INTO system_changes (version_id, change_type, module, title, description, impact_level) VALUES
  (v_id, 'security', 'administracion', 'Funciones SECURITY DEFINER centralizadas', 'Creadas 11 funciones helper: has_monitoring_role, has_monitoring_write_role, has_wms_role (user_has_wms_access actualizada), has_wms_write_role (can_manage_wms actualizada), has_ticket_role, has_ticket_admin_role, has_crm_role, has_facturacion_role, has_facturacion_write_role, es_staff_incidentes actualizada, is_admin_bypass_rls actualizada', 'critical'),
  (v_id, 'security', 'facturacion', 'Endurecimiento tabla facturas', 'Eliminadas 3 policies con true que permitían acceso sin restricción. Reemplazadas por has_facturacion_role/has_facturacion_write_role', 'critical'),
  (v_id, 'security', 'monitoreo', 'Restricción servicios_monitoreo', 'Eliminada policy ALL abierta a todos los autenticados. Reemplazada por SELECT con has_monitoring_role y UPDATE con has_monitoring_write_role', 'critical'),
  (v_id, 'security', 'wms', 'Eliminación policies ALL abiertas en WMS', 'Eliminadas policies abiertas en ordenes_compra, recepciones_mercancia, proveedores, stock_productos. Mantenida estructura granular existente', 'critical'),
  (v_id, 'security', 'monitoreo', 'Consolidación zonas_operacion_nacional', 'Eliminadas 15 policies duplicadas/conflictivas. Consolidadas en 2 policies limpias usando has_monitoring_role/has_monitoring_write_role', 'high'),
  (v_id, 'security', 'tickets', 'Migración RLS tickets a funciones DEFINER', 'Migradas 7 tablas (tickets, business_hours, escalation_rules, categorias, subcategorias, templates, respuestas) a has_ticket_role/has_ticket_admin_role', 'high'),
  (v_id, 'security', 'crm', 'Migración RLS CRM a funciones DEFINER', 'Migradas policies de crm_deals, crm_activities, crm_deal_stage_history a has_crm_role(). webhook_logs a check_admin_secure()', 'high'),
  (v_id, 'security', 'facturacion', 'Migración RLS facturación completa', 'Migradas audit_facturacion_accesos, pagos_proveedores_armados, pagos_instaladores a funciones DEFINER', 'high'),
  (v_id, 'bugfix', 'administracion', 'Eliminación rol obsoleto manager', 'Eliminado rol "manager" de is_admin_bypass_rls, es_staff_incidentes y policies de tickets. Reemplazado por coordinador_operaciones', 'medium'),
  (v_id, 'enhancement', 'navegacion', 'Sidebar roles para Monitoreo y Tickets', 'Agregadas restricciones de roles en el sidebar para módulos Monitoreo y Tickets. Eliminado rol manager de recruitment', 'low');
END $$;
