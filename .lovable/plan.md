

# Radar: Layout 2x2 con scroll independiente por cuadrante

## Problema
Los 4 segmentos (Alerta, En Ruta, Por Iniciar, En Evento) están apilados verticalmente, cada uno con 25% de altura. Con solo 2 servicios en un grupo, ya se llena el espacio visible. El auto-scroll existe pero no se nota porque hay poco contenido vertical.

## Solución
Cambiar el layout de los 4 bloques de **columna vertical** a **grid 2x2**, duplicando el espacio horizontal disponible y reduciendo el desperdicio vertical.

```text
┌─────────────────────────────────────┐
│  ⚠ ALERTA        │  EN RUTA        │
│  (scroll ↕)      │  (scroll ↕)     │
├───────────────────┼─────────────────┤
│  POR INICIAR      │  EN EVENTO      │
│  (scroll ↕)      │  (scroll ↕)     │
└─────────────────────────────────────┘
```

Cada cuadrante mantiene su propio auto-scroll independiente (ya implementado con `useBlockAutoScroll`).

## Cambios

### `src/components/monitoring/radar/RadarServicesList.tsx`
- Cambiar el contenedor de `flex flex-col` a `grid grid-cols-2 grid-rows-2`
- Cada `ServiceBlock` ocupa una celda del grid en vez de `h-1/4`
- Ajustar bordes: derecho para col-1, inferior para row-1
- El auto-scroll por bloque ya funciona — sin cambios en el hook

### `src/pages/Monitoring/ServiceRadarPage.tsx`
- Ajustar proporción del grid: dar más espacio a la lista de servicios (de `col-span-4` a `col-span-5`, mapa de `col-span-8` a `col-span-7`) para que las 2 columnas del grid tengan suficiente ancho

