-- =============================================
-- CLEANUP: Remove incorrect automatic sanctions
-- These were triggered on 2026-02-03 based on historical services
-- that didn't have hora_inicio_real but were not actual no-shows
-- =============================================

-- Step 1: Mark incorrect automatic sanctions as 'revocada' (valid state, keeps audit trail)
UPDATE sanciones_aplicadas
SET 
  estado = 'revocada',
  notas = notas || ' [REVOCADA: Detección incorrecta basada en datos históricos sin hora_inicio_real]'
WHERE notas LIKE 'Detección automática%'
AND created_at::date = '2026-02-03';

-- Step 2: Restore custodios that were suspended by these incorrect sanctions
UPDATE custodios_operativos
SET 
  estado = 'activo',
  fecha_inactivacion = NULL,
  motivo_inactivacion = NULL,
  fecha_reactivacion_programada = NULL
WHERE id IN (
  SELECT DISTINCT operativo_id 
  FROM sanciones_aplicadas 
  WHERE notas LIKE 'Detección automática%'
  AND created_at::date = '2026-02-03'
  AND operativo_tipo = 'custodio'
)
AND estado = 'suspendido'
AND fecha_inactivacion = '2026-02-03';

-- Step 3: Add configuration table for automatic sanctions system
CREATE TABLE IF NOT EXISTS configuracion_sanciones_auto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activo BOOLEAN DEFAULT false,
  -- NO_SHOW detection settings
  no_show_habilitado BOOLEAN DEFAULT false,
  no_show_minutos_tolerancia INTEGER DEFAULT 30,
  no_show_dias_suspension INTEGER DEFAULT 21,
  -- CANCELACION_ULTIMA_HORA settings
  cancelacion_habilitado BOOLEAN DEFAULT false,
  cancelacion_horas_limite INTEGER DEFAULT 2,
  cancelacion_dias_suspension INTEGER DEFAULT 14,
  -- LLEGADA_TARDE settings
  llegada_tarde_habilitado BOOLEAN DEFAULT false,
  llegada_tarde_minutos_tolerancia INTEGER DEFAULT 15,
  llegada_tarde_ocurrencias_limite INTEGER DEFAULT 3,
  llegada_tarde_periodo_dias INTEGER DEFAULT 30,
  llegada_tarde_dias_suspension INTEGER DEFAULT 7,
  -- Detection window (only check services from X days ago to now)
  ventana_deteccion_dias INTEGER DEFAULT 1,
  -- Audit fields
  modificado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default configuration (disabled by default for safety)
INSERT INTO configuracion_sanciones_auto (
  activo,
  no_show_habilitado,
  cancelacion_habilitado,
  llegada_tarde_habilitado,
  ventana_deteccion_dias
) VALUES (
  false,
  false,
  false,
  false,
  1
) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE configuracion_sanciones_auto ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins and coordinators can view/edit
CREATE POLICY "Admins can manage sanction config"
ON configuracion_sanciones_auto
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'coordinador_operaciones')
    AND user_roles.is_active = true
  )
);

-- Add comment for documentation
COMMENT ON TABLE configuracion_sanciones_auto IS 'Configuration for automatic sanction detection system. All detection is DISABLED by default for safety.';