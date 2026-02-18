CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN ARRAY[
    'owner', 'admin', 'supply_admin', 'capacitacion_admin',
    'coordinador_operaciones', 'jefe_seguridad', 'analista_seguridad',
    'supply_lead', 'ejecutivo_ventas', 'custodio', 'bi',
    'monitoring_supervisor', 'monitoring', 'supply', 'instalador',
    'planificador', 'soporte', 'facturacion_admin', 'facturacion',
    'finanzas_admin', 'finanzas', 'customer_success',
    'pending', 'unverified'
  ];
END;
$$;