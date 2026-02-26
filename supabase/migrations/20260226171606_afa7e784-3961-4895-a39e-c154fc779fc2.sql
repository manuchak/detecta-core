ALTER TABLE contratos_candidato
  DROP CONSTRAINT contratos_candidato_tipo_contrato_check;

ALTER TABLE contratos_candidato
  ADD CONSTRAINT contratos_candidato_tipo_contrato_check
  CHECK (tipo_contrato::text = ANY(ARRAY[
    'confidencialidad',
    'prestacion_servicios',
    'codigo_conducta',
    'aviso_privacidad',
    'responsiva_equipo',
    'prestacion_servicios_propietario',
    'prestacion_servicios_no_propietario',
    'anexo_gps'
  ]::text[]));