
# Fix: Mapa al 100% del contenedor (compensar zoom 0.7)

## Problema
La pagina aplica `zoom: 0.7` en `html` (linea 153 de `index.css`). Esto reduce el mapa visualmente y puede causar que Mapbox calcule mal el tamaño del canvas. El mapa necesita renderizarse al 100% real de su contenedor.

## Solucion

### Archivo: `src/components/security/map/RiskZonesMap.tsx`

1. **Compensar zoom en el contenedor del mapa**: Aplicar `zoom: var(--zoom-compensation)` (1.4286) al wrapper del mapa para que Mapbox vea el tamaño real del contenedor. Para que el contenedor compensado no desborde su padre, envolver en un div con `overflow: hidden` y ajustar dimensiones inversamente.

   Enfoque concreto: aplicar al div del mapa un estilo inline:
   ```css
   zoom: 1.4286;
   width: 70%;    /* 100% * 0.7 para compensar el zoom inverso */
   height: 70%;
   transform-origin: top left;
   ```
   
   Alternativamente (mas limpio): usar la clase CSS ya existente y hacer que el contenedor padre tenga `overflow: hidden` y el mapContainer tenga el zoom de compensacion.

2. **Llamar `map.resize()`** despues de aplicar la compensacion para que Mapbox recalcule el canvas.

3. **Asegurar que todas las capas se dibujen**: Verificar que la inicializacion de capas (segmentos, POIs, dead zones, safe points) no dependa de condiciones que fallen. Mover la llamada de `map.resize()` al final de la carga de capas.

### Detalle tecnico

En el return del componente, cambiar la estructura:

```tsx
// Wrapper con overflow hidden para contener el mapa compensado
<div className="relative w-full h-full overflow-hidden">
  {loading && (...)}
  {/* El div del mapa con zoom inverso para compensar el 0.7 global */}
  <div 
    ref={mapContainer} 
    className="rounded-lg"
    style={{
      zoom: 1 / 0.7,          // ~1.4286 - compensa el zoom global
      width: `${0.7 * 100}%`, // 70% * 1.4286 zoom = 100% visual
      height: `${0.7 * 100}%`,
      transformOrigin: 'top left',
    }}
  />
  {/* Legend y overlays permanecen fuera del contenedor compensado */}
  {mapReady && (leyenda...)}
</div>
```

Y en el efecto de inicializacion, agregar `map.resize()` tras el load:
```typescript
m.on('load', () => {
  map.current = m;
  setMapReady(true);
  setLoading(false);
  setTimeout(() => m.resize(), 100); // Recalcular tras render
});
```

### Archivos a modificar
- `src/components/security/map/RiskZonesMap.tsx` - Compensar zoom y asegurar capas visibles
