

# Parche retroactivo: Migrar datos vehiculares de leads ya aprobados

## Problema

Rafael Delgado (y posiblemente otros candidatos) fueron aprobados antes de que se implementara la migración automática de datos vehiculares. Sus datos del coche existen en `leads.notas` (JSON) pero nunca se copiaron a `candidatos_custodios`.

## Solucion

Ejecutar una migración SQL única que extraiga los datos vehiculares del JSON de `leads.notas` y los copie a los registros correspondientes en `candidatos_custodios` donde esos campos estén vacíos.

## Cambio

### Migración SQL directa

Un script SQL que:

1. Busca todos los registros en `candidatos_custodios` donde `marca_vehiculo IS NULL`
2. Los cruza con `leads` por nombre (ya que no hay `lead_id` en la tabla)
3. Extrae del JSON de `notas` los campos vehiculares
4. Actualiza `candidatos_custodios` con esos datos

```text
UPDATE candidatos_custodios cc
SET
  marca_vehiculo   = (leads_data.notas::jsonb -> 'vehiculo' ->> 'marca_vehiculo'),
  modelo_vehiculo  = (leads_data.notas::jsonb -> 'vehiculo' ->> 'modelo_vehiculo'),
  placas_vehiculo  = (leads_data.notas::jsonb -> 'vehiculo' ->> 'placas'),
  color_vehiculo   = (leads_data.notas::jsonb -> 'vehiculo' ->> 'color_vehiculo'),
  numero_licencia  = (leads_data.notas::jsonb -> 'experiencia' ->> 'licencia_conducir'),
  direccion        = (leads_data.notas::jsonb -> 'datos_personales' ->> 'direccion')
FROM (
  SELECT nombre, notas
  FROM leads
  WHERE estado = 'aprobado'
    AND notas IS NOT NULL
    AND notas::jsonb -> 'vehiculo' IS NOT NULL
) leads_data
WHERE cc.nombre = leads_data.nombre
  AND cc.marca_vehiculo IS NULL;
```

Esto se ejecuta como una migración Supabase. Solo afecta candidatos con campos vacíos, no sobreescribe datos ya llenados manualmente.

### Archivo

`supabase/migrations/xxx_backfill_vehicle_data.sql` - migración única con el UPDATE anterior, envuelto en una transacción segura.

