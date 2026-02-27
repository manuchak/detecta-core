
Objetivo: hacer un diagnóstico tipo fishbone del flujo de asignación en Planeación, corregir la causa raíz y blindar el sistema para que no rompa workflows que hoy sí funcionan.

## Diagnóstico (con evidencia)

Encontré evidencia directa de un caso reportado:
- Servicio de retorno `ASCAAST-1491` (`observaciones: [RETORNO]`) sigue con `custodio_asignado = null` y `estado_planeacion = pendiente_asignacion`.
- No hay trazas de asignación de armado ni registros de modificación para ese servicio.
- Esto coincide con el síntoma: “aparece éxito, pero no se guarda”.

## Fishbone (causa-efecto)

```text
PROBLEMA: "Asignación de custodio aparenta éxito pero no persiste" + fricción en retornos

├─ Código / Arquitectura
│  ├─ useServiciosPlanificados retorna mutate (no Promise) en:
│  │   assignCustodian, assignArmedGuard, reassignCustodian, reassignArmedGuard, removeAssignment
│  └─ Vistas consumidoras usan await sobre esas funciones
│      => await no espera realmente la operación (fire-and-forget)
│      => UI avanza y muestra éxito antes de confirmar BD
│
├─ Flujo / Concurrencia
│  ├─ No hay validación post-update (row updated + estado final real)
│  └─ No hay guardas idempotentes sólidas en asignación inicial
│
├─ UX / Producto
│  ├─ En PendingAssignmentModal, conflicto “override” no pide motivo formal
│  ├─ Para retorno, no hay camino guiado explícito de “asignación con justificación”
│  └─ Mensajes de éxito no están condicionados a persistencia real
│
├─ Datos / Reglas de negocio
│  ├─ Retornos dependen de reglas de conflicto horario
│  └─ Si hay conflicto o error backend, usuario puede creer que ya asignó
│
└─ Observabilidad
   ├─ Falta de telemetría específica del paso "intento/confirmación de asignación"
   └─ Difícil distinguir error funcional vs error de UX
```

## Causa raíz principal

Desacople entre contrato async y uso real:
- `useServiciosPlanificados` expone `.mutate` (void), pero varias pantallas lo usan con `await`.
- Resultado: se dispara la mutación en segundo plano, mientras el flujo UI continúa como si hubiera terminado correctamente.
- Este patrón explica exactamente el “se asignó exitosamente” sin persistencia verificable.

## Plan de corrección (seguro para no romper workflows sanos)

### Fase 1 — Hotfix de confiabilidad (sin cambiar reglas de negocio)
1. En `useServiciosPlanificados.ts`, mantener compatibilidad y agregar variantes async explícitas:
   - `assignCustodianAsync: assignCustodian.mutateAsync`
   - `assignArmedGuardAsync: assignArmedGuard.mutateAsync`
   - `reassignCustodianAsync`, `reassignArmedGuardAsync`, `removeAssignmentAsync`
   - No retirar los métodos actuales (`mutate`) para no romper llamadas existentes.
2. En `PendingAssignmentModal.tsx`, migrar a las variantes `Async`:
   - Solo mostrar éxito/cambiar pestaña/cerrar modal después de resolución real.
   - En error, no avanzar de paso.
3. En `ScheduledServicesTab.tsx` y `ScheduledServicesTabSimple.tsx`, usar variantes `Async` en reasignación/remoción donde hoy se usa `await` o se hace refresh prematuro.

Resultado esperado: elimina falsos positivos de éxito y sincroniza UI con persistencia real.

### Fase 2 — Blindaje de integridad (evitar inconsistencias silenciosas)
4. En mutaciones de asignación:
   - Validar estado fresco previo (read-before-write) para evitar decisiones sobre datos stale.
   - Hacer update con confirmación explícita (`select` posterior / verificación de fila afectada) y lanzar error si no se confirmó persistencia.
   - Si ya está asignado al mismo custodio, tratarlo como idempotente (éxito estable).
5. Normalizar manejo de errores:
   - Errores de conflicto, permisos o validación con mensajes accionables.
   - Sin toasts de éxito hasta comprobar persistencia.

### Fase 3 — UX para retornos (evitar error de flujo humano)
6. Integrar `ConflictOverrideModal` también en `PendingAssignmentModal` (hoy no está completo en ese flujo):
   - Si custodio viene de `ConflictSection`, exigir motivo antes de confirmar.
7. Para servicios detectados como retorno (`[RETORNO]` en observaciones o flag equivalente):
   - Preseleccionar motivo sugerido: “Servicio de retorno del mismo cliente”.
   - Mostrar microcopy: “Se registrará override para auditoría”.
8. Registrar metadata de override en servicio (`override_conflicto_*`) cuando aplique.

Resultado esperado: flujo intuitivo y auditable para casos especiales sin afectar asignaciones estándar.

## Archivos a intervenir

- `src/hooks/useServiciosPlanificados.ts`
- `src/components/planeacion/PendingAssignmentModal.tsx`
- `src/pages/Planeacion/components/ScheduledServicesTab.tsx`
- `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx`
- (opcional UX extra) `src/components/planeacion/ReassignmentModal.tsx`

## Riesgo y estrategia de no regresión

- Estrategia de bajo riesgo: agregar API async nueva en el hook (compatibilidad hacia atrás), migrar solo pantallas críticas primero.
- No tocar reglas centrales de disponibilidad de custodios fuera de lo necesario.
- Rollout incremental:
  1) PendingAssignmentModal
  2) Reasignaciones
  3) UX de override retorno

## Criterios de aceptación

1. Si la BD no se actualiza, la UI no muestra “asignado exitosamente”.
2. En retorno con conflicto, se puede completar asignación mediante override con justificación.
3. En retorno sin conflicto, asignación funciona como flujo normal.
4. Reasignaciones y remociones esperan persistencia real antes de refrescar/cerrar.
5. No se degradan los workflows ya funcionales (creación, edición, monitoreo).

## Pruebas E2E recomendadas (clave)

- Caso A: retorno sin conflicto → asignar custodio → persistencia en `servicios_planificados`.
- Caso B: retorno con conflicto → override + motivo → persistencia + metadata override.
- Caso C: error forzado backend (simulado) → UI permanece en paso actual, sin toast de éxito.
- Caso D: reasignación desde `ScheduledServicesTab` y `ScheduledServicesTabSimple` → espera real + refresco consistente.

## Nota técnica adicional

Detecté además errores de typecheck de `gl-matrix` en build (TS1540). Son independientes del bug de asignación, pero conviene resolverlos después del hotfix para mantener deploy estable.
