-- Agregar permisos necesarios para el rol 'planificador'
-- Este rol necesita poder gestionar servicios, asignar recursos y ver detalles

-- Permiso para editar servicios
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
VALUES ('planificador', 'action', 'edit_service', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET allowed = true;

-- Permiso para cancelar servicios
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
VALUES ('planificador', 'action', 'cancel_service', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET allowed = true;

-- Permiso para asignar custodios
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
VALUES ('planificador', 'action', 'assign_custodian', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET allowed = true;

-- Permiso para asignar armados
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
VALUES ('planificador', 'action', 'assign_armed_guard', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET allowed = true;

-- Permiso para ver detalles de servicios
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
VALUES ('planificador', 'action', 'view_service_details', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET allowed = true;

-- Permiso para acceder a la página de planeación
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
VALUES ('planificador', 'page', 'planeacion', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET allowed = true;

-- Permiso para ver servicios programados
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
VALUES ('planificador', 'feature', 'view_scheduled_services', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET allowed = true;