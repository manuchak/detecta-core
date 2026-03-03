

# Diagnóstico Crítico del Dashboard de Seguridad

## Bugs de Datos (raíz de los problemas visibles)

### Bug 1: "380 checklists de 0 servicios" → 0% cobertura
La tabla `siniestros_historico` tiene **26 filas con `servicios_completados = 0`** en TODAS. Los datos del Fill Rate nunca se insertaron correctamente — solo se popularon `siniestros` y `fecha`, pero los volúmenes de servicios quedaron en 0. Esto causa la división 0/0 y el 0% falso.

### Bug 2: "Siniestro hace 4 días" → CRÍTICA falsa
El incidente `agresion` del 26-Feb-2026 (secuestro en gasolinera) está marcado como `es_siniestro: true`. Según tu propio criterio: **siniestro = robo consumado o pérdida humana**. Un secuestro de custodio sin robo de carga NO es siniestro. Esto dispara la postura "CRÍTICA" incorrectamente. Sin este registro, el último siniestro real fue el 2-Dic-2025 (93 días) → postura debería ser **ESTABLE**.

### Bug 3: Sparkline DRF con piso falso
Como `servicios_completados = 0`, la tasa de siniestralidad es `siniestros / 0` → NaN o 0. El sparkline no refleja la realidad.

## Crítica de UI — ¿Es este el mejor diseño?

No. Tres problemas fundamentales:

1. **Señales contradictorias**: Banner rojo "CRÍTICA" junto a gauge verde "23.3 Bajo Mejorando". Un directivo no sabe si preocuparse o no. La postura y el DRF deben contar la misma historia.

2. **Cobertura de Controles ocupa 1/3 del espacio para mostrar "0%"**: Es una card enorme con un solo número roto. Debería ser un KPI compacto en la fila de KPIs, no una card independiente del mismo tamaño que el DRF.

3. **Densidad sin jerarquía**: 5 filas de cards, todas del mismo peso visual. Un Head of Security necesita: (a) ¿Estamos bien o no? (b) ¿Qué cambió? (c) ¿Qué debo hacer? El layout actual no responde esas preguntas en orden.

## Plan de Corrección

### Paso 1 — Fix datos en `siniestros_historico`
UPDATE las 26 filas con los volúmenes reales del Fill Rate Excel (servicios_solicitados y servicios_completados por mes). Esto corrige el 0% de cobertura y la sparkline.

### Paso 2 — Reclasificar el incidente de agresión
El secuestro en gasolinera (Feb 26) → `es_siniestro: false` (no hubo robo de carga). La postura pasará de CRÍTICA a ESTABLE (93 días sin siniestro real).

### Paso 3 — Rediseño del layout del dashboard
Propuesta de layout más ejecutivo:

```text
┌─────────────────────────────────────────────────┐
│  POSTURA: ESTABLE  ·  93d sin siniestro  ·     │
│  DRF: 23.3 ↓  ·  Cobertura: 12.5%  ·  1 ATR   │
│  (banner compacto con todos los KPIs inline)    │
└─────────────────────────────────────────────────┘

┌──────────────── DRF Card ───────────────────────┐
│  Gauge + Period Selector + Trend + Sparkline    │
│  (todo en UNA card, sparkline integrado abajo)  │
│  Breakdown colapsable                           │
└─────────────────────────────────────────────────┘

┌─── Heatmap ───┬─── Distribución ──┬── Acciones ─┐
│  4 semanas    │  Zonas por nivel  │ Prioridades  │
└───────────────┴───────────────────┴──────────────┘

┌── Operativos ─────────┬── Inteligencia ─────────┐
│  Timeline incidentes  │  Eventos externos       │
└───────────────────────┴─────────────────────────┘
```

Cambios clave:
- **Banner compacto**: Una sola línea con postura + KPIs críticos (DRF, cobertura, días sin siniestro). No una card roja gigante.
- **Cobertura de Controles**: Se mueve al banner como KPI inline, ya no es card independiente.
- **DRF + Sparkline**: Se fusionan en una sola card (eliminar la card separada de sparkline).
- **KPI row (4 cards)**: Se elimina — los 4 valores se integran al banner o al DRF card.

### Paso 4 — Lógica de coherencia postura ↔ DRF
Si DRF < 25 (Bajo), la postura NO puede ser "CRÍTICA" a menos que haya un siniestro en los últimos 7 días. Agregar validación cruzada para evitar señales contradictorias.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | UPDATE `siniestros_historico` con servicios reales; UPDATE agresion `es_siniestro=false` |
| `SecurityDashboard.tsx` | Nuevo layout: banner compacto, DRF+sparkline fusionados, eliminar card de cobertura |
| `PostureBanner.tsx` | Rediseño compacto con KPIs inline |
| `DetectaRiskFactorCard.tsx` | Integrar sparkline dentro de la card |
| `useSecurityDashboard.ts` | Validación cruzada postura ↔ DRF |

