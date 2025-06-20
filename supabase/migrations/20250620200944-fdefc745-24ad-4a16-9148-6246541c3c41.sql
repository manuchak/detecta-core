
-- Agregar permisos para los nuevos roles: ejecutivo_ventas y custodio
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed) VALUES 
-- Ejecutivo de Ventas - Enfoque en creación y gestión de servicios
('ejecutivo_ventas', 'page', 'dashboard', true),
('ejecutivo_ventas', 'page', 'services', true),
('ejecutivo_ventas', 'page', 'leads', true),
('ejecutivo_ventas', 'action', 'create_service', true),
('ejecutivo_ventas', 'action', 'edit_service', true),
('ejecutivo_ventas', 'action', 'view_services', true),
('ejecutivo_ventas', 'action', 'manage_leads', true),
('ejecutivo_ventas', 'action', 'convert_lead_to_service', true),
('ejecutivo_ventas', 'action', 'schedule_services', true),

-- Custodio - Portal de evaluaciones e información personal
('custodio', 'page', 'dashboard', true),
('custodio', 'page', 'custodio_portal', true),
('custodio', 'page', 'evaluations', true),
('custodio', 'page', 'profile', true),
('custodio', 'action', 'complete_evaluations', true),
('custodio', 'action', 'upload_documents', true),
('custodio', 'action', 'update_personal_info', true),
('custodio', 'action', 'view_assignments', true),
('custodio', 'action', 'submit_reports', true)
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
    'ejecutivo_ventas',
    'custodio',
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
      WHEN 'ejecutivo_ventas' THEN 8
      WHEN 'custodio' THEN 9
      WHEN 'bi' THEN 10
      WHEN 'monitoring_supervisor' THEN 11
      WHEN 'monitoring' THEN 12
      WHEN 'supply' THEN 13
      WHEN 'instalador' THEN 14
      WHEN 'soporte' THEN 15
      WHEN 'pending' THEN 16
      WHEN 'unverified' THEN 17
      ELSE 18
    END;
END;
$$;

-- Crear función para verificar permisos de ejecutivo de ventas
CREATE OR REPLACE FUNCTION public.is_sales_executive_or_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones')
  );
END;
$$;

-- Crear función para verificar si es custodio
CREATE OR REPLACE FUNCTION public.is_custodio()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'custodio'
  );
END;
$$;

-- Crear función para verificar acceso a portal de custodio
CREATE OR REPLACE FUNCTION public.can_access_custodio_portal()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'custodio', 'coordinador_operaciones')
  );
END;
$$;
