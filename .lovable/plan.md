

# Fix: Redistribución de pausa solo a staff en turno

## Problema

Cuando un monitorista activa una pausa, el sistema redistribuye sus servicios a **todos** los usuarios con rol `monitoring`/`monitoring_supervisor` en `user_roles`, sin verificar si están realmente en turno. Esto causa que monitoristas fuera de turno reciban servicios.

## Causa

En `src/hooks/useMonitoristaPause.ts`, tanto la función `previewPauseRedistribution` (línea ~157) como la mutación `startPause` (línea ~235) obtienen candidatos únicamente de `user_roles` con `is_active = true`, sin cruzar con `bitacora_heartbeat` para verificar presencia real.

## Fix

**Archivo:** `src/hooks/useMonitoristaPause.ts`

En ambos lugares (preview ~línea 163 y mutación ~línea 241), después de obtener `allMonitoristas` de `user_roles`, filtrar adicionalmente contra `bitacora_heartbeat` para incluir solo monitoristas con heartbeat reciente (últimos 5 minutos), replicando la misma lógica de detección que usa `useMonitoristaAssignment.ts`:

```typescript
// After getting allMonitoristas from user_roles...
const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
const { data: heartbeats } = await (supabase as any)
  .from('bitacora_heartbeat')
  .select('user_id')
  .gte('last_ping', fiveMinAgo);

const onlineIds = new Set((heartbeats || []).map((h: any) => h.user_id));
const onShiftMonitoristas = allMonitoristas.filter(id => onlineIds.has(id));

// Use onShiftMonitoristas instead of allMonitoristas for subsequent filtering
```

Esto se aplica en **2 lugares** dentro del mismo archivo:
1. Función `previewPauseRedistribution` (~línea 163)
2. Mutación `startPause` (~línea 241)

### Alcance
- 1 archivo modificado: `useMonitoristaPause.ts` (~6 líneas añadidas en 2 lugares)
- Sin cambios en UI ni otros archivos

