-- Fix: Crear pc_custodio manualmente para Oscar Patiño
-- con el estado correcto del enum (activo, no disponible)

-- Obtener datos del candidato para crear pc_custodio
INSERT INTO pc_custodios (
  nombre,
  tel,
  email,
  zona_base,
  vehiculo_propio,
  estado
)
SELECT 
  cc.nombre,
  cc.telefono,
  cc.email,
  cc.zona_preferida_id,
  COALESCE(cc.vehiculo_propio, false),
  'activo'::estado_custodio
FROM candidatos_custodios cc
WHERE cc.id = 'b36ef5e8-1274-45e2-8a8e-7037406bceb4'
RETURNING id;

-- Actualizar el registro de liberación con el resultado
UPDATE custodio_liberacion
SET 
  estado_liberacion = 'liberado',
  fecha_liberacion = NOW(),
  pc_custodio_id = (SELECT id FROM pc_custodios WHERE nombre = 'OSCAR LEONARDO PATIÑO TERRAZAS' ORDER BY created_at DESC LIMIT 1)
WHERE candidato_id = 'b36ef5e8-1274-45e2-8a8e-7037406bceb4';

-- Actualizar estado final del candidato
UPDATE candidatos_custodios
SET 
  estado_proceso = 'activo',
  estado_detallado = 'liberado_planificacion',
  updated_at = NOW()
WHERE id = 'b36ef5e8-1274-45e2-8a8e-7037406bceb4';