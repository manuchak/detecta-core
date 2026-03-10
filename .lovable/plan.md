

# Análisis completo del módulo de pausas de monitoreo

## Estado actual de la base de datos

### Pausas huérfanas confirmadas (Karla Galvez)
Hay **2 asignaciones `pausa_interina` activas** sin pausa correspondiente:
- `ASCAAST-1528` → asignado a Cintia Chavez (originalmente de Karla)
- `LOERLLO-387` → asignado a Ma. Fernanda Martinez (originalmente de Karla)

No existe registro en `bitacora_pausas_monitorista` con `estado = 'activa'` para Karla (`4e32f256...`). Esto confirma que la pausa de Karla falló parcialmente: los servicios se redistribuyeron pero el registro de pausa nunca se creó.

### Edge functions nunca estuvieron desplegadas
Las 3 edge functions (`iniciar-pausa-monitorista`, `finalizar-pausa-monitorista`, `reparar-pausa-huerfana`) **no tenían logs** — nunca fueron desplegadas. Esto significa que **todas las invocaciones desde el hook fallaron silenciosamente** con un error HTTP (probablemente 404).

**Ya las desplegué** durante este análisis. Ahora están activas.

## Bugs identificados

### Bug 1: Error silencioso en `supabase.functions.invoke`
Cuando `supabase.functions.invoke()` falla porque la función no existe (404), la librería de Supabase devuelve `{ data: null, error: FunctionsHttpError }`. Sin embargo, el error puede venir como un `FunctionsHttpError` cuyo `.message` es genérico. El hook actual maneja esto correctamente pero el toast solo muestra el mensaje genérico.

### Bug 2: Operaciones no son transaccionales
Aunque el comentario dice "transactional", la edge function `iniciar-pausa-monitorista` ejecuta ~12 queries individuales secuenciales (no en una transacción SQL). Si falla entre el paso 6 (desactivar/crear asignaciones) y el paso 7 (insertar pausa), se produce exactamente el estado huérfano de Karla.

### Bug 3: La edge function `reparar-pausa-huerfana` busca por `asignado_por`
La función busca asignaciones donde `asignado_por` = el monitorista original. Pero en el flujo actual, `asignado_por` se setea como `userId` (el monitorista que inicia la pausa), que **es** el monitorista original. Esto es correcto — funciona para reparar.

### Bug 4: PauseOverlay condicionado incorrectamente
```typescript
const showPauseOverlay = !!pausaActiva && isMonitorista && !isAdminOrCoord;
```
Si un usuario tiene roles `monitoring` + `monitoring_supervisor`, `isAdminOrCoord` será `true` y el overlay nunca se muestra. Esto puede afectar a supervisores que también monitorean.

## Plan de corrección

### A. Reparar datos huérfanos de Karla (inmediato)
Ejecutar la edge function `reparar-pausa-huerfana` ahora que está desplegada, o ejecutar un SQL directo para:
1. Desactivar las 2 asignaciones `pausa_interina` activas de Karla
2. Re-crear las asignaciones originales para Karla

### B. Hacer la edge function verdaderamente transaccional
Refactorizar `iniciar-pausa-monitorista` para usar una **función RPC de PostgreSQL** que ejecute todo en una sola transacción SQL:
- Crear un RPC `fn_iniciar_pausa(p_user_id, p_tipo_pausa)` que haga toda la lógica en PL/pgSQL
- La edge function solo valida auth y llama al RPC
- Si cualquier paso falla → ROLLBACK automático de PostgreSQL

### C. Mejorar la condición del PauseOverlay
Cambiar la lógica para que el overlay se muestre siempre que haya una pausa activa del usuario actual, independientemente del rol:
```typescript
const showPauseOverlay = !!pausaActiva;
```
Los coordinadores que no están en pausa nunca tendrán `pausaActiva`, así que no les afecta.

### D. Agregar logging de errores más descriptivo
En el hook, loggear el error completo de `functions.invoke` para facilitar debugging futuro.

### Archivos afectados
- `supabase/functions/iniciar-pausa-monitorista/index.ts` — refactorizar a RPC transaccional
- `supabase/functions/finalizar-pausa-monitorista/index.ts` — refactorizar a RPC transaccional
- `src/components/monitoring/bitacora/BitacoraBoard.tsx` — fix condición del overlay
- `src/hooks/useMonitoristaPause.ts` — mejorar error logging
- Migración SQL: crear funciones RPC `fn_iniciar_pausa` y `fn_finalizar_pausa`

### Reparación inmediata de Karla
Se puede hacer con el botón "Reparar pausas" de la UI del coordinador ahora que la edge function está desplegada, o si se prefiere certeza, con un SQL directo.

