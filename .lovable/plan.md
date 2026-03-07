
Diagnóstico rápido (ya validado):
- Sí, ya sé cuál es el problema.
- El token de Mapbox sí se obtiene correctamente (`initializeMapboxToken` funciona).
- El mapa se rompe por la URL del Static API en `AlertServiceDrawer.tsx`:
  - Se está enviando `path-...(...)` con un JSON (`LineString`) dentro.
  - `path` en Mapbox Static API exige una polyline codificada, no GeoJSON.
  - Resultado: la imagen falla y aparece el icono de imagen rota.

Plan de corrección

1) Corregir la construcción del overlay del mapa (archivo `src/components/executive/AlertServiceDrawer.tsx`)
- Reemplazar el `pathOverlay` inválido por una de estas dos rutas válidas:
  - Opción preferida: `geojson(...)` con un `FeatureCollection` (línea + puntos).
  - Opción simple: solo pines (`pin-s` + `pin-l`) sin `path`.
- Mantener límite de puntos para evitar URLs demasiado largas (ej. últimos 8–12).

2) Añadir manejo de error visual y degradación controlada
- En el `<img>` del mapa, agregar `onError` para:
  - mostrar fallback “Mapa no disponible” en vez de imagen rota,
  - loguear la URL fallida y status (si aplica) para depuración rápida.
- Si hay solo 1 punto, usar center fijo con zoom; si hay varios, usar `auto`.

3) Robustecer datos de coordenadas antes de armar URL
- Validar `lat/lng` finitos (`Number.isFinite`) y descartar puntos corruptos.
- Redondear coordenadas a 6 decimales para reducir tamaño de URL y evitar errores de parseo.

4) Verificación funcional end-to-end
- Abrir `/dashboard/operativo` en móvil.
- Abrir una alerta con doble tap y confirmar:
  - el mapa renderiza sin imagen rota,
  - se ve la ruta/puntos y el punto actual destacado,
  - servicios sin GPS muestran fallback limpio (sin romper layout).
- Validar al menos 2 alertas distintas para cubrir casos con y sin historial de coordenadas.

Detalle técnico (implementación propuesta)
- Archivo: `src/components/executive/AlertServiceDrawer.tsx`
- Zona: componente `RouteMap` (bloque de creación de `pathOverlay`, `allOverlays`, `url`, y `<img />`).
- Cambio clave: eliminar `path-3+...(${JSON})` y usar formato soportado por Mapbox Static API.
