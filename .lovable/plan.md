

# Sincronizar visibilidad de servicios inferidos en Bitácora

## Problema
El coordinador ve 10 servicios para Jose Eduardo (8 formales + 2 inferidos por actividad). Pero la bitácora del monitorista solo filtra por asignaciones formales (`activo = true`), así que ve 8.

## Solución
Ampliar el filtro Q0 en `useBitacoraBoard.ts` para que, además de las asignaciones formales, también incluya servicios donde el monitorista ha registrado eventos (`servicio_eventos_ruta.registrado_por = user.id`) y no hay otro monitorista formalmente asignado. Esto alinea ambas vistas.

### Cambios

**`src/hooks/useBitacoraBoard.ts`** — modificar `assignedIdsQuery`:

1. Mantener la query actual a `bitacora_asignaciones_monitorista` (formales)
2. Agregar una segunda query a `servicio_eventos_ruta` para obtener `servicio_id` distintos donde `registrado_por = user.id` y el servicio está activo (sin `hora_fin_real`)
3. Hacer `union` de ambos sets de IDs para el filtro `.in('id_servicio', ...)`

```typescript
// Formal assignments
const { data: formal } = await supabase
  .from('bitacora_asignaciones_monitorista')
  .select('servicio_id')
  .eq('monitorista_id', user.id)
  .eq('activo', true);

// Inferred: services where I registered events (still active)
const { data: inferred } = await supabase
  .from('servicio_eventos_ruta')
  .select('servicio_id')
  .eq('registrado_por', user.id);

// Merge unique IDs
const allIds = [...new Set([
  ...(formal || []).map(r => r.servicio_id),
  ...(inferred || []).map(r => r.servicio_id),
])];
return allIds;
```

Esto garantiza que si un monitorista ya trabajó en un servicio (registró checkpoint, inicio, etc.), lo seguirá viendo en su tablero aunque la asignación formal se haya perdido.

Un solo archivo modificado, sin cambios en la vista del coordinador.

