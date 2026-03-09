

# Trazabilidad de Rutas en el Radar Operativo

## Contexto
Ya existe toda la infraestructura necesaria en el modulo de seguridad:
- **`HIGHWAY_CORRIDORS`** (40+ corredores con waypoints `[lng, lat]`)
- **`segment_geometries`** (geometrias road-snapped via Mapbox Directions API, cacheadas en Supabase)
- **`CELLULAR_DEAD_ZONES`** (20+ zonas sin cobertura con polygons y centros)
- **`CIUDADES_PRINCIPALES`** + `extraerCiudad()` (geocodificacion de origenes/destinos)

## Estrategia
Reutilizar `segment_geometries` (curvas reales de carretera) cuando hay match, con fallback a waypoints de `HIGHWAY_CORRIDORS`. No llamar Directions API en tiempo real (15s refresh lo hace inviable).

## Diseño visual

```text
  🟢 Origen          📍 GPS actual              🏁 Destino
    ●━━━━━━━━━━━━━━━━●┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄◆
    línea sólida 3px     línea punteada 2px
    color del servicio   blanco/50%
    
    ⚠ Zonas sin cobertura: áreas rojas semitransparentes sobre la ruta
```

## Cambios

### 1. `src/lib/radar/routeMatcher.ts` (nuevo)
Utilidad que dado `origen` y `destino` (strings):
- Extrae ciudades con `extraerCiudad()`
- Busca en `HIGHWAY_CORRIDORS` el corredor que conecta ambas ciudades (proximidad de waypoints a las coordenadas de las ciudades)
- Retorna los waypoints del corredor (o sub-tramo relevante) como coordenadas de ruta
- Cruza con `CELLULAR_DEAD_ZONES` filtrando por `corridorId` para obtener las dead zones del trayecto

### 2. `src/hooks/useServiciosTurnoLive.ts`
- Agregar `destLat`, `destLng` a `RadarService` (geocodificando destino con `extraerCiudad`)
- Agregar `corridorId` opcional para el corredor matched

### 3. `src/components/monitoring/radar/RadarMapDisplay.tsx`
Agregar GeoJSON layers al mapa después del `map.on('load')`:

**Rutas (por cada servicio activo con GPS):**
- `line-layer` sólida: origen → posición actual (color del servicio, 3px)
- `line-layer` punteada: posición actual → destino (blanco 50%, dash `[6,4]`, 2px)
- Marcadores: ○ blanco pequeño en origen, ◆ en destino

**Dead zones (overlay):**
- Círculos rojos semitransparentes (`fill-opacity: 0.15`) en las zonas sin cobertura que cruzan las rutas activas
- Solo visibles a zoom ≥ 6
- Icono `📵` o indicator en el popup

**Leyenda:** Agregar "━ Recorrido", "┄ Pendiente", "● Sin señal"

### 4. Lógica de segmentación recorrido/pendiente
Para cada servicio con posición GPS:
- Tomar los waypoints del corredor matched
- Encontrar el waypoint más cercano a la posición GPS actual
- Todo antes = recorrido (sólido), todo después = pendiente (punteado)
- Si no hay match de corredor: línea recta origen→GPS→destino

| Archivo | Cambio |
|---------|--------|
| `src/lib/radar/routeMatcher.ts` | **Nuevo** - Match origen/destino → corredor + dead zones |
| `src/hooks/useServiciosTurnoLive.ts` | Agregar `destLat`/`destLng`/`corridorId` a RadarService |
| `src/components/monitoring/radar/RadarMapDisplay.tsx` | GeoJSON layers para rutas + dead zones overlay |

