

# Actualizar disponibilidad de Luis Gilberto González Jasso

## Verificación completada

- **No hay indisponibilidades activas** en `custodio_indisponibilidades` para este custodio, por lo que el trigger `sync_custodio_disponibilidad` no revertirá el cambio.
- Es seguro proceder con la actualización directa.

## Cambio a ejecutar

Un solo UPDATE en la tabla `custodios_operativos`:

```sql
UPDATE custodios_operativos
SET disponibilidad = 'disponible',
    updated_at = now()
WHERE id = '9ffa94dd-1de2-42b0-b593-921959b0f428';
```

Se ejecutará vía `psql $SUPABASE_DB_URL` (no migración, ya que es un cambio de datos, no de esquema).

También se refrescará la vista materializada para que Planeación lo vea de inmediato:

```sql
SELECT refresh_custodios_operativos_disponibles();
```

## Resultado esperado

Luis Gilberto González Jasso aparecerá como **disponible** en el módulo de Planeación.

