

# Fix: Auto-scroll no funciona en cuadrantes del Radar

## Diagnóstico

El auto-scroll programático (`scrollTop += 0.4` via `requestAnimationFrame`) no se activa porque la condición en línea 84 (`scrollHeight <= clientHeight + 10`) nunca se cumple. El contenedor con `overflow-y-auto` en combinación con `flex-1` permite que el div se expanda para contener todo el contenido en lugar de restringir su altura y generar overflow interno.

## Solución

### `src/components/monitoring/radar/RadarServicesList.tsx` — 2 cambios

1. **Scroll container** (línea 149): Cambiar `overflow-y-auto` a `overflow-y-hidden` — el auto-scroll programático funciona con `overflow: hidden` (scrollTop sigue operando), y no necesitamos scrollbar visible ya que es auto-scroll.

2. **Agregar height constraint explícita**: Cambiar el scroll div de `flex-1 overflow-y-auto min-h-0` a `flex-1 overflow-y-hidden min-h-0 h-0` — el `h-0` con `flex-1` fuerza al div a respetar el tamaño del contenedor padre en lugar de expandirse al contenido.

Esto asegura que `scrollHeight > clientHeight` se cumpla cuando hay más tarjetas de las que caben visualmente, activando el loop de auto-scroll.

