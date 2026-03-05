

# Actualizar teléfono de Oscar Patiño

## Estado actual

| Campo | Valor |
|---|---|
| Nombre | OSCAR LEONARDO PATINO TERRAZAS |
| Teléfono actual (custodios_operativos) | 4421862382 |
| Profile vinculado | Ninguno (no se ha registrado en la app) |
| Teléfono confirmado por Axel | 4462888724 |

## Acción

Como no tiene profile, el cambio se hace directamente en `custodios_operativos`. Cuando en el futuro se registre en la app y vincule ese teléfono, el trigger de `profile_id` que acabamos de implementar lo vinculará automáticamente.

### Cambio en BD (migración SQL)

```sql
UPDATE custodios_operativos
SET telefono = '4462888724', updated_at = now()
WHERE id = '94075138-694c-4900-9dae-87cfba8be05a';

-- También actualizar servicios planificados futuros
UPDATE servicios_planificados
SET custodio_telefono = '4462888724'
WHERE custodio_telefono = '4421862382'
  AND fecha_hora_cita >= now()
  AND estado_planeacion NOT IN ('cancelado', 'completado', 'finalizado');
```

No se requieren cambios en frontend.

