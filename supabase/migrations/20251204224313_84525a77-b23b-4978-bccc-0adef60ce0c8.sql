-- =====================================================
-- LIBERACIÓN MANUAL: Oscar Leonardo Patiño Terrazas
-- Candidato ID: b36ef5e8-1274-45e2-8a8e-7037406bceb4
-- =====================================================

-- Paso 1: Insertar registro de liberación
INSERT INTO custodio_liberacion (
  candidato_id,
  estado_liberacion,
  documentacion_completa,
  psicometricos_completado,
  toxicologicos_completado,
  vehiculo_capturado,
  instalacion_gps_completado,
  created_at,
  updated_at
) VALUES (
  'b36ef5e8-1274-45e2-8a8e-7037406bceb4',
  'pendiente',
  false,
  false,
  false,
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (candidato_id) DO NOTHING;

-- Paso 2: Actualizar estado del candidato a en_liberacion
UPDATE candidatos_custodios 
SET estado_proceso = 'en_liberacion',
    estado_detallado = 'en_liberacion',
    updated_at = NOW()
WHERE id = 'b36ef5e8-1274-45e2-8a8e-7037406bceb4';

-- Paso 3: Ejecutar liberación forzada a Planning
SELECT liberar_custodio_a_planeacion(
  (SELECT id FROM custodio_liberacion WHERE candidato_id = 'b36ef5e8-1274-45e2-8a8e-7037406bceb4' LIMIT 1),
  '00000000-0000-0000-0000-000000000000'::uuid,  -- Usuario sistema
  TRUE  -- p_forzar_liberacion = true (bypass validaciones)
);