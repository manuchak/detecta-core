
# Corregir nombres truncados y mapa invisible en TV Dashboard

## Problemas identificados

### 1. Nombres de custodios cortados
En `TVServicesList.tsx` linea 79, el nombre del custodio tiene `truncate max-w-[120px]` lo que corta nombres como "LUIS GILBERTO..." y "ALEJANDRO RA...". Igualmente, el nombre del cliente en linea 76 tiene `truncate` que corta nombres como "IFC CAN..." y "FABRICA...".

### 2. Mapa no se visualiza
El contenedor del mapa usa `absolute inset-0` pero el padre solo tiene `relative` sin dimensiones explicitas. Cuando el grid le asigna espacio, Mapbox necesita que el contenedor tenga dimensiones reales. El problema es que `absolute inset-0` funciona solo si el padre tiene altura definida, pero con `h-full` en el grid cell esto deberia funcionar. El error real puede ser que Mapbox falla al inicializar cuando el contenedor tiene 0 dimensiones en el momento del mount.

La solucion es usar `w-full h-full` en el div del mapa (revertir el cambio anterior) y asegurar que el contenedor padre tenga dimensiones explicitas pasando `h-full` correctamente por la cadena. Ademas, agregar un listener de `resize` para que Mapbox recalcule sus dimensiones.

## Cambios

### Archivo 1: `src/components/monitoring/tv/TVServicesList.tsx`

- Cambiar el layout de cada fila a dos lineas (wrap) para mostrar nombres completos
- Remover `truncate` y `max-w-[120px]` del custodio
- Remover `truncate` del cliente
- Usar `flex-wrap` o un layout vertical por fila para que los nombres largos se muestren completos
- Reducir ligeramente el font-size si es necesario para balancear

Cambio especifico:
```
// Antes (linea 76-81):
<span className="text-base text-white truncate flex-1 font-medium">
  {s.nombre_cliente || 'Sin cliente'}
</span>
<span className="text-sm text-gray-500 truncate max-w-[120px]">
  {s.custodio_asignado || 'Sin custodio'}
</span>

// Despues:
<span className="text-sm text-white flex-1 font-medium">
  {s.nombre_cliente || 'Sin cliente'}
</span>
<span className="text-sm text-gray-400">
  {s.custodio_asignado || 'Sin custodio'}
</span>
```

### Archivo 2: `src/components/monitoring/tv/TVMapDisplay.tsx`

- Revertir `absolute inset-0` a `w-full h-full` en el div del mapa
- Agregar `map.current.resize()` despues de que el mapa carga (`on('load')`) para forzar recalculo de dimensiones
- Agregar un `ResizeObserver` en el contenedor para llamar `map.resize()` cuando cambie el tamano

Cambio especifico:
```typescript
map.current = new mapboxgl.Map({
  container: mapContainer.current,
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-99.1332, 19.4326],
  zoom: 5.2,
  interactive: false,
  attributionControl: false,
});

map.current.on('load', () => {
  map.current?.resize();
});

// ResizeObserver para recalcular cuando cambie el contenedor
const observer = new ResizeObserver(() => {
  map.current?.resize();
});
observer.observe(mapContainer.current);
```

Y el div del mapa vuelve a `w-full h-full`:
```html
<div ref={mapContainer} className="w-full h-full" />
```
