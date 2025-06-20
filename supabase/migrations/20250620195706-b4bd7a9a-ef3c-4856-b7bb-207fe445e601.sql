
-- Crear permisos básicos para cada nuevo rol sin usar user_id placeholder
-- Solo insertamos en role_permissions que no requiere user_id válido

INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed) VALUES 
-- Coordinador de Operaciones - Acceso completo a servicios e instaladores
('coordinador_operaciones', 'page', 'dashboard', true),
('coordinador_operaciones', 'page', 'services', true),
('coordinador_operaciones', 'page', 'installers', true),
('coordinador_operaciones', 'page', 'monitoring', true),
('coordinador_operaciones', 'action', 'approve_services', true),
('coordinador_operaciones', 'action', 'manage_installers', true),
('coordinador_operaciones', 'action', 'schedule_installations', true),

-- Analista de Seguridad - Enfoque en aprobaciones de seguridad
('analista_seguridad', 'page', 'dashboard', true),
('analista_seguridad', 'page', 'services', true),
('analista_seguridad', 'page', 'monitoring', true),
('analista_seguridad', 'action', 'security_approval', true),
('analista_seguridad', 'action', 'risk_analysis', true),
('analista_seguridad', 'action', 'view_services', true),

-- Jefe de Seguridad - Supervisión completa de seguridad
('jefe_seguridad', 'page', 'dashboard', true),
('jefe_seguridad', 'page', 'services', true),
('jefe_seguridad', 'page', 'monitoring', true),
('jefe_seguridad', 'page', 'forensic_audit', true),
('jefe_seguridad', 'action', 'security_approval', true),
('jefe_seguridad', 'action', 'risk_analysis', true),
('jefe_seguridad', 'action', 'supervise_security', true),
('jefe_seguridad', 'action', 'forensic_audit', true),

-- Supply Lead - Gestión de leads
('supply_lead', 'page', 'dashboard', true),
('supply_lead', 'page', 'leads', true),
('supply_lead', 'page', 'monitoring', true),
('supply_lead', 'action', 'manage_leads', true),
('supply_lead', 'action', 'lead_approval', true),
('supply_lead', 'action', 'assign_leads', true),

-- Instalador - Control de instalaciones
('instalador', 'page', 'dashboard', true),
('instalador', 'page', 'installers_portal', true),
('instalador', 'action', 'view_installations', true),
('instalador', 'action', 'register_installation', true),
('instalador', 'action', 'update_installation_status', true)
ON CONFLICT (role, permission_type, permission_id) DO NOTHING;

-- Actualizar la función get_available_roles_secure para incluir los nuevos roles
CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS TABLE(role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT unnest(ARRAY[
    'owner',
    'admin', 
    'supply_admin',
    'coordinador_operaciones',
    'jefe_seguridad',
    'analista_seguridad',
    'supply_lead',
    'bi',
    'monitoring_supervisor',
    'monitoring',
    'supply',
    'instalador',
    'soporte',
    'pending',
    'unverified'
  ]::text[]) as role
  ORDER BY 
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'coordinador_operaciones' THEN 4
      WHEN 'jefe_seguridad' THEN 5
      WHEN 'analista_seguridad' THEN 6
      WHEN 'supply_lead' THEN 7
      WHEN 'bi' THEN 8
      WHEN 'monitoring_supervisor' THEN 9
      WHEN 'monitoring' THEN 10
      WHEN 'supply' THEN 11
      WHEN 'instalador' THEN 12
      WHEN 'soporte' THEN 13
      WHEN 'pending' THEN 14
      WHEN 'unverified' THEN 15
      ELSE 16
    END;
END;
$$;

-- Crear función específica para verificar roles de coordinador
CREATE OR REPLACE FUNCTION public.is_coordinator_or_security()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'jefe_seguridad', 'analista_seguridad')
  );
END;
$$;

-- Crear función para verificar permisos de instalador
CREATE OR REPLACE FUNCTION public.is_installer_or_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'instalador')
  );
END;
$$;

-- Crear función para verificar permisos de supply
CREATE OR REPLACE FUNCTION public.is_supply_manager()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  );
END;
$$;
