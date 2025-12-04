-- =====================================================
-- FIX: Agregar columna pc_custodio_id faltante
-- Desbloquea la liberación de custodios para Supply
-- =====================================================

-- Agregar columna para trazabilidad del custodio creado en planificación
ALTER TABLE custodio_liberacion
ADD COLUMN IF NOT EXISTS pc_custodio_id uuid REFERENCES pc_custodios(id);

-- Comentario descriptivo
COMMENT ON COLUMN custodio_liberacion.pc_custodio_id IS 
'ID del custodio creado en pc_custodios al momento de liberar. Permite trazabilidad Supply → Planificación.';

-- Índice para búsqueda rápida de liberaciones por custodio
CREATE INDEX IF NOT EXISTS idx_custodio_liberacion_pc_custodio 
ON custodio_liberacion(pc_custodio_id) 
WHERE pc_custodio_id IS NOT NULL;