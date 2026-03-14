

# Análisis Fishbone — Pérdida de Trazabilidad en Servicios de Monitoreo

## Diagrama Causa-Raíz (Ishikawa)

```text
                              PÉRDIDA DE TRAZABILIDAD
                              EN SERVICIOS ACTIVOS
                                       │
    ┌──────────────────┬───────────────┼───────────────┬──────────────────┐
    │                  │               │               │                  │
  DATOS            PROCESOS       TECNOLOGÍA      PERSONAS          ENTORNO
    │                  │               │               │                  │
    ├─ Updates sin     ├─ handoff      ├─ RLS silenc.  ├─ Coordinador    ├─ Pernocta
    │  .select('id')   │  cierra srv   │  bloquea      │  no ve alerta   │  suprime
    │  (fallos         │  >6h sin      │  write sin    │  de servicio    │  alertas
    │  silenciosos)    │  validar      │  error        │  huérfano       │  ──────
    │  ──────────      │  eventos      │  ──────       │  ──────         │
    ├─ insert evento   │  activos      ├─ Realtime     ├─ Monitorista   ├─ Cambio
    │  sin confirmar   │  ──────       │  pierde msg   │  en pausa no   │  de turno
    │  éxito           ├─ liberarCust  │  (reconnect)  │  notificado    │  nocturno
    │  ──────────      │  no verifica  │  ──────       │  de reasig.    │  sin
    ├─ en_destino      │  que update   ├─ Tab inactiv  │  ──────        │  cobertura
    │  flag sin        │  afectó filas │  15s polling   │                │  ──────
    │  confirmar       │  ──────       │  insuficiente │                │
    │  ──────────      ├─ OrphanGuard  │  para crítico │                │
    ├─ hora_fin_real   │  120s cooldown│  ──────       │                │
    │  escritura       │  deja ventana │                │                │
    │  "fire & forget" │  sin monitor  │                │                │
    │                  │  ──────       │                │                │
    │                  ├─ Stale svc    │                │                │
    │                  │  cleanup solo │                │                │
    │                  │  manual (admin)│               │                │
    │                  │  ──────       │                │                │
```

## Hallazgos Críticos

### 1. Escrituras sin verificación de éxito (DATOS — Severidad: CRÍTICA)
Las 7 mutaciones en `useBitacoraBoard.ts` hacen updates/inserts sin `.select('id')` y sin verificar que `data.length > 0`. Si RLS bloquea silenciosamente:
- `iniciarServicio` — `hora_inicio_real` no se escribe, servicio nunca "inicia"
- `liberarCustodio` — `hora_fin_real` + `estado_planeacion=completado` no se persisten, servicio queda "zombi" en el board
- `registrarLlegadaDestino` — `en_destino=true` no se persiste, custodio no puede ser liberado
- `registrarCheckpoint` — evento se pierde sin notificar al monitorista
- Inserts a `servicio_eventos_ruta` en todas las acciones — pierden la cronología completa

### 2. Handoff cierra servicios activos sin guardia (PROCESOS — Severidad: ALTA)
En `handoffTurno`, si un servicio no tiene eventos en las últimas 6h, se cierra automáticamente. Pero:
- No verifica si hay eventos especiales activos (pernocta, incidencia)
- No verifica si `en_destino=true` (custodio esperando liberación)
- El cierre automático no genera notificación al cliente ni al custodio (no llama `sendCompletionNotifications`)
- No registra en `bitacora_anomalias_turno` que el cierre fue por handoff

### 3. OrphanGuard con ventana ciega de 120s (PROCESOS — Severidad: MEDIA)
El cooldown de 120s + 15s de shared cooldown crea una ventana donde servicios pueden quedar sin monitorista asignado si hay múltiples reasignaciones concurrentes.

### 4. Cierre de servicios estancados solo manual (PROCESOS — Severidad: MEDIA)
`useStaleServiceCleanup` depende de que un admin ejecute manualmente el RPC `cerrar_servicios_estancados`. No hay limpieza automática programada.

### 5. Eventos críticos sin retry (TECNOLOGÍA — Severidad: ALTA)
Los inserts a `servicio_eventos_ruta` son fire-and-forget. Si falla la red o RLS, el evento se pierde sin notificar al operador.

---

## Plan de Blindaje — 5 Correcciones

### Corrección 1: Protección RLS Silent Failure en todas las mutaciones
**Archivo**: `src/hooks/useBitacoraBoard.ts`
- Agregar `.select('id')` a todos los `.update()` en:
  - `iniciarServicio` (línea 319-322)
  - `registrarLlegadaDestino` (línea 460-463)
  - `liberarCustodio` (línea 505-511, 515-519)
  - `revertirEnDestino` (línea 552-555)
- Verificar `if (!data || data.length === 0) throw new Error('Operación bloqueada por permisos')`
- Agregar `.select('id')` a todos los `.insert()` en `servicio_eventos_ruta` y verificar resultado

### Corrección 2: Blindaje de Handoff contra cierre indebido
**Archivo**: `src/hooks/useMonitoristaAssignment.ts` (líneas 463-499)
- Antes de cerrar un servicio por inactividad >6h, verificar:
  - No tiene eventos especiales activos (`hora_fin IS NULL`)
  - No está `en_destino=true`
  - No tiene `hora_inicio_real` reciente (<12h)
- Si tiene alguna condición, transferir en lugar de cerrar
- Agregar `sendCompletionNotifications()` para servicios que sí se cierran
- Registrar en `bitacora_anomalias_turno` cada cierre automático por handoff

### Corrección 3: Retry automático para eventos críticos
**Archivo**: `src/hooks/useBitacoraBoard.ts`
- Crear helper `insertEventoConRetry(params, maxRetries=2)` que:
  - Intenta el insert
  - Si falla, espera 2s y reintenta
  - Si falla definitivamente, muestra toast de error con detalle
  - Registra en console.error para debugging
- Aplicar en: `iniciarServicio`, `registrarCheckpoint`, `liberarCustodio`, `registrarLlegadaDestino`

### Corrección 4: Validación de integridad post-liberación
**Archivo**: `src/hooks/useBitacoraBoard.ts` — `liberarCustodio`
- Después de los updates, hacer re-fetch del servicio para confirmar:
  - `hora_fin_real` está escrito
  - `estado_planeacion === 'completado'`
  - La asignación de monitorista fue desactivada
- Si alguna validación falla, revertir y mostrar error al coordinador

### Corrección 5: Guardia anti-cierre en handoff para servicios con estado activo
**Archivo**: `src/hooks/useMonitoristaAssignment.ts` — `handoffTurno`
- Consultar `servicios_planificados` para obtener `en_destino`, `hora_inicio_real` antes de decidir cerrar
- Si el servicio está `en_destino` o tiene `hora_inicio_real` < 12h, SIEMPRE transferir, nunca cerrar
- Log explícito: `[Handoff] Servicio ${id} protegido de cierre — en_destino=${en_destino}`

---

## Archivos a modificar
1. `src/hooks/useBitacoraBoard.ts` — Correcciones 1, 3, 4
2. `src/hooks/useMonitoristaAssignment.ts` — Correcciones 2, 5

## Sin cambios en
- Base de datos / Edge Functions / RLS policies
- OrphanGuard / BalanceGuard (funcionan correctamente con las protecciones existentes)
- lifecycleAutomations.ts (ya tiene guards anti-duplicado)

