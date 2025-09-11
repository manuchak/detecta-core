-- Corregir advertencias de seguridad en las funciones creadas

-- Actualizar función check_duplicate_service_ids con search_path seguro
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
  FROM public.servicios_custodia sc
  WHERE sc.id_servicio IS NOT NULL
  GROUP BY sc.id_servicio
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, MAX(sc.created_at) DESC;
END;
$$;

-- Actualizar función clean_duplicate_service_ids con search_path seguro
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
    FROM public.servicios_custodia
    WHERE id_servicio IS NOT NULL
    GROUP BY id_servicio
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Eliminar duplicados manteniendo el más reciente por id_servicio
  WITH duplicates_by_service AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY id_servicio ORDER BY created_at DESC, id DESC) as rn
    FROM public.servicios_custodia 
    WHERE id_servicio IS NOT NULL 
    AND id_servicio IN (
      SELECT id_servicio 
      FROM public.servicios_custodia 
      WHERE id_servicio IS NOT NULL
      GROUP BY id_servicio 
      HAVING COUNT(*) > 1
    )
  )
  DELETE FROM public.servicios_custodia 
  WHERE id IN (
    SELECT id FROM duplicates_by_service WHERE rn > 1
  );
  
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  
  -- Registrar operación en log de mantenimiento
  INSERT INTO public.maintenance_log (
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