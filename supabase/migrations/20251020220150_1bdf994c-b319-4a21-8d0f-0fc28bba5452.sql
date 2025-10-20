-- ===================================================================
-- CORRECCIÓN: Actualizar función get_custodio_vehicle_data
-- ===================================================================
-- La función original consultaba personal_custodia que no existe
-- Ahora consultará custodios_vehiculos con JOIN a pc_custodios

-- Función RPC para obtener datos del vehículo del custodio
-- Por ahora retorna datos fallback porque pc_custodios está vacía
-- Una vez que se migren los datos a pc_custodios, esta función funcionará correctamente
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
  -- Intentar obtener datos de pc_custodios + custodios_vehiculos
  RETURN QUERY
  SELECT 
    COALESCE(cv.marca, 'No especificado') as marca,
    COALESCE(cv.modelo, 'No especificado') as modelo,
    COALESCE(cv.placa, 'Sin placa') as placa,
    COALESCE(cv.color, 'No especificado') as color,
    COALESCE(pc.tipo_custodia::text, 'custodio_vehiculo') as tipo_custodio,
    CASE 
      WHEN cv.id IS NOT NULL THEN 'database'
      ELSE 'fallback'
    END as fuente
  FROM public.pc_custodios pc
  LEFT JOIN public.custodios_vehiculos cv ON pc.id = cv.custodio_id AND cv.es_principal = true
  WHERE pc.nombre = p_custodio_nombre
    AND pc.estado = 'activo'
  LIMIT 1;
  
  -- Si no hay resultados (pc_custodios está vacío), retornar datos de fallback
  -- para que la UI no falle
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'No especificado'::text as marca,
      'No especificado'::text as modelo,
      'Sin placa'::text as placa,
      'No especificado'::text as color,
      'custodio_vehiculo'::text as tipo_custodio,
      'fallback'::text as fuente
    WHERE EXISTS (
      SELECT 1 FROM public.custodios_operativos co
      WHERE co.nombre = p_custodio_nombre
      AND co.estado = 'activo'
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_custodio_vehicle_data(text) IS 
'Obtiene datos del vehículo y tipo de custodio. Consulta pc_custodios + custodios_vehiculos. Retorna fallback si el custodio existe en custodios_operativos pero no en pc_custodios.';

-- Crear función auxiliar para verificar qué custodios necesitan migración a pc_custodios
CREATE OR REPLACE FUNCTION public.get_custodios_pendientes_migracion()
RETURNS TABLE(
  nombre text,
  estado text,
  vehiculo_propio boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    co.nombre,
    co.estado,
    co.vehiculo_propio
  FROM public.custodios_operativos co
  WHERE co.estado = 'activo'
    AND NOT EXISTS (
      SELECT 1 FROM public.pc_custodios pc
      WHERE pc.nombre = co.nombre
    )
  ORDER BY co.nombre;
END;
$$;

COMMENT ON FUNCTION public.get_custodios_pendientes_migracion() IS 
'Lista custodios que existen en custodios_operativos pero no en pc_custodios. Útil para identificar datos pendientes de migración.';