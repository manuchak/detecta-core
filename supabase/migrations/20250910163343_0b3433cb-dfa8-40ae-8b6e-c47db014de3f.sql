-- Asignar rol de admin al usuario admin@admin.com para acceso completo
-- Este usuario debe tener acceso a planeación y todas las funcionalidades

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Buscar el usuario admin@admin.com
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  -- Si existe, asegurar que tenga rol de admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Rol de admin asignado correctamente al usuario admin@admin.com';
  ELSE
    RAISE NOTICE 'Usuario admin@admin.com no encontrado';
  END IF;
END $$;