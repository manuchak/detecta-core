

# Auditoría QA — Gaps restantes para superar 9/10

## Hallazgos por Severidad

### SEVERIDAD ALTA — useMonitoristaAssignment.ts sin protección RLS

Mientras `useBitacoraBoard.ts` y `useServiciosPlanificados.ts` ya están blindados, **useMonitoristaAssignment.ts tiene 15+ operaciones de escritura sin `.select('id')` ni verificación de filas afectadas**. Estas son las mutaciones del módulo de asignación de monitoristas — el motor de distribución de carga.

| Mutación | Operaciones sin proteger |
|---|---|
| `assignService` | 1 deactivate + 1 insert sin verify |
| `autoDistribute` | 1 deactivate masivo + N inserts sin verify |
| `resetAndRedistribute` | 1 deactivate global + N inserts + 1 anomalía insert sin verify |
| `reassignService` | 1 deactivate + 1 insert sin verify |
| `handoffTurno` | 3 deactivates + 2 inserts sin verify (el update a servicios_planificados SÍ tiene .select) |
| `rebalanceLoad` | N deactivates + N inserts + 1 anomalía sin verify |
| `endTurno` | 1 update sin verify |

**Riesgo**: Si RLS bloquea una desactivación, el insert posterior crea una asignación duplicada. El índice parcial único `idx_unique_active_assignment` la atraparía con error `23505`, pero el servicio podría quedar con 0 monitoristas asignados si el insert también falla silenciosamente.

### SEVERIDAD MEDIA — Anomalías y notificaciones fire-and-forget

- `bitacora_anomalias_turno` inserts en `handoffTurno`, `resetAndRedistribute`, `rebalanceLoad` no verifican persistencia. Si falla, se pierde trazabilidad del evento operativo.
- `lifecycleAutomations.ts` — `sendCompletionNotifications` es fire-and-forget con `.catch(console.error)`. Si la notificación al cliente falla, nadie se entera.

### SEVERIDAD MEDIA — Empty catch blocks en módulos operativos

110 `catch {}` o `catch(e) {}` encontrados. Los más peligrosos:
- `src/hooks/useServiceChecklist.ts` — fallos en limpieza de checklist ignorados
- `src/pages/armado/ArmadoDashboard.tsx` — refresh de servicios de armado silenciado

---

## Plan de Correcciones — 3 Bloques

### Bloque 1: Protección RLS en useMonitoristaAssignment.ts (Crítico)

Agregar `assertRowsAffected` al archivo y aplicar el patrón `.select('id')` + verificación a:

- **Deactivaciones**: Todas las operaciones `.update({ activo: false })` deben usar `.select('id')` y verificar que se desactivó al menos 1 fila antes de hacer el insert de nueva asignación.
- **Inserts**: Los inserts que no son 23505-tolerant deben verificar persistencia.
- **`endTurno`**: Agregar `.select('id')` + assert para confirmar que el turno se cerró.
- **Anomalías**: Los inserts a `bitacora_anomalias_turno` deben usar `.select('id')` con `toast.warning` si fallan (sin bloquear el flujo principal).

### Bloque 2: Notificaciones con fallback visible

En `lifecycleAutomations.ts`, cambiar `.catch(console.error)` a un patrón que registre el fallo en `bitacora_anomalias_turno` como tipo `notificacion_fallida`. Esto garantiza que si un cliente no recibe su notificación de cierre/posicionamiento, quede registro para seguimiento manual.

### Bloque 3: Sanitización de empty catches en módulos críticos

Reemplazar `catch {}` por `catch (e) { console.warn('[módulo] operación falló:', e) }` en:
- `useServiceChecklist.ts`
- `ArmadoDashboard.tsx`

(Los `catch {}` en localStorage/sessionStorage y `.json().catch(() => ({}))` de edge functions son aceptables y se mantienen).

---

## Archivos a modificar

1. `src/hooks/useMonitoristaAssignment.ts` — Bloque 1 (15+ correcciones)
2. `src/lib/lifecycleAutomations.ts` — Bloque 2 (3 correcciones)
3. `src/hooks/useServiceChecklist.ts` — Bloque 3
4. `src/pages/armado/ArmadoDashboard.tsx` — Bloque 3

## Proyección de calificación

| Módulo | Actual | Post-corrección |
|---|---|---|
| Monitoreo (Bitácora) | 8.5 | 8.5 (ya blindado) |
| Planeación | 8.5 | 8.5 (ya blindado) |
| Asignaciones Monitorista | 6.0 | 9.0 |
| Notificaciones | 6.5 | 8.5 |
| **General** | **7.5** | **9.0+** |

