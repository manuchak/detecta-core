-- ============================================================
-- SINCRONIZACIÓN FINAL: Con ON CONFLICT en custodios_operativos
-- ============================================================

-- PARTE 1: Vincular candidato_origen_id en pc_custodios que ya tienen pc_custodio_id en liberacion
UPDATE pc_custodios pc
SET candidato_origen_id = cl.candidato_id
FROM custodio_liberacion cl
WHERE cl.pc_custodio_id = pc.id
  AND pc.candidato_origen_id IS NULL;

-- PARTE 2: Vincular pc_custodio_id en custodio_liberacion para nombres que ya existen (normalizado)
UPDATE custodio_liberacion cl
SET pc_custodio_id = pc.id
FROM pc_custodios pc, candidatos_custodios cc
WHERE cc.id = cl.candidato_id
  AND UPPER(REGEXP_REPLACE(TRIM(pc.nombre), '\s+', ' ', 'g')) = UPPER(REGEXP_REPLACE(TRIM(cc.nombre), '\s+', ' ', 'g'))
  AND cl.pc_custodio_id IS NULL;

-- PARTE 3: Vincular candidato_origen_id en pc_custodios para los vinculados
UPDATE pc_custodios pc
SET candidato_origen_id = cl.candidato_id
FROM custodio_liberacion cl
WHERE cl.pc_custodio_id = pc.id
  AND pc.candidato_origen_id IS NULL;

-- PARTE 4: Insertar con ON CONFLICT DO NOTHING para evitar duplicados en pc_custodios
INSERT INTO pc_custodios (
  candidato_origen_id, nombre, tel, email, zona_base,
  estado, vehiculo_propio, fecha_alta, created_at, updated_at
)
SELECT 
  cc.id,
  TRIM(REGEXP_REPLACE(cc.nombre, '\s+', ' ', 'g')),
  CASE 
    WHEN length(regexp_replace(COALESCE(cc.telefono,''), '[^0-9]', '', 'g')) = 10 
    THEN '+52' || regexp_replace(cc.telefono, '[^0-9]', '', 'g')
    ELSE regexp_replace(COALESCE(cc.telefono,''), '[^0-9]', '', 'g')
  END,
  cc.email,
  COALESCE(zon.nombre, 'Por asignar'),
  'activo',
  COALESCE(cc.vehiculo_propio, false),
  NOW(),
  NOW(), NOW()
FROM custodio_liberacion cl
JOIN candidatos_custodios cc ON cc.id = cl.candidato_id
LEFT JOIN zonas_operacion_nacional zon ON zon.id = cc.zona_preferida_id
WHERE cl.pc_custodio_id IS NULL
ON CONFLICT (nombre) DO NOTHING;

-- PARTE 5: Vincular los recién insertados y los que ya existían por nombre
UPDATE custodio_liberacion cl
SET pc_custodio_id = pc.id
FROM pc_custodios pc, candidatos_custodios cc
WHERE cc.id = cl.candidato_id
  AND UPPER(REGEXP_REPLACE(TRIM(pc.nombre), '\s+', ' ', 'g')) = UPPER(REGEXP_REPLACE(TRIM(cc.nombre), '\s+', ' ', 'g'))
  AND cl.pc_custodio_id IS NULL;

-- PARTE 6: Vincular candidato_origen_id en pc_custodios
UPDATE pc_custodios pc
SET candidato_origen_id = cl.candidato_id
FROM custodio_liberacion cl
WHERE cl.pc_custodio_id = pc.id
  AND pc.candidato_origen_id IS NULL;

-- PARTE 7: Completar liberación de pendientes que tienen pc_custodio_id
UPDATE custodio_liberacion
SET 
  estado_liberacion = 'liberado',
  fecha_liberacion = NOW(),
  updated_at = NOW()
WHERE estado_liberacion IN ('pendiente', 'aprobado_final')
  AND pc_custodio_id IS NOT NULL;

-- PARTE 8: Actualizar candidatos_custodios a 'activo'
UPDATE candidatos_custodios cc
SET estado_proceso = 'activo', updated_at = NOW()
FROM custodio_liberacion cl
WHERE cl.candidato_id = cc.id
  AND cl.estado_liberacion = 'liberado'
  AND cc.estado_proceso NOT IN ('activo', 'inactivo');

-- PARTE 9: Insertar en custodios_operativos con ON CONFLICT
INSERT INTO custodios_operativos (
  id, nombre, telefono, email, zona_base,
  estado, disponibilidad, vehiculo_propio, pc_custodio_id,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  pc.nombre, pc.tel, pc.email, pc.zona_base,
  'activo', 'disponible',
  pc.vehiculo_propio, pc.id,
  NOW(), NOW()
FROM pc_custodios pc
LEFT JOIN custodios_operativos co ON co.pc_custodio_id = pc.id
WHERE co.id IS NULL
ON CONFLICT (nombre) DO UPDATE SET
  pc_custodio_id = EXCLUDED.pc_custodio_id,
  updated_at = NOW()
WHERE custodios_operativos.pc_custodio_id IS NULL;