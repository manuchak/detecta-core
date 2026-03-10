

# Fix: Auto-scroll independiente en los 4 cuadrantes del Radar

## Problema real
El `useBlockAutoScroll` hook ya existe y está bien estructurado, pero tiene un bug: su `useEffect` depende de `[items]`, lo cual causa que **cada vez que los datos se refrescan (cada 15s)**, el efecto se destruye y reinicia — reseteando el scroll a 0 y esperando 3s más para arrancar. Resultado: el scroll nunca avanza lo suficiente para mostrar los 10+ servicios de un cuadrante.

## Solución

### `src/components/monitoring/radar/RadarServicesList.tsx`

1. **Estabilizar el `useEffect`** del auto-scroll: quitar `items` como dependencia directa. En su lugar, usar un ref (`itemsCountRef`) para detectar cambios de cantidad sin resetear el loop de animación.

2. **No resetear scroll al actualizar datos**: Solo reiniciar el auto-scroll si el contenedor pasa de "no necesita scroll" a "sí necesita scroll" (cuando aparecen nuevos servicios que desbordan).

3. **Pausar al hover** (mejora UX para cuando alguien sí está en la compu): detener el auto-scroll temporalmente con `onMouseEnter`/`onMouseLeave` para que un operador pueda leer sin que se mueva.

Cambio en ~30 líneas dentro del hook `useBlockAutoScroll`. Sin cambios en otros archivos.

