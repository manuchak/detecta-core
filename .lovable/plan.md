
Diagnóstico rápido:
- Revisé `src/components/monitoring/tiempos/ServiceDetailPDF.tsx` y la URL que se está pidiendo a Mapbox.
- La ruta se está enviando como lista cruda `lng,lat,lng,lat...` en `path-...(...)`.
- Según la documentación oficial de Mapbox Static Images, `path(...)` exige un **encoded polyline (precision 5) como URI component**, no lista cruda de coordenadas.
- Resultado: el request responde 200 con mapa + markers, pero el overlay de ruta se ignora (por eso “sigue sin dibujar”).

Do I know what the issue is?
- Sí: el formato del overlay `path` es inválido para Mapbox Static API.

Plan de implementación:
1) Corregir el formato de la ruta en PDF (archivo único)
- Archivo: `src/components/monitoring/tiempos/ServiceDetailPDF.tsx`.
- Agregar util interno para codificar polyline (precision 5) desde `number[][]` (`[lng,lat]`).
- Construir `pathStr` como:
  - `path-{width}+{color}-{opacity}(${encodeURIComponent(encodedPolyline)})`
- Eliminar uso de `pathCoords` crudo en el URL.

2) Mantener la ruta real del sistema (road-snapped)
- Conservar `fetchRouteCoordinates()` (edge function `calculate-truck-route`) como fuente principal.
- Fallback a puntos de eventos solo si no hay `route_geojson`.

3) Robustecer contra límite de URL (8192 chars)
- Mantener simplificación de puntos, pero hacerla adaptativa:
  - intentar con N puntos (p.ej. 250),
  - si URL excede umbral seguro (~7600), reducir (200 → 150 → 100 → 60).
- Registrar en `console.warn` cuando se reduzcan puntos para diagnóstico.

4) Mejorar visibilidad visual en PDF
- Subir contraste de línea para que en PDF (escala @2x + reducción) no “desaparezca”:
  - ancho 6 (o 7), opacidad 0.95, color azul consistente con mapa en sistema (`#60a5fa` / `#3b82f6`).
- Mantener markers como están.

5) Validación funcional (mismo servicio reportado)
- Generar PDF del mismo caso de Supply.
- Verificar en Network que el overlay quede como `path-...(%xx...)` (polyline codificado), no coma-separado.
- Confirmar que la línea azul aparece y sigue carreteras como en el mapa interactivo.
- Probar un servicio corto y uno largo para validar visibilidad y límite de URL.

Detalles técnicos (para implementación):
- Funciones nuevas en el mismo archivo:
  - `encodePolyline(coords: number[][]): string`
  - helpers de encoded polyline (delta + signed value encoding).
- Reemplazo puntual en `generateStaticMapBase64`:
  - de `pathCoords` string crudo
  - a `encodedPolyline` + `encodeURIComponent`.
- Sin cambios de BD ni Edge Functions.
