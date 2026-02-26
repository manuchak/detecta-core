
-- Parche retroactivo: migrar datos vehiculares de leads aprobados a candidatos_custodios
-- Solo afecta candidatos donde marca_vehiculo IS NULL

UPDATE candidatos_custodios cc
SET
  marca_vehiculo   = NULLIF(TRIM(leads_data.notas::jsonb -> 'vehiculo' ->> 'marca_vehiculo'), ''),
  modelo_vehiculo  = NULLIF(TRIM(leads_data.notas::jsonb -> 'vehiculo' ->> 'modelo_vehiculo'), ''),
  placas_vehiculo  = NULLIF(TRIM(leads_data.notas::jsonb -> 'vehiculo' ->> 'placas'), ''),
  color_vehiculo   = NULLIF(TRIM(leads_data.notas::jsonb -> 'vehiculo' ->> 'color_vehiculo'), ''),
  numero_licencia  = NULLIF(TRIM(leads_data.notas::jsonb -> 'experiencia' ->> 'licencia_conducir'), ''),
  direccion        = NULLIF(TRIM(leads_data.notas::jsonb -> 'datos_personales' ->> 'direccion'), '')
FROM (
  SELECT nombre, notas
  FROM leads
  WHERE estado = 'aprobado'
    AND notas IS NOT NULL
    AND notas::jsonb -> 'vehiculo' IS NOT NULL
) leads_data
WHERE cc.nombre = leads_data.nombre
  AND cc.marca_vehiculo IS NULL;
