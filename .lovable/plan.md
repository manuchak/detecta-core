

# Plan: Scroll en Drawers de Fase + Tipo de Evento Visible

## Problema

1. El `ScrollArea` del drawer no permite hacer scroll más allá del contenido visible inicial
2. En el drawer de "Evento", las tarjetas no muestran qué tipo de evento está activo (combustible, descanso, pernocta, etc.), lo que puede causar alarma innecesaria

## Cambios

### `src/components/executive/PhaseServicesDrawer.tsx`

**Scroll fix**: Reemplazar `ScrollArea` con un `div` que use `overflow-y-auto` nativo. El `ScrollArea` de Radix dentro del drawer de vaul tiene problemas conocidos de interacción táctil. Un div con overflow nativo funciona correctamente con el gesture system de vaul.

**Tipo de evento**: En la `ServiceCard`, cuando el servicio tiene `activeEvent`, mostrar un badge con el icono y label del tipo de evento (usando `EVENTO_ICONS` de `useEventosRuta`). Ejemplo: "⛽ Combustible · 23m" o "☕ Descanso · 12m" en lugar de solo mostrar que está en fase "Evento".

```text
┌─────────────────────────────┐
│ ASCAAST-1520          🕐 14:30 │
│ Cliente Ejemplo               │
│ CDMX → Querétaro             │
│ 👤 Juan Pérez  🛡️ Pedro López │
│ ☕ Descanso · 12m             │  ← NUEVO: badge con tipo
└─────────────────────────────┘
```

### Archivos

| Archivo | Acción |
|---------|--------|
| `src/components/executive/PhaseServicesDrawer.tsx` | Editar — scroll nativo + badge de tipo de evento |

