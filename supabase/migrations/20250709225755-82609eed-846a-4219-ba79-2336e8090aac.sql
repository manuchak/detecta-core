-- Insertar permisos específicos para el dashboard
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
VALUES 
  -- Admin tiene acceso completo al dashboard
  ('admin', 'page', 'dashboard', true),
  ('admin', 'feature', 'financial_data', true),
  ('admin', 'feature', 'analytics', true),
  ('admin', 'feature', 'metrics', true),
  
  -- Owner tiene acceso completo al dashboard
  ('owner', 'page', 'dashboard', true),
  ('owner', 'feature', 'financial_data', true),
  ('owner', 'feature', 'analytics', true),
  ('owner', 'feature', 'metrics', true),
  
  -- Supply admin tiene acceso limitado
  ('supply_admin', 'page', 'dashboard', true),
  ('supply_admin', 'feature', 'analytics', true),
  ('supply_admin', 'feature', 'metrics', true),
  ('supply_admin', 'feature', 'financial_data', false),
  
  -- BI tiene acceso a analytics
  ('bi', 'page', 'dashboard', true),
  ('bi', 'feature', 'analytics', true),
  ('bi', 'feature', 'metrics', true),
  ('bi', 'feature', 'financial_data', false),
  
  -- Coordinador operaciones acceso limitado
  ('coordinador_operaciones', 'page', 'dashboard', true),
  ('coordinador_operaciones', 'feature', 'analytics', false),
  ('coordinador_operaciones', 'feature', 'metrics', true),
  ('coordinador_operaciones', 'feature', 'financial_data', false),
  
  -- Jefe seguridad acceso limitado
  ('jefe_seguridad', 'page', 'dashboard', true),
  ('jefe_seguridad', 'feature', 'analytics', false),
  ('jefe_seguridad', 'feature', 'metrics', true),
  ('jefe_seguridad', 'feature', 'financial_data', false),
  
  -- Otros roles sin acceso
  ('analista_seguridad', 'page', 'dashboard', false),
  ('supply_lead', 'page', 'dashboard', false),
  ('ejecutivo_ventas', 'page', 'dashboard', false),
  ('monitoring_supervisor', 'page', 'dashboard', false),
  ('monitoring', 'page', 'dashboard', false),
  ('supply', 'page', 'dashboard', false),
  ('instalador', 'page', 'dashboard', false),
  ('soporte', 'page', 'dashboard', false),
  ('custodio', 'page', 'dashboard', false),
  ('pending', 'page', 'dashboard', false),
  ('unverified', 'page', 'dashboard', false)
  
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET
  allowed = EXCLUDED.allowed;