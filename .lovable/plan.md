

# Plan: Force-Logout de Monitorista por Coordinador

## Problema
Un monitorista puede quedarse con sesión activa (e.g., abandona turno sin cerrar sesión, emergencia, o cuenta comprometida). El coordinador necesita poder forzar el cierre de sesión desde su tablero.

## Diseño de la Solución

La estrategia se basa en un **mecanismo de "kill switch" por base de datos** que no requiere acceso directo a la sesión del monitorista. Supabase no permite invalidar tokens JWT existentes desde el cliente, por lo que usaremos una Edge Function con `service_role` que llame a `auth.admin.signOut()` del usuario objetivo.

### Flujo:

```text
Coordinador (UI)          Edge Function              Supabase Auth
     │                         │                          │
     ├─ Click "Cerrar sesión"  │                          │
     ├────────────────────────►│                          │
     │                         ├─ Verificar rol caller    │
     │                         ├─ admin.signOut(userId)  ─┤
     │                         ├─ Desactivar heartbeat    │
     │                         ├─ Desactivar asignaciones │
     │                         ◄──────── OK ──────────────┤
     ◄─ Toast confirmación ────┤                          │
```

### Componentes a crear/modificar:

**1. Edge Function: `force-logout-monitorista`** (nueva)
- Recibe `{ monitorista_id: string }` + JWT del caller
- Valida que el caller tenga rol `monitoring_supervisor`, `coordinador_operaciones`, `admin` u `owner` (via RPC `get_current_user_role_secure` con el JWT del caller)
- Ejecuta `auth.admin.signOut(monitorista_id, 'global')` para invalidar todas las sesiones
- Desactiva heartbeat del monitorista (`DELETE FROM monitorista_heartbeat WHERE user_id = X`)
- Desactiva asignaciones activas (`UPDATE bitacora_asignaciones_monitorista SET activo = false WHERE monitorista_id = X AND activo = true`)
- Registra una anomalía en `bitacora_anomalias_turno` con tipo `force_logout` para auditoría
- Retorna `{ ok: true, services_released: number }`

**2. Hook: `useForceLogout.ts`** (nuevo)
- `useMutation` que llama a `supabase.functions.invoke('force-logout-monitorista', { body: { monitorista_id } })`
- Invalida queries relevantes: `monitorista-assignments`, `paused-monitorista-ids`, `monitoristas-profiles`
- Toast de confirmación con cantidad de servicios liberados

**3. UI: Botón en `MonitoristaCard.tsx`**
- Nuevo botón con icono `LogOut` visible solo para coordinadores (prop `isCoordinator`)
- Dialog de confirmación con nombre del monitorista y advertencia de que se liberarán sus servicios
- Estado loading mientras se ejecuta

**4. Integración en `CoordinatorCommandCenter.tsx`**
- Pasar prop `isCoordinator={true}` y callback `onForceLogout` a cada `MonitoristaCard`

### Protecciones de seguridad:
- La Edge Function usa `service_role` solo después de validar el rol del caller via JWT
- El monitorista no puede forzar logout a otros monitoristas (solo coordinadores+)
- Se registra auditoría completa (quién, cuándo, cuántos servicios liberados)
- Los servicios liberados quedan disponibles para OrphanGuard los re-asigne automáticamente

### Impacto en workflows existentes:
- **OrphanGuard**: Los servicios liberados serán detectados como huérfanos en el siguiente ciclo (15s) y re-asignados automáticamente. Sin cambios necesarios.
- **BalanceGuard**: Funciona igual, el monitorista desaparecerá del pool `en_turno` al no tener heartbeat.
- **Pausas**: Si el monitorista estaba en pausa, la pausa se finaliza automáticamente.
- **Handoff**: No afectado, el coordinador puede seguir usando entrega de turno normal para casos no urgentes.

### Archivos:
| Archivo | Acción |
|---|---|
| `supabase/functions/force-logout-monitorista/index.ts` | Crear |
| `src/hooks/useForceLogout.ts` | Crear |
| `src/components/monitoring/coordinator/MonitoristaCard.tsx` | Agregar botón + dialog |
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | Pasar props |

