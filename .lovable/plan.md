

# Adaptación StarMap para Móvil — Análisis UI y Plan

## Problemas detectados en 390px

```text
┌──────────────────────────────┐
│  PROBLEMAS ACTUALES (390px)  │
├──────────────────────────────┤
│                              │
│ 1. SVG RADAR (400x400)       │
│    → Ocupa ~100% del ancho   │
│    → Nodos de 22px con texto │
│      de 7-9px = ilegible     │
│    → Labels "% datos" se     │
│      solapan con nodos       │
│    → Targets táctiles de     │
│      ~22px < 44px mínimo iOS │
│                              │
│ 2. NORTH STAR BANNER         │
│    → Texto "Servicios        │
│      Completados Netos       │
│      Validados" se trunca    │
│    → "Faltan:" lista larga   │
│      se desborda             │
│                              │
│ 3. PILLAR GRID (2 cols)      │
│    → Cards de ~175px ancho   │
│    → Texto truncado          │
│    → KPI dots casi invisibles│
│                              │
│ 4. DETAIL PANEL              │
│    → Se apila bajo el radar  │
│      (grid-cols-1 en <lg>)   │
│    → Scroll largo innecesario│
│    → Campos "proxy" + valor  │
│      + badge no caben en row │
│                              │
│ 5. DATA HEALTH + INCIDENTS   │
│    → Cards completas apiladas│
│    → Mucho scroll vertical   │
│    → InstrumentationRoadmap  │
│      ocupa espacio sin valor │
│      inmediato en móvil      │
│                              │
└──────────────────────────────┘
```

## Estrategia: Mobile-first vertical flow con drawer para detalle

En 390px, el radar hexagonal con 6 nodos es legible pero los targets son demasiado pequeños. En lugar de forzar toda la información en una vista, usaremos un flujo vertical optimizado con un Drawer (Vaul) para el detalle de pilares.

## Cambios por archivo

### 1. `src/components/starmap/StarMapVisualization.tsx`
- Aumentar `nodeR` de 22→28 (selected 28→34) para cumplir target táctil de 44px
- Aumentar font de score de 11→13 y shortName de 7→9
- Eliminar labels "% datos" fuera del nodo (redundante, se ve en la grid)
- Agregar `touch-action: manipulation` al `<g>` para evitar delay de 300ms

### 2. `src/pages/Dashboard/ExecutiveDashboard.tsx` — `StarMapInlineContent`
- Detectar `isMobile` con el hook existente
- En móvil: reemplazar `PillarDetailPanel` inline por un `Drawer` (Vaul) que se abre al tocar un pilar
- North Star banner: stack vertical en móvil (icono + texto arriba, valor abajo)
- Pillar grid: 1 columna en móvil, como lista compacta con icono + nombre + score + barra, en lugar de cards
- Ocultar `DataHealthSummary` en móvil (mantener solo el `IncidentPanel`)
- Ocultar placeholder "Selecciona un pilar" en móvil (el drawer se abre al tocar)

### 3. `src/components/starmap/PillarDetailPanel.tsx`
- Ajustar para funcionar dentro de un Drawer: max-height controlado, sin Card wrapper cuando está en drawer
- KPI rows: stack vertical del valor + badge en pantallas estrechas

### 4. `src/pages/StarMap/StarMapPage.tsx` (standalone page)
- Aplicar misma lógica: en móvil usar Drawer para detalle, header compacto, pillar list en 1 col
- Padding reducido (px-4 py-4)

## Layout resultante en móvil

```text
┌─────────────────────────┐
│ ⭐ NORTH STAR    proxy  │
│ SCNV             72%    │
│ Score: 58               │
├─────────────────────────┤
│                         │
│    ╭──────────────╮     │
│   ╱   SVG Radar    ╲   │
│  │  (nodos grandes)  │  │
│  │   tap = drawer    │  │
│   ╲                 ╱   │
│    ╰──────────────╯     │
│ Toca un pilar · 90 días │
├─────────────────────────┤
│ 🛡 Seguridad      72 ▓▓│
│ 👥 Talento        45 ▓░│
│ 📊 Finanzas       68 ▓▓│
│ ⚡ Operación      81 ▓▓│
│ 🤝 Comercial      55 ▓░│
│ 📈 Crecimiento    40 ▓░│
├─────────────────────────┤
│ 🛡 Incidentes Operativos│
│ [+ Reportar]            │
│ ────────────────────────│
│ alta  Robo     CDMX  01│
│ media Falla GPS  Qro 28│
└─────────────────────────┘

  ┌─ DRAWER (al tocar pilar) ─┐
  │ 🛡 Seguridad    72/100    │
  │ 45% cobertura             │
  │                           │
  │ KPIs con datos            │
  │ R1 Tasa incidentes   2.3% │
  │    ● En meta              │
  │ R2 Controles efectivos 80%│
  │    ⚠ Riesgo               │
  │                           │
  │ Requieren instrumentación │
  │ R3 Tiempo respuesta       │
  │ R4 Costo por incidente    │
  └───────────────────────────┘
```

## Archivos a modificar
- `src/components/starmap/StarMapVisualization.tsx` — nodos más grandes, sin labels externos
- `src/pages/Dashboard/ExecutiveDashboard.tsx` — StarMapInlineContent con Drawer en móvil
- `src/components/starmap/PillarDetailPanel.tsx` — layout responsive para drawer
- `src/pages/StarMap/StarMapPage.tsx` — misma adaptación móvil

