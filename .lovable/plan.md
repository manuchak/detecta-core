

# Fix: Mostrar ruta road-snapped en el PDF (como se ve en el sistema)

## Problema

El mapa del PDF solo muestra markers con una línea recta (rota por el formato de coordenadas), mientras que el sistema muestra la ruta real pegada a carreteras usando el Mapbox Directions API.

## Solución

Usar la misma fuente de datos que el mapa interactivo: invocar `calculate-truck-route` (edge function) para obtener el `route_geojson`, luego codificar esas coordenadas como **polyline** en el Mapbox Static Images API.

### Cambios en `ServiceDetailPDF.tsx`

**1. Nueva función `fetchRouteGeojson`** — Llama a la edge function `calculate-truck-route` con origen, destino y waypoints extraídos de los eventos (misma lógica que `useBitacoraTraza`). Retorna las coordenadas del GeoJSON.

**2. Actualizar `generateStaticMapBase64`** — Recibe opcionalmente las coordenadas del route GeoJSON. Si las tiene, las usa como path en vez de las coordenadas crudas de los eventos. Usa el formato correcto de la API: `path-4+3b82f6-0.7(lng1,lat1,lng2,lat2,...)` (comas, sin punto y coma). Simplifica las coordenadas si son demasiadas (Mapbox URL limit ~8192 chars) usando un algoritmo de decimación.

**3. Actualizar `handleGenerate`** — Antes de generar el mapa estático, llama a `fetchRouteGeojson` para obtener la traza real. La pasa a `generateStaticMapBase64`.

### Resultado visual
- Ruta azul pegada a las calles (igual que en el sistema)
- Markers de colores en cada evento
- Bbox ajustado a la ruta completa (no solo a los markers)
- Color de línea `#3b82f6` (azul, como en el mapa interactivo)

### Archivo a editar
- `src/components/monitoring/tiempos/ServiceDetailPDF.tsx`

