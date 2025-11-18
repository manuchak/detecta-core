-- ============================================================================
-- SOLUCIÓN ARQUITECTÓNICA: Vincular leads con candidatos_custodios
-- ============================================================================
-- Fase 1: Crear la infraestructura de vinculación

-- PASO 1: Añadir nuevos estados al enum de candidatos_custodios
-- Primero verificamos si existe el constraint y lo eliminamos para recrearlo
ALTER TABLE candidatos_custodios DROP CONSTRAINT IF EXISTS candidatos_custodios_estado_proceso_check;

-- Recrear el constraint con los nuevos estados necesarios para el flujo completo
ALTER TABLE candidatos_custodios 
ADD CONSTRAINT candidatos_custodios_estado_proceso_check 
CHECK (estado_proceso IN (
  'lead',
  'entrevista', 
  'documentacion',
  'aprobado',           -- Nuevo: cuando lead es aprobado
  'en_liberacion',      -- Nuevo: cuando inicia proceso de liberación
  'activo',             -- Cuando custodio está activo (liberado)
  'rechazado',          -- Para rechazos
  'inactivo'            -- Para inactivos
));

-- PASO 2: Añadir columna de relación en tabla leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS candidato_custodio_id UUID REFERENCES candidatos_custodios(id) ON DELETE SET NULL;

-- PASO 3: Crear índice para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_leads_candidato_custodio_id ON leads(candidato_custodio_id);

-- PASO 4: Comentarios para documentación
COMMENT ON COLUMN leads.candidato_custodio_id IS 'UUID del candidato en candidatos_custodios. Se crea automáticamente al aprobar el lead.';

-- PASO 5: Función helper para sincronizar lead con candidato (será usada por la app)
CREATE OR REPLACE FUNCTION sync_lead_to_candidato(
  p_lead_id TEXT,
  p_nombre TEXT,
  p_email TEXT,
  p_telefono TEXT,
  p_fuente TEXT,
  p_estado_proceso TEXT
)
RETURNS UUID AS $$
DECLARE
  v_candidato_id UUID;
BEGIN
  -- Buscar candidato existente por email o teléfono
  SELECT id INTO v_candidato_id
  FROM candidatos_custodios
  WHERE email = p_email OR telefono = p_telefono
  LIMIT 1;

  IF v_candidato_id IS NULL THEN
    -- Crear nuevo candidato
    INSERT INTO candidatos_custodios (
      nombre,
      email,
      telefono,
      estado_proceso,
      fuente_reclutamiento,
      created_at,
      updated_at
    ) VALUES (
      p_nombre,
      p_email,
      p_telefono,
      p_estado_proceso,
      p_fuente,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_candidato_id;
  ELSE
    -- Actualizar candidato existente
    UPDATE candidatos_custodios
    SET 
      estado_proceso = p_estado_proceso,
      updated_at = NOW()
    WHERE id = v_candidato_id;
  END IF;

  -- Vincular lead con candidato
  UPDATE leads
  SET candidato_custodio_id = v_candidato_id,
      updated_at = NOW()
  WHERE id = p_lead_id;

  RETURN v_candidato_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 6: Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION sync_lead_to_candidato TO authenticated;