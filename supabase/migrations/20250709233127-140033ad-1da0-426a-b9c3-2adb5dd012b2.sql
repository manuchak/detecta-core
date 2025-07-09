-- Agregar el permiso de gestión de landing page
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed, description)
VALUES 
  ('supply_admin', 'page', 'landing_management', true, 'Acceso a la gestión y configuración de la página de landing'),
  ('admin', 'page', 'landing_management', true, 'Acceso a la gestión y configuración de la página de landing'),
  ('owner', 'page', 'landing_management', true, 'Acceso a la gestión y configuración de la página de landing')
ON CONFLICT (role, permission_type, permission_id) DO UPDATE 
SET 
  allowed = EXCLUDED.allowed,
  description = EXCLUDED.description,
  updated_at = now();