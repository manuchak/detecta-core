

# Análisis de compatibilidad: Fix "En sitio" con todos los workflows

## Resumen del hallazgo

La columna `hora_llegada_custodio` es tipo **`time without time zone`** (HH:MM:SS). Hay **3 puntos** en el código que escriben a esta columna y **2 subsistemas downstream** que la leen.

## Mapa completo de escrituras y lecturas

### Escrituras (3 puntos)

| # | Función | Archivo | Valor actual | Compatible con `time`? |
|---|---------|---------|-------------|----------------------|
| 1 | `updateOperationalStatus` (mark_on_site) | `useServiciosPlanificados.ts:999` | `new Date().toISOString()` → `"2026-03-05T18:30:00.000Z"` | **NO — este es el bug de Axel** |
| 2 | `updateOperationalStatus` (revert) | `useServiciosPlanificados.ts:1000` | `null` | OK |
| 3 | `markFalsePositioning` | `useServiciosPlanificados.ts:1049` | `horaLlegada` viene del input `<time>` del dialog → formato `"HH:mm"` | OK — ya es formato time |

### Lecturas downstream (2 subsistemas)

| # | Subsistema | Archivo | Cómo lee | Impacto del fix |
|---|-----------|---------|---------|-----------------|
| 1 | **Auto-detectar incumplimientos** (edge function) | `auto-detectar-incumplimientos/index.ts:361-376` | Espera formato `"HH:MM:SS"`, hace `split(':')` y compara minutos | OK — el fix produce `"HH:MM:SS"` que es exactamente lo que espera |
| 2 | **Vistas de custodias** (SQL views) | 6+ migraciones | Usa `sp.fecha_hora_cita::date + sp.hora_llegada_custodio` para construir `hora_presentacion` como timestamptz | OK — PostgreSQL suma `date + time` correctamente con tipo `time` nativo |

### Lecturas en frontend (2 componentes)

| # | Componente | Cómo lee | Impacto |
|---|-----------|---------|---------|
| 1 | `CompactServiceCard.tsx:55` | `if (service.hora_llegada_custodio && !service.hora_inicio_real)` → solo chequea truthy | OK — `"14:30:00"` es truthy |
| 2 | `ScheduledServicesTabSimple.tsx:222` | Misma condición truthy | OK |

## Diagnóstico

El fix es **100% compatible** con todos los workflows existentes. Solo hay **un punto de fallo** (línea 999) y el cambio de `new Date().toISOString()` a formato `HH:mm:ss` en timezone CDMX:

- Alinea con lo que la edge function de incumplimientos ya espera
- Alinea con lo que las SQL views ya hacen (date + time arithmetic)
- Alinea con lo que el `FalsePositioningDialog` ya envía (formato HH:mm)
- No rompe ninguna condición truthy en el frontend

## Plan de corrección (1 archivo, 1 línea)

**`src/hooks/useServiciosPlanificados.ts` línea 998-999**:

Cambiar:
```typescript
const updateData = action === 'mark_on_site' 
  ? { hora_llegada_custodio: new Date().toISOString() }
```

Por:
```typescript
const now = new Date();
const timeOnly = now.toLocaleTimeString('en-GB', { 
  hour: '2-digit', minute: '2-digit', second: '2-digit', 
  hour12: false, timeZone: 'America/Mexico_City' 
});
const updateData = action === 'mark_on_site' 
  ? { hora_llegada_custodio: timeOnly }
```

## Sobre el RPC y la interfaz TypeScript

El segundo problema (RPC no retorna `hora_llegada_custodio`) es de **visibilidad**, no de persistencia. Los componentes ya leen el campo, pero el RPC no lo incluye en el JSON, así que el campo siempre llega como `undefined`. Esto causa que después de marcar "En sitio" exitosamente, la UI no refleje el cambio hasta refrescar manualmente. Para corregir esto se necesita:

1. **SQL**: Agregar `'hora_llegada_custodio', sp.hora_llegada_custodio` al `jsonb_build_object` del RPC `get_real_planned_services_summary`
2. **TypeScript**: Agregar `hora_llegada_custodio?: string` a la interfaz `ScheduledService` en `useScheduledServices.ts`

Estos 3 cambios (1 formato + 1 SQL + 1 tipo) resuelven completamente el problema de Axel sin afectar ningún otro workflow.

