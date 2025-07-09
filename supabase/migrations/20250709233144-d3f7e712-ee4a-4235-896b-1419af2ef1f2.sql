-- Agregar el permiso de gestión de landing page
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
VALUES 
  ('supply_admin', 'page', 'landing_management', true),
  ('admin', 'page', 'landing_management', true),
  ('owner', 'page', 'landing_management', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE 
SET 
  allowed = EXCLUDED.allowed,
  updated_at = now();