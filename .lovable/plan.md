

# Auditoría: Geometrías enriquecidas vs realidad carretera

## Hallazgos críticos del análisis

Crucé los waypoints del sistema contra las geometrías ya enriquecidas por Mapbox (tabla `segment_geometries`). Los resultados revelan **errores sistemáticos graves** en múltiples categorías:

### 1. Segmentos con distancias absurdas (Mapbox tomó desvíos por sierra/montaña)

Los waypoints fuerzan a Mapbox a rutear por caminos de terracería, sierras y brechas porque las coordenadas no caen sobre carreteras reales:

| Segmento | Distancia Mapbox | Distancia esperada | Problema |
|---|---|---|---|
| `lc-cdmx-2` | **517 km** | ~80 km | Waypoints en sierra Michoacán sin carretera — Mapbox da vuelta por toda la costa |
| `lc-cdmx-3` | **156 km** | ~30 km | Misma sierra, waypoints en medio del bosque |
| `costera-2` | 659 km | ~200 km | Waypoints cruzan Sierra Madre del Sur sin carretera |
| `costera-3` | 650 km | ~250 km | LC→Manzanillo forzado por ruta imposible |
| `mza-tam-2` | **293 km** | ~100 km | Colima→Macrolib debería ser 110km, Mapbox triplicó |
| `altiplano-3` | **323 km** | ~150 km | Zacatecas→SLP por ruta incorrecta |
| `lc-cdmx-8` | **234 km** | ~100 km | Atlacomulco→CDMX triplicada |
| `mza-cdmx-3` | **243 km** | ~90 km | Macrolib GDL a La Barca inflada |
| `mza-cdmx-5` | **232 km** | ~130 km | Zamora→Morelia inflada |
| `slp-mat-6` | **248 km** | ~100 km | La Ventura→Saltillo, desvío masivo |
| `gdl-tep-3` | **160 km** | ~50 km | Sierra de Nayarit, Mapbox tomó desvío |

**Causa raíz**: Los waypoints son coordenadas "a ojo" que caen en lagos, montañas o zonas sin carretera. Mapbox intenta conectarlas y termina ruteando por caminos de terracería de 500km para cubrir 80km lineales.

### 2. Corredores que arrancan desde GDL urbano (no Macrolibramiento)

Tres segmentos arrancan desde `[-103.35, 20.67]` — **latitud 20.67, que es zona urbana norte de Guadalajara**, no el Macrolibramiento (latitud ~20.10-20.37):

| Segmento | Primer coord enriquecida | Debería ser |
|---|---|---|
| `gdl-lag-1` | [-103.35, **20.67**] | [-103.06, **20.37**] Zapotlanejo (Macrolib) |
| `gdl-tep-1` | [-103.35, **20.67**] | [-103.58, **20.05**] Acatlán (Macrolib sur) |
| `nog-1` | [-103.35, **20.67**] | [-103.06, **20.37**] o [-103.58, **20.13**] |

### 3. Corredor Lázaro Cárdenas-CDMX: geometría rota

Los segmentos `lc-cdmx-2` y `lc-cdmx-3` suman **673 km** de distancia Mapbox para lo que debería ser ~110 km de sierra. Los waypoints caen en medio de la Sierra Madre sin carretera pavimentada, forzando a Mapbox a rutear por Uruapan→Morelia→vuelta completa.

### 4. Corredor Costera del Pacífico: 1,575 km reales vs ~650 km esperados

Los segmentos `costera-1`, `costera-2` y `costera-3` suman **1,575 km** para Acapulco→LC→Manzanillo. La ruta real es ~650km. Los waypoints cruzan la Sierra Madre del Sur en línea recta.

### 5. Segmentos que cruzan agua/terreno imposible

Revisando coordenadas contra geografía:
- Varios waypoints del corredor Bajío pasan por zonas agrícolas sin autopista
- Corredor `veracruz-monterrey` salta de Veracruz a SLP en línea recta cruzando la Sierra Madre Oriental
- Corredor `queretaro-ciudad-juarez` tiene saltos de 200+ km entre waypoints, cruzando desierto sin puntos intermedios

## Plan de corrección

### Fase 1: Corregir los ~15 segmentos con distancias >2x la esperada

Para cada segmento donde Mapbox devolvió una distancia absurda, corregir los waypoints para que caigan sobre carreteras reales. La métrica es simple: si `distancia_mapbox > 1.5 * distancia_esperada`, el waypoint está mal.

**Segmentos prioritarios** (distancia Mapbox > 2x esperada):
- `lc-cdmx-2`, `lc-cdmx-3` (sierra Michoacán)
- `costera-1`, `costera-2`, `costera-3` (Sierra Madre Sur)
- `mza-tam-2` (Colima→Macrolib)
- `altiplano-3` (Zacatecas→SLP)
- `lc-cdmx-8` (Atlacomulco→CDMX)
- `mza-cdmx-3`, `mza-cdmx-5` (corredor nuevo)
- `slp-mat-6` (Altiplano potosino)
- `gdl-tep-3` (Sierra de Nayarit)

### Fase 2: Corregir arranques desde GDL urbano

Mover los waypoints iniciales de `gdl-lag-1`, `gdl-tep-1` y `nog-1` al Macrolibramiento real.

### Fase 3: Re-enriquecer geometrías

Invocar `enrich-segment-geometries` para todos los segmentos corregidos (~20 segmentos).

### Fase 4: Validación automática

Agregar una función de validación que compare `distancia_mapbox` vs `kmEnd - kmStart` del segmento y alerte si difieren >50%.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwaySegments.ts` | Corregir waypoints de ~20 segmentos con coordenadas sobre carreteras reales |
| `src/lib/security/highwayCorridors.ts` | Corregir waypoints de ~5 corredores (costera, LC-CDMX, veracruz-mty, altiplano) |
| Edge function `enrich-segment-geometries` | Invocar para re-procesar segmentos corregidos |

