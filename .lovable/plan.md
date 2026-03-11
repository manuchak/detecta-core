

# Vista Móvil del Módulo de Monitoreo

## Problema

El módulo `/monitoring` tiene 10 pestañas diseñadas exclusivamente para desktop. No usa `useIsMobile`, no desactiva el zoom 0.7, y los layouts de columnas (3-col grid en Bitácora, mapas de 500px, tablas anchas) son inutilizables en móvil.

## Estrategia General

1. **Wrapper `MonitoringMobileLayout`** que detecta `useIsMobile()` y renderiza una experiencia completamente diferente
2. **Zoom reset** a 1.0 en móvil (como hacen TVPage y LMSZoomReset)
3. **Bottom navigation** con iconos para las pestañas principales en lugar del TabsList horizontal
4. **Stack vertical** en lugar de grids multi-columna
5. Cada pestaña recibe adaptaciones específicas para táctil

## Arquitectura

```text
MonitoringPage.tsx
  └── useIsMobile() ?
       ├── true  → <MonitoringMobilePage />
       │            ├── Zoom reset (html.style.zoom = '1')
       │            ├── Header compacto (título + refresh)
       │            ├── Scrollable tab selector (horizontal pills)
       │            └── Contenido por tab (componentes adaptados)
       └── false → Layout desktop actual (sin cambios)
```

## Plan por Pestaña

### 1. Performance
- Metric cards en grid 2x2 (en vez de row)
- Charts con `h-[180px]` y scroll horizontal si necesario
- Tabla de problemas en cards apiladas en vez de tabla

### 2. Posicionamiento
- Mapa full-width `h-[250px]`
- Summary cards horizontales scrollables (pills)
- Lista de servicios debajo del mapa (sin sidebar)
- Weather widget colapsable

### 3. Checklists
- Dashboard pills horizontales scrollables
- Tabla → lista de cards con badge de estado
- Panel de alertas inline debajo (no sidebar)

### 4. Adopción Digital
- Dashboard metrics en pills
- Tabla → cards apiladas con avatar + estado

### 5. Incidentes
- Ya es panel único — verificar que formularios usen sheets/drawers correctamente
- Ajustar anchos de columnas de tabla

### 6. Bitácora (MÁS COMPLEJO)
- Grid de 3 columnas → **tabs horizontales internos** ("Por Iniciar", "En Curso", "Eventos")
- Cada sub-tab es una lista vertical scrollable
- MonitoristaAssignmentBar → colapsable o en sheet
- Filtro de monitorista en header compacto
- Cards con acciones inline (swipe o botones visibles)

### 7. Tiempos
- Tabla → cards con deltas prominentes
- Vista de detalle: mapa arriba, datos abajo (stack)

### 8. Coordinación C4
- MonitoristaCards en lista vertical
- Footer pills → bottom sheet con secciones
- Handoff dialog → full-screen sheet

### 9. Pruebas Comm / Reglas
- Ya son contenido scrollable — ajustar padding y font sizes

## Componentes Nuevos

| Archivo | Descripción |
|---|---|
| `src/components/monitoring/mobile/MonitoringMobileShell.tsx` | Shell con zoom reset, header, tab selector horizontal |
| `src/components/monitoring/mobile/MobileTabSelector.tsx` | Pills scrollables horizontalmente para las 10 pestañas |
| `src/components/monitoring/mobile/MobileBitacoraBoard.tsx` | Bitácora adaptada con sub-tabs internos en vez de 3 columnas |
| `src/components/monitoring/mobile/MobilePerformanceView.tsx` | Performance con cards 2x2 y charts compactos |
| `src/components/monitoring/mobile/MobilePositioningView.tsx` | Mapa + lista apilados verticalmente |
| `src/components/monitoring/mobile/MobileCoordinatorView.tsx` | C4 con monitoristas en lista y sheets para tools |

## Archivos Modificados

| Archivo | Cambio |
|---|---|
| `src/pages/Monitoring/MonitoringPage.tsx` | Bifurcación `useIsMobile()` → render móvil o desktop |

## Patrones Reutilizados

- **Zoom reset**: `html.style.zoom = '1'` en useEffect (patrón TVPage/LMS)
- **Safe area**: `safe-area-inset-bottom` para bottom nav
- **Scroll momentum**: `overflow-y-auto` sin `overscroll-y-contain`
- **GPU layer forcing**: `transform: translateZ(0)` en contenedores de iconos
- **Touch targets**: mínimo 44px para botones de acción
- **Sheets para modales**: Vaul drawers en vez de Dialog en móvil

