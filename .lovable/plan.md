

# QA: Vectores de Cierre Automático No Protegidos

## Hallazgo Principal

Existen **3 vectores** en el sistema que pueden cerrar servicios automáticamente. Solo **1 de 3** tiene las protecciones completas.

---

## Mapa de Vectores

```text
Vector                         │ en_destino │ inicio_reciente │ evento_activo │ auditoría │ Estado
───────────────────────────────┼────────────┼─────────────────┼───────────────┼───────────┼────────
useMonitoristaAssignment.ts    │     ✅      │       ✅         │      ✅        │     ✅     │ SEGURO
  → handoffTurno (individual)  │            │                 │               │           │
                               │            │                 │               │           │
useShiftHandoff.ts             │     ❌      │       ❌         │      ❌        │     ❌     │ VULNERABLE
  → executeHandoff (masivo)    │            │                 │               │           │
                               │            │                 │               │           │
useStaleServiceCleanup.ts      │     ❓      │       ❓         │      ❓        │     ❌     │ DESCONOCIDO
  → RPC cerrar_servicios_      │  (depende  │  (depende del   │  (depende del │           │ (caja negra
    estancados (admin)         │  del SQL)  │  SQL)           │  SQL)         │           │  en DB)
```

---

## Vector 1: `useShiftHandoff.ts` — CRÍTICO

**Líneas 212-251**: El handoff masivo del coordinador solo verifica si hay eventos en las últimas 6 horas. Si no hay, cierra el servicio **sin verificar**:

1. **`en_destino`** — Un servicio que ya llegó a destino pero lleva >6h esperando liberación (normal en entregas nocturnas) se cierra erróneamente.
2. **`inicio_reciente`** (12h) — Un servicio que inició hace 8h pero tuvo su último evento hace 6.5h se cierra, aunque está en ruta activa.
3. **`evento_activo` (hora_fin IS NULL)** — Un servicio con pernocta activa, incidencia abierta o tráfico prolongado se cierra porque no tiene eventos *recientes* (la pernocta empezó hace >6h).

Esto es exactamente lo que causó el cierre de GRASGCI-1.

**Además**: No registra anomalías en `bitacora_anomalias_turno`, haciendo los cierres invisibles para auditoría.

## Vector 2: `useStaleServiceCleanup.ts` — RIESGO MEDIO

Llama a los RPCs `detectar_servicios_estancados` y `cerrar_servicios_estancados` que viven 100% en la base de datos. No sabemos si el SQL tiene las mismas protecciones. Si no excluye servicios con `en_destino = true` o eventos especiales activos (`hora_fin IS NULL`), puede cerrar servicios legítimos en lote.

---

## Plan de Corrección

### Archivo 1: `src/hooks/useShiftHandoff.ts`
Alinear la lógica de cierre automático (líneas 212-251) con las protecciones de `useMonitoristaAssignment.ts`:

- **Antes de cerrar**, consultar `servicios_planificados` para obtener `en_destino` y `hora_inicio_real`
- **Antes de cerrar**, consultar `servicio_eventos_ruta` para eventos con `hora_fin IS NULL` en tipos especiales
- Si `en_destino = true` OR `hora_inicio_real > 12h ago` OR tiene evento especial activo → **transferir en vez de cerrar**
- Registrar anomalía `cierre_automatico_handoff` en `bitacora_anomalias_turno` para cada servicio cerrado
- Agregar log de servicios protegidos al resultado del handoff para visibilidad del coordinador

### Archivo 2: `src/hooks/useStaleServiceCleanup.ts`
- Agregar validación client-side **antes** de llamar al RPC `cerrar_servicios_estancados`: filtrar la lista de `staleServices` y advertir al coordinador si alguno tiene `en_destino` o eventos activos
- Agregar toast de warning si el RPC cierra servicios que no estaban en la lista detectada (delta check)

### Resultado esperado
Los 3 vectores compartirán las mismas 3 reglas de protección:
1. `en_destino = true` → nunca cerrar automáticamente
2. `hora_inicio_real` dentro de las últimas 12h → nunca cerrar automáticamente  
3. Evento especial activo (`hora_fin IS NULL`) → nunca cerrar automáticamente

Servicios protegidos se **transfieren** al turno entrante en vez de cerrarse.

