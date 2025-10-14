
-- ===================================================================
-- FUNCIONES RPC PARA OBTENER DATOS DE VEHÍCULOS
-- ===================================================================

-- Función RPC para obtener datos del vehículo del custodio
-- Incluye tipo_custodio para determinar si debe mostrarse el vehículo
-- Solo custodio_vehiculo y armado_vehiculo tienen vehículo propio
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

-- Función RPC segura para obtener marcas de vehículos
CREATE OR REPLACE FUNCTION public.get_marcas_vehiculos_safe()
RETURNS TABLE(
  id uuid,
  nombre text,
  pais_origen text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.id,
    mv.nombre,
    COALESCE(mv.pais_origen, 'No especificado') as pais_origen
  FROM public.marcas_vehiculos mv
  WHERE mv.activo = true
  ORDER BY mv.nombre ASC;
END;
$$;

-- Función RPC segura para obtener modelos por marca
CREATE OR REPLACE FUNCTION public.get_modelos_por_marca_safe(p_marca_nombre text)
RETURNS TABLE(
  id uuid,
  nombre text,
  tipo_vehiculo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mdv.id,
    mdv.nombre,
    COALESCE(mdv.tipo_vehiculo, 'No especificado') as tipo_vehiculo
  FROM public.modelos_vehiculos mdv
  JOIN public.marcas_vehiculos mv ON mdv.marca_id = mv.id
  WHERE mv.nombre = p_marca_nombre
    AND mdv.activo = true
    AND mv.activo = true
  ORDER BY mdv.nombre ASC;
END;
$$;
