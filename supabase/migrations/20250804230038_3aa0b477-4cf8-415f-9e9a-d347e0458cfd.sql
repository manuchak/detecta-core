-- Actualizar la función can_manage_wms para incluir coordinador_operaciones
CREATE OR REPLACE FUNCTION public.can_manage_wms()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply', 'coordinador_operaciones')
  );
END;
$$;