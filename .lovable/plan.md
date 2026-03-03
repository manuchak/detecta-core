

# Plan: 5 Tarjetas DRF con Barras de 4+ Periodos Históricos

## Concepto

Cada tarjeta (DoD, WoW, MoM, QoQ, YoY) muestra **barras horizontales para el periodo actual + 4 periodos anteriores**, permitiendo ver la tendencia del DRF en el tiempo sin gráficas abstractas.

## Layout

```text
┌──── Día ──────────┬──── Semana ───────┬──── Mes ──────────┬── Trimestre ──────┬──── Año ──────────┐
│  Hoy    ██████ 33 │  Esta   █████ 34  │  Mar    ██████ 33 │  Q1-26  █████ 34  │  2026  █████ 34   │
│  Ayer   ██████ 34 │  Ant    █████ 33  │  Feb    █████ 35  │  Q4-25  ████ 38   │  2025  ████ 38    │
│  -2d    ███████ 36│  -2sem  ██████ 35 │  Ene    ██████ 37 │  Q3-25  █████ 36  │  2024  ██████ 42  │
│  -3d    █████ 32  │  -3sem  █████ 34  │  Dic    ████ 40   │  Q2-25  ██████ 41 │  2023  ███████ 48 │
│  -4d    ██████ 35 │  -4sem  ██████ 36 │  Nov    █████ 38  │  Q1-25  ██████ 40 │  2022  ████████ 52│
│  ↓ -1.0 Mejorando│  ↑ +1.0 Estable   │  ↓ -7.0 Mejorando │  ↓ -6.0 Mejorando │  ↓ -18 Mejorando  │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┴───────────────────┘
```

Cada barra coloreada por nivel de riesgo (verde <25, amarillo <50, naranja <75, rojo >=75). La barra más reciente resaltada (font-bold, opacidad completa), las anteriores con opacidad decreciente. Delta al fondo compara periodo actual vs el inmediato anterior.

## Cambios

### 1. `useDetectaRiskFactor.ts` — Calcular 4 periodos históricos por timeframe

Modificar `getPeriodRange` para aceptar un `offset` numérico (0 = actual, 1 = anterior, 2 = hace 2, etc.). Expandir el loop de trends para calcular `history: { label: string, score: number }[]` con 5 entradas (actual + 4 anteriores) por cada periodo. Añadir `history` al tipo `DRFTrend`.

### 2. Nuevo `DRFPeriodCards.tsx`

- Grid `grid-cols-2 md:grid-cols-5`
- Cada tarjeta: título del periodo + 5 barras horizontales apiladas verticalmente
- Barra = `div` con `width` proporcional al score (escala 0-100), coloreada por nivel
- Label a la izquierda (ej: "Feb", "Q4-25"), score a la derecha del extremo de la barra
- Delta al fondo con flecha y color

### 3. `SecurityDashboard.tsx`

- Reemplazar `<DetectaRiskFactorCard />` por `<DRFPeriodCards trends={trends} />`

## Archivos

| Archivo | Acción |
|---------|--------|
| `useDetectaRiskFactor.ts` | Expandir a 5 puntos históricos por periodo (offset 0-4) |
| `DRFPeriodCards.tsx` | **Nuevo**: 5 tarjetas con 5 barras históricas cada una |
| `SecurityDashboard.tsx` | Integrar `DRFPeriodCards` en lugar de `DetectaRiskFactorCard` |

