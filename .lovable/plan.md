

# Fix: Mapa expandido no ocupa el ancho completo del Dialog

## Problema

El mapa dentro del dialog expandido no se extiende al 100% del ancho disponible (hay un espacio vacio a la derecha). Esto ocurre porque Mapbox calcula las dimensiones del canvas al momento de la inicializacion, pero el dialog aun no ha terminado su animacion de apertura en ese instante.

## Solucion

Modificar la inicializacion del mapa expandido en `LocationPicker.tsx` para:

1. Llamar `map.resize()` dentro del evento `load` del mapa
2. Agregar un `ResizeObserver` al contenedor del mapa expandido para recalcular dimensiones automaticamente
3. Agregar un segundo `resize()` con delay de 300ms para cubrir la animacion del dialog

## Cambios

**Archivo: `src/components/monitoring/incidents/LocationPicker.tsx`**

En el `useEffect` que inicializa el mapa expandido (linea 132-190), despues de crear la instancia de Mapbox:

- Agregar `map.on('load', () => map.resize())` para forzar recalculo al cargar
- Agregar `ResizeObserver` sobre `expandedMapContainerRef.current` que llame `map.resize()`
- Agregar `setTimeout(() => map.resize(), 350)` para cubrir la animacion del dialog
- Limpiar el observer en el return del useEffect

### Codigo relevante del cambio

Dentro del `setTimeout` existente (linea 140), despues de `expandedMarkerRef.current = marker` (linea 181):

```
map.on('load', () => map.resize());
setTimeout(() => map.resize(), 350);

const observer = new ResizeObserver(() => map.resize());
observer.observe(expandedMapContainerRef.current);
```

Y en el cleanup (linea 184-189), agregar `observer.disconnect()`.

Solo se modifica un archivo, y el cambio es de ~6 lineas.

