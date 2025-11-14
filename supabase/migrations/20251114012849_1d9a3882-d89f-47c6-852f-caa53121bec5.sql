-- ================================================================
-- FIX: Llenar armado_nombre_verificado en asignaciones existentes
-- ================================================================
-- Este migration corrige las asignaciones de armados internos
-- que tienen armado_id pero les falta armado_nombre_verificado

UPDATE asignacion_armados aa
SET armado_nombre_verificado = ao.nombre,
    updated_at = NOW()
FROM armados_operativos ao
WHERE aa.tipo_asignacion = 'interno'
  AND aa.armado_id IS NOT NULL
  AND aa.armado_nombre_verificado IS NULL
  AND aa.armado_id::uuid = ao.id;

-- Verificar resultado
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM asignacion_armados
  WHERE tipo_asignacion = 'interno'
    AND armado_id IS NOT NULL
    AND armado_nombre_verificado IS NOT NULL;
  
  RAISE NOTICE 'Asignaciones corregidas: %', updated_count;
END $$;