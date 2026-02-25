-- Fix stuck documents in 'procesando' state
UPDATE documentos_candidato 
SET estado_validacion = 'pendiente', ocr_procesado = false, updated_at = now()
WHERE estado_validacion = 'procesando' AND ocr_procesado = false;

-- Add curp column to candidatos_custodios
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS curp text;