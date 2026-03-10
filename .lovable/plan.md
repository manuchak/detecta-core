

# Fix: Auto-scroll en cuadrantes Alerta y En Ruta

## Diagnóstico

La cadena de alturas está rota. El wrapper div de cada celda del grid (línea 222-228) no tiene `h-full`, por lo que `ServiceBlock` con `h-full` no resuelve correctamente su altura. Resultado: el contenedor de scroll nunca detecta overflow (`scrollHeight <= clientHeight`), y el loop de auto-scroll no arranca.

## Solución

### `src/components/monitoring/radar/RadarServicesList.tsx`

1. **Celda wrapper**: Agregar `h-full` al div wrapper de cada celda del grid (línea 224) para que la cadena de alturas sea: `grid row (1fr)` → `cell (h-full)` → `ServiceBlock (h-full)` → `scroll div (h-0 flex-1)`.

2. **Re-evaluar scroll cuando el layout se estabiliza**: El `startScroll` se llama 3s después del mount, pero el grid puede no tener alturas finales aún. Agregar un `ResizeObserver` en el scroll ref para detectar cuando el contenedor obtiene su altura real y re-intentar iniciar el scroll si no estaba corriendo.

Cambio principal — una línea en el wrapper + observer de respaldo.

