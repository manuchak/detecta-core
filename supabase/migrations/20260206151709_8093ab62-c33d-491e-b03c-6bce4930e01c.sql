-- =====================================================
-- Fix: Custodian Role Priority + Cleanup Duplicate Roles
-- =====================================================
-- Problem: Custodians end up with both 'pending' and 'custodio' roles
-- because the email_confirmation trigger fires before the edge function
-- can assign the correct role, and both have same priority (10).
-- =====================================================

-- Step 1: Update role priority function to prioritize 'custodio' over 'pending'
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
    AND is_active = true
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'capacitacion_admin' THEN 4
      WHEN 'planificador' THEN 5
      WHEN 'coordinador_operaciones' THEN 6
      WHEN 'jefe_seguridad' THEN 7
      WHEN 'analista_seguridad' THEN 8
      WHEN 'supply_lead' THEN 9
      WHEN 'ejecutivo_ventas' THEN 10
      WHEN 'custodio' THEN 11
      WHEN 'bi' THEN 12
      WHEN 'monitoring_supervisor' THEN 13
      WHEN 'monitoring' THEN 14
      WHEN 'supply' THEN 15
      WHEN 'instalador' THEN 16
      WHEN 'soporte' THEN 17
      WHEN 'facturacion_admin' THEN 18
      WHEN 'facturacion' THEN 19
      WHEN 'finanzas_admin' THEN 20
      WHEN 'finanzas' THEN 21
      WHEN 'pending' THEN 98
      WHEN 'unverified' THEN 99
      ELSE 50
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;

-- Step 2: Clean up existing duplicate roles (users with both 'pending' and 'custodio')
DELETE FROM public.user_roles
WHERE role = 'pending'
AND user_id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'custodio'
);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_user_role_secure() TO authenticated;