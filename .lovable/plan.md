

# Fix Crítico: Monitoristas atrapados en pausa de comida

## Causa Raíz

El error en los logs es claro:
```
violates check constraint "bitacora_pausas_monitorista_estado_check"
```

La función `fn_finalizar_pausa` intenta hacer `UPDATE SET estado = 'completada'`, pero el CHECK constraint de la tabla solo permite: `'activa'`, `'finalizada'`, `'expirada'`.

**El valor `'completada'` no está en la lista de valores permitidos.** Cada intento de finalizar la pausa falla por esta restricción.

### Bug secundario detectado
El CHECK de `tipo_pausa` solo permite `'comida'`, `'bano'`, `'descanso'` — falta `'desayuno'`, lo que bloquearía pausas de desayuno.

## Solución

### 1. Migración SQL — Corregir la función `fn_finalizar_pausa`

Cambiar la línea del RPC que escribe `'completada'` a `'finalizada'` (el valor que sí acepta el constraint):

```sql
UPDATE bitacora_pausas_monitorista
SET estado = 'finalizada', fin_real = now()
WHERE id = v_pausa.id;
```

Y agregar `'desayuno'` al CHECK de `tipo_pausa`.

### 2. Migración SQL — Liberar las pausas actualmente atrapadas

Ejecutar un UPDATE directo para desbloquear a los 2 monitoristas actualmente atrapados, marcando sus pausas como `'finalizada'`.

### 3. Frontend — Corregir el tipo de respuesta

En `useMonitoristaPause.ts`, el cast `data as { count: number }` no coincide con la respuesta del RPC (`restored`/`skipped`). Corregir para usar los campos reales.

## Archivos a modificar

- **SQL Migration**: `fn_finalizar_pausa` — cambiar `'completada'` → `'finalizada'`; agregar `'desayuno'` al CHECK de tipo_pausa
- **SQL Data fix**: Liberar las 2 pausas activas atrapadas
- `src/hooks/useMonitoristaPause.ts` — corregir el tipo de respuesta del mutation `finalizarPausa`

