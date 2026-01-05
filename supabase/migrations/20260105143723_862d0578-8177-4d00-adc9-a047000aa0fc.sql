-- ================================================================
-- Migración: Corrección de Sincronización del Workflow de Liberaciones
-- ================================================================

-- PARTE 1: Habilitar extensión unaccent para normalización de nombres
CREATE EXTENSION IF NOT EXISTS unaccent;

-- PARTE 2: Función de normalización de nombres
CREATE OR REPLACE FUNCTION public.normalize_name(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(TRIM(unaccent(COALESCE(input_name, ''))));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PARTE 3: Reparación de datos existentes

-- 3.1 Reparar Oscar Leonardo Patiño Terrazas
-- Actualizar custodios_operativos para vincular pc_custodio_id
UPDATE custodios_operativos
SET pc_custodio_id = 'f2b4de71-c628-4930-9048-460feb3a3f64',
    nombre = 'OSCAR LEONARDO PATIÑO TERRAZAS',
    updated_at = NOW()
WHERE normalize_name(nombre) = normalize_name('OSCAR LEONARDO PATIÑO TERRAZAS')
  AND pc_custodio_id IS NULL;

-- 3.2 Reparar Jose de Jesus Ovando Lopez
-- Primero insertar en pc_custodios si no existe
INSERT INTO pc_custodios (id, nombre, tel, email, zona_base, vehiculo_propio, estado, disponibilidad, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  cc.nombre,
  cc.telefono,
  cc.email,
  zon.nombre,
  COALESCE(cc.vehiculo_propio, false),
  'activo',
  'disponible',
  NOW(),
  NOW()
FROM candidatos_custodios cc
LEFT JOIN zonas_operacion_nacional zon ON zon.id = cc.zona_preferida_id
WHERE cc.id = '3f9aaacb-7fe5-4d68-ac1d-850450640a55'
  AND NOT EXISTS (
    SELECT 1 FROM pc_custodios pc 
    WHERE normalize_name(pc.nombre) = normalize_name(cc.nombre)
  );

-- 3.3 Actualizar custodio_liberacion de Jose de Jesus con pc_custodio_id
UPDATE custodio_liberacion cl
SET pc_custodio_id = (
  SELECT pc.id FROM pc_custodios pc 
  WHERE normalize_name(pc.nombre) = normalize_name('JOSE DE JESUS OVANDO LOPEZ')
  LIMIT 1
)
WHERE cl.candidato_id = '3f9aaacb-7fe5-4d68-ac1d-850450640a55'
  AND cl.pc_custodio_id IS NULL;

-- 3.4 Actualizar custodios_operativos de Jose de Jesus con pc_custodio_id
UPDATE custodios_operativos co
SET pc_custodio_id = (
  SELECT pc.id FROM pc_custodios pc 
  WHERE normalize_name(pc.nombre) = normalize_name('JOSE DE JESUS OVANDO LOPEZ')
  LIMIT 1
),
updated_at = NOW()
WHERE normalize_name(co.nombre) = normalize_name('JOSE DE JESUS OVANDO LOPEZ')
  AND co.pc_custodio_id IS NULL;

-- PARTE 4: Índices funcionales para búsqueda normalizada
CREATE INDEX IF NOT EXISTS idx_pc_custodios_nombre_normalized 
ON pc_custodios (public.normalize_name(nombre));

CREATE INDEX IF NOT EXISTS idx_custodios_operativos_nombre_normalized 
ON custodios_operativos (public.normalize_name(nombre));

-- PARTE 5: Función mejorada de liberación con normalización y transaccionalidad
CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion(
  p_liberacion_id UUID,
  p_liberado_por UUID DEFAULT NULL,
  p_forzar_liberacion BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liberacion RECORD;
  v_candidato RECORD;
  v_new_pc_custodio_id UUID;
  v_custodio_operativo_id UUID;
  v_existing_pc_id UUID;
  v_existing_co_id UUID;
  v_zona_nombre TEXT;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_fases_incompletas TEXT[] := ARRAY[]::TEXT[];
  v_invitation_token TEXT;
  v_nombre_normalizado TEXT;
BEGIN
  -- Obtener datos de liberación
  SELECT * INTO v_liberacion
  FROM custodio_liberacion
  WHERE id = p_liberacion_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Liberación no encontrada: %', p_liberacion_id;
  END IF;
  
  IF v_liberacion.estado_liberacion = 'liberado' THEN
    RAISE EXCEPTION 'Este custodio ya fue liberado anteriormente';
  END IF;
  
  -- Obtener datos del candidato
  SELECT * INTO v_candidato
  FROM candidatos_custodios
  WHERE id = v_liberacion.candidato_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidato no encontrado: %', v_liberacion.candidato_id;
  END IF;
  
  -- Normalizar nombre para comparaciones
  v_nombre_normalizado := normalize_name(v_candidato.nombre);
  
  -- Obtener nombre de zona
  SELECT nombre INTO v_zona_nombre
  FROM zonas_operacion_nacional
  WHERE id = v_candidato.zona_preferida_id;
  
  -- Verificaciones de fases (warnings, no bloqueantes si p_forzar_liberacion = true)
  IF NOT COALESCE(v_liberacion.documentacion_completa, FALSE) THEN
    v_fases_incompletas := array_append(v_fases_incompletas, 'documentacion');
    v_warnings := array_append(v_warnings, 'Documentación incompleta');
  END IF;
  
  IF NOT COALESCE(v_liberacion.toxicologicos_completado, FALSE) THEN
    v_fases_incompletas := array_append(v_fases_incompletas, 'toxicologicos');
    v_warnings := array_append(v_warnings, 'Toxicológicos pendientes');
  END IF;
  
  IF v_candidato.vehiculo_propio AND NOT COALESCE(v_liberacion.vehiculo_capturado, FALSE) THEN
    v_fases_incompletas := array_append(v_fases_incompletas, 'vehiculo');
    v_warnings := array_append(v_warnings, 'Vehículo no capturado');
  END IF;
  
  IF NOT COALESCE(v_liberacion.instalacion_gps_completado, FALSE) THEN
    v_fases_incompletas := array_append(v_fases_incompletas, 'gps');
    v_warnings := array_append(v_warnings, 'GPS no instalado');
  END IF;
  
  -- Bloquear si hay fases incompletas y no se fuerza
  IF array_length(v_fases_incompletas, 1) > 0 AND NOT p_forzar_liberacion THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'mensaje', 'Hay fases incompletas en el proceso de liberación',
      'fases_incompletas', v_fases_incompletas,
      'warnings', v_warnings
    );
  END IF;
  
  -- ================================================================
  -- INSERCIÓN EN pc_custodios CON NORMALIZACIÓN
  -- ================================================================
  
  -- Buscar si existe por nombre normalizado
  SELECT id INTO v_existing_pc_id
  FROM pc_custodios
  WHERE normalize_name(nombre) = v_nombre_normalizado
  LIMIT 1;
  
  IF v_existing_pc_id IS NOT NULL THEN
    -- Actualizar registro existente
    UPDATE pc_custodios
    SET estado = 'activo',
        disponibilidad = 'disponible',
        tel = COALESCE(v_candidato.telefono, tel),
        email = COALESCE(v_candidato.email, email),
        vehiculo_propio = COALESCE(v_candidato.vehiculo_propio, vehiculo_propio),
        updated_at = NOW()
    WHERE id = v_existing_pc_id;
    
    v_new_pc_custodio_id := v_existing_pc_id;
    v_warnings := array_append(v_warnings, 'Custodio existente actualizado en pc_custodios (nombre normalizado)');
  ELSE
    -- Insertar nuevo registro
    INSERT INTO pc_custodios (
      nombre, tel, email, zona_base, vehiculo_propio, estado, disponibilidad
    ) VALUES (
      v_candidato.nombre,
      v_candidato.telefono,
      v_candidato.email,
      v_zona_nombre,
      COALESCE(v_candidato.vehiculo_propio, FALSE),
      'activo',
      'disponible'
    )
    RETURNING id INTO v_new_pc_custodio_id;
  END IF;
  
  -- VALIDACIÓN CRÍTICA: Verificar que se creó/actualizó correctamente
  IF v_new_pc_custodio_id IS NULL THEN
    RAISE EXCEPTION 'Error crítico: No se pudo crear/actualizar registro en pc_custodios para %', v_candidato.nombre;
  END IF;
  
  -- ================================================================
  -- INSERCIÓN EN custodios_operativos CON NORMALIZACIÓN
  -- ================================================================
  
  -- Buscar si existe por nombre normalizado
  SELECT id INTO v_existing_co_id
  FROM custodios_operativos
  WHERE normalize_name(nombre) = v_nombre_normalizado
  LIMIT 1;
  
  IF v_existing_co_id IS NOT NULL THEN
    -- Actualizar registro existente
    UPDATE custodios_operativos
    SET estado = 'activo',
        disponibilidad = 'disponible',
        pc_custodio_id = v_new_pc_custodio_id,
        telefono = COALESCE(v_candidato.telefono, telefono),
        email = COALESCE(v_candidato.email, email),
        vehiculo_propio = COALESCE(v_candidato.vehiculo_propio, vehiculo_propio),
        updated_at = NOW()
    WHERE id = v_existing_co_id;
    
    v_custodio_operativo_id := v_existing_co_id;
    v_warnings := array_append(v_warnings, 'Custodio existente actualizado en custodios_operativos (nombre normalizado)');
  ELSE
    -- Insertar nuevo registro
    INSERT INTO custodios_operativos (
      nombre, telefono, email, zona_base, vehiculo_propio, 
      estado, disponibilidad, fuente, pc_custodio_id
    ) VALUES (
      v_candidato.nombre,
      v_candidato.telefono,
      v_candidato.email,
      v_zona_nombre,
      COALESCE(v_candidato.vehiculo_propio, FALSE),
      'activo',
      'disponible',
      'liberacion_supply',
      v_new_pc_custodio_id
    )
    RETURNING id INTO v_custodio_operativo_id;
  END IF;
  
  -- VALIDACIÓN CRÍTICA: Verificar que se creó/actualizó correctamente
  IF v_custodio_operativo_id IS NULL THEN
    RAISE EXCEPTION 'Error crítico: No se pudo crear/actualizar registro en custodios_operativos para %', v_candidato.nombre;
  END IF;
  
  -- ================================================================
  -- GENERAR TOKEN DE INVITACIÓN
  -- ================================================================
  v_invitation_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO custodian_invitations (
    candidato_custodio_id,
    pc_custodio_id,
    token,
    email,
    telefono,
    expires_at
  ) VALUES (
    v_candidato.id,
    v_new_pc_custodio_id,
    v_invitation_token,
    v_candidato.email,
    v_candidato.telefono,
    NOW() + INTERVAL '30 days'
  );
  
  -- ================================================================
  -- ACTUALIZAR REGISTRO DE LIBERACIÓN
  -- ================================================================
  UPDATE custodio_liberacion
  SET estado_liberacion = 'liberado',
      liberado_por = p_liberado_por,
      fecha_liberacion = NOW(),
      pc_custodio_id = v_new_pc_custodio_id,
      updated_at = NOW()
  WHERE id = p_liberacion_id;
  
  -- Actualizar estado del candidato
  UPDATE candidatos_custodios
  SET estado_proceso = 'liberado',
      updated_at = NOW()
  WHERE id = v_candidato.id;
  
  -- Refrescar vista materializada
  REFRESH MATERIALIZED VIEW CONCURRENTLY custodios_operativos_disponibles;
  
  -- ================================================================
  -- RETORNAR RESULTADO CON STATUS DE SINCRONIZACIÓN
  -- ================================================================
  RETURN jsonb_build_object(
    'success', TRUE,
    'pc_custodio_id', v_new_pc_custodio_id,
    'custodio_operativo_id', v_custodio_operativo_id,
    'candidato_id', v_candidato.id,
    'candidato_nombre', v_candidato.nombre,
    'candidato_email', v_candidato.email,
    'candidato_telefono', v_candidato.telefono,
    'warnings', v_warnings,
    'fases_incompletas', v_fases_incompletas,
    'tiene_warnings', array_length(v_warnings, 1) > 0,
    'mensaje', 'Custodio liberado exitosamente y sincronizado con Planeación',
    'invitation_token', v_invitation_token,
    'sync_status', jsonb_build_object(
      'pc_custodios_synced', v_new_pc_custodio_id IS NOT NULL,
      'custodios_operativos_synced', v_custodio_operativo_id IS NOT NULL,
      'pc_custodios_was_existing', v_existing_pc_id IS NOT NULL,
      'custodios_operativos_was_existing', v_existing_co_id IS NOT NULL,
      'nombre_normalizado', v_nombre_normalizado
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automático de PostgreSQL
    RAISE EXCEPTION 'Error en liberación: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- PARTE 6: Trigger de validación para evitar liberaciones sin pc_custodio_id
CREATE OR REPLACE FUNCTION public.check_liberacion_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado_liberacion = 'liberado' AND NEW.pc_custodio_id IS NULL THEN
    RAISE EXCEPTION 'No se puede marcar como liberado sin pc_custodio_id sincronizado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe para recrearlo
DROP TRIGGER IF EXISTS tr_check_liberacion_sync ON custodio_liberacion;

CREATE TRIGGER tr_check_liberacion_sync
BEFORE UPDATE ON custodio_liberacion
FOR EACH ROW
WHEN (NEW.estado_liberacion = 'liberado')
EXECUTE FUNCTION check_liberacion_sync();

-- PARTE 7: Refrescar vista materializada
REFRESH MATERIALIZED VIEW CONCURRENTLY custodios_operativos_disponibles;