

# Eliminar dibujo de rutas del Radar Map

## Cambios en `src/components/monitoring/radar/RadarMapDisplay.tsx`

1. **Eliminar imports**: `matchRoute`, `splitRouteAtPosition`, `useSegmentGeometries`
2. **Eliminar función** `getRouteColor`
3. **Eliminar `useMemo`** de `routeData` y `activeDeadZones`
4. **Eliminar ref** `routeMarkersRef`
5. **Eliminar `useEffect`** de rutas (líneas 152-302) — el que dibuja traveled/remaining lines, dead zones, y destination markers
6. **Simplificar leyenda** — quitar entradas de Recorrido, Pendiente, Sin señal, Riesgo, Safe Point (dejar solo los status dots: OK, 30m+, 45m+, Evento, Espera)

Se mantienen intactos: markers de servicios (GPS dots), safe points, inicialización del mapa, fit bounds.

| Archivo | Cambio |
|---------|--------|
| `src/components/monitoring/radar/RadarMapDisplay.tsx` | Eliminar toda la lógica de rutas, dead zones, y leyenda asociada |

