-- Update get_available_roles_secure function to include 'planificador' role
CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN ARRAY[
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
    'planificador',
    'soporte',
    'pending',
    'unverified'
  ];
END;
$$;