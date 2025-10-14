-- Eliminar función anterior y recrear con tipo_custodio
DROP FUNCTION IF EXISTS public.get_custodio_vehicle_data(text);

CREATE OR REPLACE FUNCTION public.get_custodio_vehicle_data(p_custodio_nombre text)
RETURNS TABLE(
  marca text,
  modelo text,
  placa text,
  color text,
  tipo_custodio text,
  fuente text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pc.marca_vehiculo, 'No especificado') as marca,
    COALESCE(pc.modelo_vehiculo, 'No especificado') as modelo,
    COALESCE(pc.placa_vehiculo, 'Sin placa') as placa,
    COALESCE(pc.color_vehiculo, 'No especificado') as color,
    COALESCE(pc.tipo_custodio, 'custodio_vehiculo') as tipo_custodio,
    'database' as fuente
  FROM public.personal_custodia pc
  WHERE pc.nombre = p_custodio_nombre
    AND pc.activo = true
  LIMIT 1;
END;
$$;