-- Fix the get_custodio_vehicle_data function with proper UUID handling
CREATE OR REPLACE FUNCTION get_custodio_vehicle_data(p_custodio_nombre text)
RETURNS TABLE(
  marca text,
  modelo text,
  placa text,
  color text,
  fuente text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Primero buscar en custodios_vehiculos (fixed: proper UUID join)
  RETURN QUERY
  SELECT 
    cv.marca,
    cv.modelo,
    cv.placa,
    COALESCE(cv.color, 'No especificado') as color,
    'custodios_vehiculos'::text as fuente
  FROM custodios_vehiculos cv
  JOIN custodios_operativos co ON cv.custodio_id = co.id
  WHERE co.nombre = p_custodio_nombre
    AND cv.es_principal = true
    AND cv.estado = 'activo'
  LIMIT 1;
  
  -- Si no encuentra, buscar en servicios_custodia (último servicio)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      CASE 
        WHEN sc.auto IS NOT NULL AND sc.auto != '' THEN
          COALESCE(split_part(sc.auto, ' ', 1), 'No especificado')
        ELSE 'No especificado'
      END as marca,
      CASE 
        WHEN sc.auto IS NOT NULL AND sc.auto != '' AND array_length(string_to_array(sc.auto, ' '), 1) > 1 THEN
          array_to_string((string_to_array(sc.auto, ' '))[2:], ' ')
        ELSE 'No especificado'
      END as modelo,
      COALESCE(sc.placa, 'Sin placa') as placa,
      'No especificado'::text as color,
      'servicios_custodia'::text as fuente
    FROM servicios_custodia sc
    WHERE sc.nombre_custodio = p_custodio_nombre
      AND sc.auto IS NOT NULL
      AND sc.auto != ''
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
    ORDER BY sc.fecha_hora_cita DESC
    LIMIT 1;
  END IF;
END;
$$;