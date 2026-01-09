-- Agregar columnas de override para conflictos en servicios_planificados
ALTER TABLE servicios_planificados 
ADD COLUMN IF NOT EXISTS override_conflicto_motivo text,
ADD COLUMN IF NOT EXISTS override_conflicto_autorizado_por uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS override_conflicto_timestamp timestamptz;

COMMENT ON COLUMN servicios_planificados.override_conflicto_motivo IS 
  'Motivo por el cual se ignoró el conflicto de horario detectado';
COMMENT ON COLUMN servicios_planificados.override_conflicto_autorizado_por IS 
  'Usuario que autorizó el override del conflicto';
COMMENT ON COLUMN servicios_planificados.override_conflicto_timestamp IS 
  'Fecha/hora en que se realizó el override';