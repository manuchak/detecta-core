
-- Drop old check constraint and add updated one with new contract types
ALTER TABLE plantillas_contrato DROP CONSTRAINT plantillas_contrato_tipo_contrato_check;
ALTER TABLE plantillas_contrato ADD CONSTRAINT plantillas_contrato_tipo_contrato_check 
  CHECK (tipo_contrato::text = ANY (ARRAY['confidencialidad','prestacion_servicios','codigo_conducta','aviso_privacidad','responsiva_equipo','prestacion_servicios_propietario','prestacion_servicios_no_propietario','anexo_gps']::text[]));
