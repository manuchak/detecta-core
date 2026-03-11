

# Fix: Conversación no muestra mensajes enviados ni recibidos

## Problema

Dos causas identificadas confirmadas con datos reales de la DB:

1. **Prefijo incorrecto**: `kapso-send-message` normaliza teléfonos a `52` + 10 dígitos (ej: `525518095686`), pero la UI busca `521` + 10 dígitos (`5215518095686`). No coincide.

2. **Filtro de servicio_id**: Todos los mensajes en DB tienen `servicio_id = NULL`, pero cuando `servicioId` tiene valor en la UI, la query agrega `.eq('servicio_id', servicioId)` y excluye todo.

## Datos en DB (confirmados)

```text
chat_id real:       525518095686   (12 dígitos, prefijo 52)
UI busca:           5215518095686  (13 dígitos, prefijo 521) ← NO MATCH
```

## Cambios en `src/components/monitoring/comm/CommTestPanel.tsx`

### 1. Corregir variantes de chat_id en todo el archivo
Cambiar `521${phone}` → `52${phone}` en:
- `fetchMessages` query (línea 647)
- Realtime subscription filter (línea 667)
- `handleQuickSend` custodio sim insert (línea 701)
- `PersistenceSection` query (si aplica)

### 2. Hacer el filtro de servicio_id opcional
Cuando `servicioId` está vacío, no filtrar por servicio (ya funciona así). Pero también agregar filtro **OR** que incluya mensajes con `servicio_id IS NULL` para el mismo chat_id, ya que los mensajes reales no tienen servicio vinculado aún:

```typescript
// Antes (excluye mensajes sin servicio):
if (servicioId) query = query.eq('servicio_id', servicioId);

// Después (incluye mensajes del servicio O sin servicio asignado):
if (servicioId) query = query.or(`servicio_id.eq.${servicioId},servicio_id.is.null`);
```

Esto asegura que los mensajes enviados antes de implementar el fallback de herencia de servicio_id sigan visibles.

### Archivo

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/comm/CommTestPanel.tsx` | Corregir prefijo `52` en queries, realtime y sim insert; relajar filtro servicio_id |

