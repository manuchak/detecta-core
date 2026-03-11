
# Mejora del Dashboard Ops para Movil

## Estado actual del tab Ops (390px)

El tab "Ops" renderiza `OperationalOverview` que tiene 4 secciones apiladas verticalmente:

1. **OperationalHeroBar** — 4 tarjetas semaforizadas (Fill Rate, On-Time, Servicios MTD, GMV MTD) en grid 2x2
2. **DoDTrendChart** — Grafica Recharts de 14 dias con Fill Rate + OTP + lineas de meta (dificil de leer en 390px, ejes cortados)
3. **Secondary KPIs** (4 cards: Cumplimiento, Custodios, AOV, KM) + **OperationalAlerts** (card separada) — en movil se apilan verticalmente, mucho scroll
4. **Estado de Servicios** + **Top 5 Custodios** — 2 cards grandes

Datos disponibles en `useOperationalMetrics`:
- Fill Rate MTD/ayer/mes anterior + target
- On-Time MTD + cambio vs mes anterior
- Servicios MTD (completados, pendientes, cancelados + conteos + cambio %)
- GMV MTD + cambio %
- AOV + KM promedio + cambio %
- Custodios activos + cambio %
- Daily trend 14 dias (solicitados, realizados, fillRate, aTiempo, conRetraso, otpRate)
- Top 10 custodios (name, services, gmv, margen)
- Top 10 clientes (name, services, gmv, aov)
- Monthly breakdown (12 meses)
- Alertas operativas (critical/warning/info/success)

## Mejoras propuestas

### 1. DoDTrendChart compacto para movil
El grafico actual usa `ComposedChart` con Area + Line + 2 ReferenceLine + tooltip complejo. En 390px los labels del eje X se superponen y el tooltip es incomodo.

**Cambio**: En movil, reducir a los ultimos 7 dias (no 14), ocultar el eje Y, reducir altura de 300px a 180px, y simplificar labels del eje X a solo dia numerico (ej: "7", "8", "9").

### 2. Secondary KPIs inline con Hero Bar
En lugar de 4 cards separadas debajo del grafico, integrar Cumplimiento, Custodios, AOV y KM como una fila compacta de "pills" debajo del Hero Bar. Esto ahorra ~160px de altura.

**Cambio**: En `OperationalOverview`, cuando `isMobile`, renderizar los 4 secondary KPIs como una fila horizontal scrollable de mini-badges en lugar de cards completas.

### 3. Alertas como banner compacto
`OperationalAlerts` ocupa una card completa con header. En movil, convertirla en un banner inline de 1 linea (similar a `CriticalAlertsBar`) que solo muestra el conteo de alertas criticas.

**Cambio**: En movil, reemplazar `<OperationalAlerts>` por un banner compacto inline.

### 4. Estado de Servicios + Top Custodios compactos
Las 2 cards de Estado de Servicios y Top Custodios son verbosas. En movil:
- Estado de Servicios: solo mostrar los 3 numeros (Completados/Pendientes/Cancelados) en una fila, sin las barras de progreso
- Top Custodios: limitar a 3 (no 5) y layout mas compacto

## Resultado esperado en 390px

```text
┌─────────────────────────────┐
│ FILL RATE  │ ON-TIME        │ ← Hero 2x2
│ 93.4% 🟡   │ 100% 🟢       │
├────────────┼────────────────┤
│ SERVICIOS  │ GMV MTD        │
│ 318 🟢     │ $4.2M 🟢      │
├─────────────────────────────┤
│ 94%│ 122│ $13K│ 245km       │ ← Pills compactas
│ Cmpl│Cust│ AOV │ KM         │
├─────────────────────────────┤
│ 🔴 2 alertas │ Fill Rate... │ ← Banner 1 linea
├─────────────────────────────┤
│ ▓▓▓▓▓▓▓░░  7d trend        │ ← Grafico 180px, 7d
│            Fill Rate + OTP  │
├─────────────────────────────┤
│ ✅ 285  ⏳ 12  ❌ 5         │ ← Servicios inline
├─────────────────────────────┤
│ 1. Custodio A  42svs $280K  │ ← Top 3 compacto
│ 2. Custodio B  38svs $250K  │
│ 3. Custodio C  35svs $220K  │
└─────────────────────────────┘
```

## Archivos a modificar

- **`src/components/executive/OperationalOverview.tsx`** — Reestructurar layout movil: pills compactas para secondary KPIs, banner de alertas, Top 3 en vez de 5, servicios inline
- **`src/components/executive/DoDTrendChart.tsx`** — En movil: 7 dias, altura 180px, eje Y oculto, labels simplificados
