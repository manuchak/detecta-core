

# Plan combinado: Truck Route Builder + Corrección masiva de waypoints

## El problema real

Después de **dos rondas de corrección manual**, aún hay **35 segmentos con distancias Mapbox >200km** (muchos deberían ser 30-100km). Ejemplos críticos:

| Segmento | Mapbox dice | Debería ser (kmEnd-kmStart) | Ratio |
|---|---|---|---|
| `qro-jua-6` | 512 km | ~30 km | **17x** |
| `costera-3` | 448 km | ~250 km | 1.8x |
| `qro-jua-10` | 429 km | ~desconocido | — |
| `nog-6` | 397 km | ~desconocido | — |
| `altiplano-3` | 382 km | ~90 km | **4.2x** |
| `vhsa-can-1` | 374 km | ~desconocido | — |
| `pue-oax-2` | 345 km | ~desconocido | — |
| `costera-1` | 326 km | ~240 km | 1.4x |
| `mza-tam-6` | 322 km | ~170 km | 1.9x |
| `mza-tam-2` | 293 km | ~100 km | **2.9x** |
| `lc-cdmx-2` | 284 km | ~60 km | **4.7x** |
| `mza-cdmx-3` | 255 km | ~90 km | **2.8x** |

Corregir manualmente uno por uno **no escala** — ya lo intentamos dos veces. La solución es construir la infraestructura correcta y usarla para auditar/corregir todo el dataset.

## Estrategia: construir la herramienta, luego usarla para arreglar los datos

### Iteración 1 — Core del Route Builder + Edge Function

**A. Base de datos** — Migración SQL:
- Tabla `truck_routes` (origin, destination, waypoints JSONB, vehicle_profile, route_geojson, distance_km, duration_min, status DRAFT/OFFICIAL, version)
- Tabla `truck_route_versions` (route_id, version, geojson, params, diff_metrics)
- RLS: authenticated read all, insert/update own

**B. Edge function `calculate-truck-route`**:
- Recibe origin, destination, waypoints[], vehicle params (max_width, max_weight, alley_bias, exclude flags)
- Llama Mapbox Directions API con `driving` profile, `geojson`, `overview=full`, `alternatives=true`, `continue_straight=true`
- Implementa chunking si >25 coordenadas (overlap 2 puntos, unir geometrías)
- Aplica params: `alley_bias=-1`, `max_width=2.6`, `max_weight=40`, `exclude=unpaved,ferry`
- Selecciona mejor ruta (descarta alternativas con duration >1.15x sin ahorro de distancia)
- Retorna `{ route_geojson, alt_route_geojson, distance_km, duration_min, warnings[] }`

**C. Mapa interactivo `RouteBuilderMap.tsx`**:
- Mapbox GL JS estilo light
- Markers arrastrables para origin, destination, waypoints
- Capa azul: ruta calculada (LineString)
- Capa gris: alternativa
- Recalcular al arrastrar (debounce 500ms)
- Fit bounds automático

**D. Panel de controles `RouteBuilderControls.tsx`**:
- Inputs origen/destino con geocoding (usa `geocodeAddress` existente)
- Lista de waypoints (add/remove/reorder)
- Dropdown perfil vehicular (TRUCK_53 → auto-llena 2.6m/40t/alley -1, TORTON → 2.6m/20t, SUV → default)
- Sliders: max_width_m, max_weight_tons, alley_bias
- Toggles: evitar unpaved, ferry, toll, tunnel
- Botón "CALCULAR RUTA REALISTA" → invoca edge function
- Botón "GUARDAR RUTA OFICIAL" → upsert + versión
- Métricas resultado: km, duración, warnings

**E. Hook `useRouteCalculation.ts`** — Invoca edge function con debounce
**F. Hook `useTruckRoutes.ts`** — CRUD tabla truck_routes
**G. Contenedor `TruckRouteBuilder.tsx`** — Layout sidebar + mapa
**H. Tab en SecurityPage** — 7ma tab "Route Builder" con icono MapPin

### Iteración 2 — Auditor de Segmentos Existentes

**A. Panel "Auditoría de Segmentos"** dentro del Route Builder:
- Consulta `segment_geometries` + `HIGHWAY_SEGMENTS` (front)
- Compara `distance_km` (Mapbox) vs `kmEnd - kmStart` (esperado)
- Calcula ratio y clasifica: OK (<1.5x), WARN (1.5-2x), ERROR (>2x)
- Lista ordenada por ratio descendente
- Botón "Ver en mapa" → muestra geometría actual del segmento con waypoints originales
- Botón "Recalcular con Directions" → usa la misma edge function para generar nueva geometría

**B. Batch re-enrichment**: Función que toma los ~35 segmentos con ratio >2x, los re-procesa con la edge function `calculate-truck-route` (que usa los mismos params que `enrich-segment-geometries` pero con validación de calidad), y actualiza `segment_geometries`.

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `supabase/migrations/xxx.sql` | Tablas truck_routes + truck_route_versions + RLS |
| `supabase/functions/calculate-truck-route/index.ts` | Edge function core |
| `src/components/security/routebuilder/TruckRouteBuilder.tsx` | Contenedor |
| `src/components/security/routebuilder/RouteBuilderMap.tsx` | Mapa interactivo |
| `src/components/security/routebuilder/RouteBuilderControls.tsx` | Panel controles |
| `src/components/security/routebuilder/SegmentAuditor.tsx` | Panel auditoría |
| `src/hooks/security/useRouteCalculation.ts` | Hook cálculo |
| `src/hooks/security/useTruckRoutes.ts` | CRUD hook |
| `src/pages/Security/SecurityPage.tsx` | Agregar tab |

Debido al volumen de código, la implementación se divide en 2 mensajes: primero el core (DB + edge function + mapa básico), luego controles completos + auditor.

