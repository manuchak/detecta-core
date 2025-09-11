-- Solución completa para eliminar duplicados y garantizar unicidad en servicios_custodia

-- Paso 1: Identificar y limpiar duplicados existentes
-- Eliminamos registros duplicados manteniendo solo el más reciente por ID
WITH duplicates AS (
  SELECT id, 
         ctid,
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC, id_servicio DESC) as rn
  FROM servicios_custodia 
  WHERE id IN (
    SELECT id 
    FROM servicios_custodia 
    GROUP BY id 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM servicios_custodia 
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- Paso 2: Hacer el campo id PRIMARY KEY si no lo es ya
-- Primero verificamos si ya existe una primary key
DO $$
BEGIN
  -- Intentar agregar PRIMARY KEY constraint
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'PRIMARY KEY' 
    AND table_name = 'servicios_custodia'
  ) THEN
    ALTER TABLE servicios_custodia ADD CONSTRAINT servicios_custodia_pkey PRIMARY KEY (id);
  END IF;
EXCEPTION 
  WHEN duplicate_table THEN 
    -- Primary key ya existe, no hacer nada
    NULL;
END $$;

-- Paso 3: Asegurar que la secuencia esté correctamente configurada
DO $$
DECLARE
    max_id BIGINT;
BEGIN
    -- Obtener el máximo ID actual
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM servicios_custodia;
    
    -- Asegurar que la secuencia existe y está correctamente configurada
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'servicios_custodia_id_seq') THEN
        -- Si existe, actualizar el valor actual
        PERFORM setval('servicios_custodia_id_seq', max_id + 1, false);
    ELSE
        -- Si no existe, crearla
        CREATE SEQUENCE servicios_custodia_id_seq START WITH 1;
        PERFORM setval('servicios_custodia_id_seq', max_id + 1, false);
        ALTER TABLE servicios_custodia ALTER COLUMN id SET DEFAULT nextval('servicios_custodia_id_seq');
        ALTER SEQUENCE servicios_custodia_id_seq OWNED BY servicios_custodia.id;
    END IF;
END $$;

-- Paso 4: Crear función para verificar duplicados
CREATE OR REPLACE FUNCTION check_duplicate_service_ids()
RETURNS TABLE(
  id_servicio TEXT,
  duplicate_count BIGINT,
  service_ids BIGINT[],
  latest_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id_servicio::TEXT,
    COUNT(*)::BIGINT as duplicate_count,
    array_agg(sc.id ORDER BY sc.created_at DESC)::BIGINT[] as service_ids,
    MAX(sc.created_at) as latest_date
  FROM servicios_custodia sc
  GROUP BY sc.id_servicio
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, MAX(sc.created_at) DESC;
END;
$$;

-- Paso 5: Crear función para limpiar duplicados por id_servicio
CREATE OR REPLACE FUNCTION clean_duplicate_service_ids()
RETURNS TABLE(
  duplicates_found INTEGER,
  duplicates_removed INTEGER,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_count INTEGER;
  removed_count INTEGER;
BEGIN
  -- Contar duplicados existentes por id_servicio
  SELECT COUNT(*) INTO found_count
  FROM (
    SELECT id_servicio
    FROM servicios_custodia
    GROUP BY id_servicio
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Eliminar duplicados manteniendo el más reciente por id_servicio
  WITH duplicates_by_service AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY id_servicio ORDER BY created_at DESC, id DESC) as rn
    FROM servicios_custodia 
    WHERE id_servicio IN (
      SELECT id_servicio 
      FROM servicios_custodia 
      GROUP BY id_servicio 
      HAVING COUNT(*) > 1
    )
  )
  DELETE FROM servicios_custodia 
  WHERE id IN (
    SELECT id FROM duplicates_by_service WHERE rn > 1
  );
  
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  
  -- Registrar operación en log de mantenimiento
  INSERT INTO maintenance_log (
    operation_type,
    table_name,
    records_affected,
    operation_details,
    executed_at
  ) VALUES (
    'DUPLICATE_CLEANUP',
    'servicios_custodia',
    removed_count,
    format('Encontrados %s grupos de duplicados, eliminados %s registros duplicados por id_servicio', found_count, removed_count),
    NOW()
  );
  
  RETURN QUERY SELECT found_count, removed_count, 
    format('Operación completada. Duplicados encontrados: %s, Registros eliminados: %s', found_count, removed_count)::TEXT;
END;
$$;

-- Paso 6: Crear tabla de log de mantenimiento si no existe
CREATE TABLE IF NOT EXISTS maintenance_log (
  id SERIAL PRIMARY KEY,
  operation_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  records_affected INTEGER DEFAULT 0,
  operation_details TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Paso 7: Crear índice único en id_servicio para prevenir duplicados futuros
CREATE UNIQUE INDEX IF NOT EXISTS idx_servicios_custodia_id_servicio_unique 
ON servicios_custodia (id_servicio);

-- Paso 8: Ejecutar limpieza inicial
SELECT * FROM clean_duplicate_service_ids();

-- Agregar comentarios para documentar
COMMENT ON FUNCTION check_duplicate_service_ids() IS 'Función para verificar duplicados por id_servicio en servicios_custodia';
COMMENT ON FUNCTION clean_duplicate_service_ids() IS 'Función para limpiar duplicados manteniendo el registro más reciente por id_servicio';
COMMENT ON TABLE maintenance_log IS 'Log de operaciones de mantenimiento de la base de datos';
COMMENT ON INDEX idx_servicios_custodia_id_servicio_unique IS 'Índice único para prevenir duplicados por id_servicio';