-- Actualizar función get_current_user_role_secure para incluir planificador en prioridades
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  found_role TEXT;
BEGIN
  SELECT role INTO found_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
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
      WHEN 'planificador' THEN 9
      WHEN 'custodio' THEN 10
      WHEN 'bi' THEN 11
      WHEN 'monitoring_supervisor' THEN 12
      WHEN 'monitoring' THEN 13
      WHEN 'supply' THEN 14
      WHEN 'instalador' THEN 15
      WHEN 'soporte' THEN 16
      WHEN 'pending' THEN 17
      WHEN 'unverified' THEN 18
      ELSE 20
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;

COMMENT ON FUNCTION public.get_current_user_role_secure() IS 
'Devuelve el rol de mayor prioridad del usuario actual. SECURITY DEFINER para bypass RLS. Incluye todos los roles con priorización correcta.';