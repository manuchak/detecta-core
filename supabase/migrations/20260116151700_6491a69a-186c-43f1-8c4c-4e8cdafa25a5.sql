-- Fix liberation sync bug: 6 custodians are marked as 'inactivo_temporal' 
-- but have NO active indisponibilidades, making them invisible to Planning
-- This corrects orphaned inactivo_temporal status for liberated custodians

UPDATE custodios_operativos co
SET 
  disponibilidad = 'disponible',
  updated_at = NOW()
FROM pc_custodios pc
JOIN custodio_liberacion cl ON cl.pc_custodio_id = pc.id
WHERE co.pc_custodio_id = pc.id
  AND cl.estado_liberacion = 'liberado'
  AND co.disponibilidad = 'inactivo_temporal'
  AND NOT EXISTS (
    SELECT 1 FROM custodio_indisponibilidades ci
    WHERE ci.custodio_id = co.id
    AND ci.estado = 'activa'
    AND (ci.fecha_fin_estimada IS NULL OR ci.fecha_fin_estimada > NOW())
  );

-- Add comment for documentation
COMMENT ON TABLE custodios_operativos IS 'Custodians available for operations. Liberation sync ensures disponibilidad=disponible when no active indisponibilidades exist.';