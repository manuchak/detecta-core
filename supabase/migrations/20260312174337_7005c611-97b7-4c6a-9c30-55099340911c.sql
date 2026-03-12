INSERT INTO public.role_permissions (role, permission_id, permission_type, allowed)
VALUES 
  ('customer_success', 'seguridad', 'page', true)
ON CONFLICT DO NOTHING;