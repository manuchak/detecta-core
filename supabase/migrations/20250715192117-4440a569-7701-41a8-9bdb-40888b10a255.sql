-- Actualizar la función get_users_with_roles_secure para incluir supply_admin
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  role text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar que el usuario actual tenga permisos
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'analista_seguridad', 'coordinador_operaciones', 'jefe_seguridad')
  ) AND NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  ) THEN
    RAISE EXCEPTION 'Access denied. Insufficient privileges.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    COALESCE(p.display_name, p.email) as display_name,
    ur.role,
    p.created_at
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'analista_seguridad', 'custodio', 'coordinador_operaciones', 'jefe_seguridad')
  ORDER BY p.email;
END;
$$;