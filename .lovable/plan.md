

# Iteración 2: Auditor de Segmentos + Sincronización con Rutas y Zonas

## Problema

Los waypoints en `highwaySegments.ts` se corrigieron, pero la tabla `segment_geometries` (200 registros) aún tiene las geometrías Mapbox calculadas con los waypoints viejos. El mapa de "Rutas y Zonas" usa `useSegmentGeometries()` para renderizar, así que muestra las geometrías incorrectas.

Hay **~40 segmentos con distancia Mapbox >200km**, muchos deberían ser 30-100km (ratio >2x). Corregir manualmente no escala — necesitamos una herramienta visual de auditoría y re-enriquecimiento.

## Plan

### 1. Componente `SegmentAuditor.tsx`

Panel dentro del Route Builder tab que:

- Carga `HIGHWAY_SEGMENTS` (170+ del front) y `segment_geometries` (200 de DB)
- Para cada segmento calcula:
  - `expectedKm = kmEnd - kmStart`
  - `mapboxKm = segment_geometries.distance_km`
  - `ratio = mapboxKm / expectedKm`
- Clasifica: OK (ratio <1.5), WARN (1.5-2.0), ERROR (>2.0)
- Tabla ordenada por ratio descendente con filtros (ERROR/WARN/OK/ALL)
- Muestra: ID, nombre, km esperado, km Mapbox, ratio, status, botón "Re-enriquecer"
- Botón "Re-enriquecer seleccionados" → llama `enrich-segment-geometries` con los waypoints actuales de `highwaySegments.ts`
- Botón "Re-enriquecer todos los ERROR (>2x)" → batch

### 2. Botón "Ver en mapa" en cada segmento

Al hacer clic, navega al tab "Rutas y Zonas" con el segmento seleccionado (o muestra preview inline en el auditor).

### 3. Re-enriquecimiento batch

Función que toma los segmentos seleccionados, extrae sus waypoints actuales de `HIGHWAY_SEGMENTS`, y llama `enrich-segment-geometries` edge function para actualizar `segment_geometries`. Después invalida el cache de `useSegmentGeometries` para que "Rutas y Zonas" se actualice automáticamente.

### 4. Integración en `TruckRouteBuilder.tsx`

Agregar tabs internos: "Crear Ruta" (actual) | "Auditoría de Segmentos" (nuevo).

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/components/security/routebuilder/SegmentAuditor.tsx` | Nuevo: tabla de auditoría + re-enrichment |
| `src/components/security/routebuilder/TruckRouteBuilder.tsx` | Agregar tab interno para auditor |

Scope contenido: ~2 archivos, sin cambios de DB ni edge functions (usa `enrich-segment-geometries` existente).

