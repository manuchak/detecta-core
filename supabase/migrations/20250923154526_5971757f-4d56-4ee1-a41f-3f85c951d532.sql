-- Fix the migration function with proper type casting
CREATE OR REPLACE FUNCTION migrate_vehicle_data_from_services()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  record_count INTEGER := 0;
  custodio_record RECORD;
BEGIN
  -- Migrar datos únicos de vehículos por custodio desde servicios_custodia
  FOR custodio_record IN 
    WITH vehicle_data AS (
      SELECT DISTINCT ON (nombre_custodio)
        nombre_custodio,
        auto,
        placa,
        MAX(fecha_hora_cita) OVER (PARTITION BY nombre_custodio) as ultima_fecha
      FROM servicios_custodia 
      WHERE nombre_custodio IS NOT NULL 
        AND nombre_custodio != '' 
        AND nombre_custodio != '#N/A'
        AND nombre_custodio != 'Sin Asignar'
        AND auto IS NOT NULL
        AND auto != ''
        AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
      ORDER BY nombre_custodio, fecha_hora_cita DESC
    )
    SELECT * FROM vehicle_data
  LOOP
    -- Verificar si ya existe un vehículo para este custodio
    IF NOT EXISTS (
      SELECT 1 FROM custodios_vehiculos cv
      JOIN custodios_operativos co ON cv.custodio_id = co.id::text
      WHERE co.nombre = custodio_record.nombre_custodio
    ) THEN
      
      -- Parsear marca y modelo del campo 'auto'
      DECLARE
        marca_extraida TEXT;
        modelo_extraido TEXT;
        partes TEXT[];
      BEGIN
        partes := string_to_array(trim(custodio_record.auto), ' ');
        
        IF array_length(partes, 1) >= 2 THEN
          marca_extraida := partes[1];
          modelo_extraido := array_to_string(partes[2:array_length(partes, 1)], ' ');
        ELSIF array_length(partes, 1) = 1 THEN
          marca_extraida := partes[1];
          modelo_extraido := 'No especificado';
        ELSE
          marca_extraida := 'No especificado';
          modelo_extraido := 'No especificado';
        END IF;
        
        -- Buscar custodio en custodios_operativos
        DECLARE
          custodio_id_found UUID;
        BEGIN
          SELECT id INTO custodio_id_found
          FROM custodios_operativos
          WHERE nombre = custodio_record.nombre_custodio
          LIMIT 1;
          
          IF custodio_id_found IS NOT NULL THEN
            -- Insertar vehículo (fix: use custodio_id_found directly as text)
            INSERT INTO custodios_vehiculos (
              custodio_id,
              marca,
              modelo,
              placa,
              es_principal,
              estado,
              observaciones,
              created_at,
              updated_at
            ) VALUES (
              custodio_id_found::text,
              COALESCE(NULLIF(trim(marca_extraida), ''), 'No especificado'),
              COALESCE(NULLIF(trim(modelo_extraido), ''), 'No especificado'),
              COALESCE(NULLIF(trim(custodio_record.placa), ''), 'Sin placa'),
              true,
              'activo',
              'Migrado automáticamente desde servicios_custodia',
              custodio_record.ultima_fecha,
              now()
            );
            
            record_count := record_count + 1;
          END IF;
        END;
      END;
    END IF;
  END LOOP;
  
  RETURN record_count;
END;
$$;