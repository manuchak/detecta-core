

# Fix: Evento especial "Tráfico" falla al activarse

## Causa raíz

La columna `tipo_evento` de la tabla `servicio_eventos_ruta` usa el enum PostgreSQL `tipo_evento_ruta`. Los valores actuales del enum son:

```text
inicio_servicio, fin_servicio, combustible, baño, descanso, pernocta,
checkpoint, incidencia, foto_evidencia, otro, llegada_destino, liberacion_custodio
```

**`trafico` no existe en el enum.** Cuando el monitorista hace clic en "Tráfico", el INSERT falla con un error de tipo inválido que se muestra como toast genérico.

## Solución

Un solo cambio — migración SQL para agregar el valor faltante al enum:

```sql
ALTER TYPE tipo_evento_ruta ADD VALUE IF NOT EXISTS 'trafico';
```

No se requieren cambios en el código TypeScript: todos los archivos del frontend ya usan `'trafico'` como tipo válido en sus constantes y tipos. Solo falta el valor en la base de datos.

## Archivos a modificar

- **Nueva migración SQL** — `ALTER TYPE tipo_evento_ruta ADD VALUE IF NOT EXISTS 'trafico'`

Ningún archivo TypeScript necesita cambios.

